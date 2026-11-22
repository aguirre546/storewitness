import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Execute the actual entry point. The harness replaces browser I/O, not handlers.
const source=(await readFile(new URL('../web/app.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const board=id=>({id,name:'Store '+id,mode:'camera',status:'OPEN',reason:'Current observation',source:'camera',serverTime:1000,revision:1,count:3,history:[]});
const response=data=>({ok:true,json:async()=>data});
const settle=async()=>{for(let n=0;n<15;n++)await Promise.resolve();};

function fixture(route=()=>undefined){
 const elements=new Map(),intervals=new Map(),timeouts=new Map(),requests=[],events=[];let timerNumber=0;
 function element(id){
  if(!elements.has(id))elements.set(id,{id,value:'',textContent:'',hidden:false,disabled:false,checked:false,files:[],type:'text',style:{setProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){}},
   setAttribute(){},removeAttribute(){},replaceChildren(){},append(){},focus(){},select(){},setSelectionRange(){},querySelector(){return element(id+':child');},querySelectorAll(){return [];},play:async()=>{},
   getContext:()=>({drawImage(){},getImageData:()=>({width:120,height:80,data:new Uint8ClampedArray(120*80*4)})})});
  return elements.get(id);
 }
 element('scan-mode').value='text';element('store-mode').value='camera';element('store-name').value='Demo';element('override-duration').value='15';
 Object.assign(element('camera-video'),{videoWidth:1920,videoHeight:1080,readyState:4});
 const track={stop(){this.stopped=true;},getSettings:()=>({deviceId:'camera',width:1920,height:1080})},stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const scanner=deferred(),location={href:'https://storewitness.test/',origin:'https://storewitness.test'};
 const window={addEventListener(){},dispatchEvent:event=>events.push(event.type),scrollTo(){}};
 const context=vm.createContext({
  URL,Date,Intl,JSON,Math,Number,String,Array,Map,Promise,Uint8ClampedArray,Blob,
  document:{hidden:false,getElementById:element,querySelector:element,querySelectorAll:()=>[],addEventListener(){},createElement:element,body:{append(){}}},window,location,
  history:{replaceState(_a,_b,url){location.href=String(url);},pushState(_a,_b,url){location.href=String(url);}},
  Event:class{constructor(type){this.type=type;}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  requestAnimationFrame:fn=>fn(),
  setInterval:(fn,ms)=>{const id=++timerNumber;intervals.set(id,{fn,ms});return id;},clearInterval:id=>intervals.delete(id),
  setTimeout:(fn,ms)=>{const id=++timerNumber;timeouts.set(id,{fn,ms});return id;},clearTimeout:id=>timeouts.delete(id),
  AbortSignal:{timeout:()=>({})},crypto:{randomUUID:()=> 'observation-id'},
  navigator:{mediaDevices:{enumerateDevices:async()=>[{kind:'videoinput',deviceId:'camera',label:'Test camera'}]}},
  setupCameraTools:()=>({attach:async()=>{},constraints:()=>({video:true}),options:()=>({}),report(){}}),setupSnapshots(){},
  absoluteTime:at=>String(at),storeTime:at=>String(at),frameSize:(width,height)=>({width,height}),requestCamera:async()=>stream,
  loadSignReader:()=>scanner.promise,readSign:async()=>({status:'OPEN',confidence:.9,reason:'Readable OPEN sign'}),detectMarker:()=>({status:'OPEN',confidence:1,reason:'Marker'}),
  fetch:async(path,options)=>{const request={path,options};requests.push(request);const custom=route(request);if(custom!==undefined)return await custom;const id=path.split('/')[3];return response({...board(id),...(path.endsWith('/override')?{override:{expiresAt:Date.now()+900000}}:{})});}
 });
 vm.runInContext(source+'\n;globalThis.__state=()=>({paired,publicId,stream,timer,refreshing,refreshFailures,nextRefresh,starting,readerLoading});',context,{filename:'web/app.mjs'});
 const connect=async(id,token='key-'+id)=>{element('store-id').value=id;element('pairing-token').value=token;await element('connect-store').onclick();await settle();};
 return {element,connect,requests,events,intervals,scanner,track,state:()=>context.__state(),refresh:()=>[...intervals.values()].find(timer=>timer.ms===5000).fn()};
}

test('Stop during OCR preparation cannot restart observation or send a camera reading',async()=>{
 const f=fixture();await f.connect('A');
 // Enable an existing camera in marker mode, then request text observation.
 f.element('scan-mode').value='marker';await f.element('enable-camera').onclick();
 f.element('scan-mode').value='text';const starting=f.element('start-observation').onclick();await settle();
 assert.equal(f.state().readerLoading,true);assert.ok(f.state().stream);
 f.element('stop-observation').onclick();f.scanner.resolve({});await starting;await settle();
 assert.equal(f.state().stream,null);assert.equal(f.state().timer,null);assert.equal(f.state().starting,false);
 assert.equal(f.track.stopped,true);assert.equal([...f.intervals.values()].some(timer=>timer.ms===10000),false);
 assert.equal(f.requests.some(request=>request.path.endsWith('/observe')),false);assert.equal(f.element('start-observation').textContent,'Start observing');
});

test('A late failed connection cannot clear a newer owner or replace their credentials',async()=>{
 const old=deferred(),f=fixture(({path})=>path==='/api/boards/A/pair'?old.promise:undefined);
 const first=f.connect('A','key-A');await settle();await f.connect('B','key-B');
 old.reject(Error('Old connection failed'));await first;
 assert.equal(f.state().paired.id,'B');assert.equal(f.state().paired.token,'key-B');assert.equal(f.element('rotate-token').disabled,false);
 await f.element('override-closed').onclick();
 const write=f.requests.find(request=>request.path.endsWith('/override'));assert.equal(write.path,'/api/boards/B/override');assert.equal(write.options.headers.authorization,'Bearer key-B');
 assert.notEqual(f.element('error-banner').textContent,'Old connection failed');
});

test('A late refresh error cannot mark the new store offline or delay its next refresh',async()=>{
 const old=deferred(),f=fixture(({path,options})=>path==='/api/boards/A'&&options.method==='GET'?old.promise:undefined);
 await f.connect('A');assert.equal(f.state().refreshing,true);await f.connect('B');
 old.reject(Error('Store A network failed'));await settle();
 assert.equal(f.state().publicId,'B');assert.equal(f.state().refreshFailures,0);assert.equal(f.state().nextRefresh,0);
 assert.equal(f.events.includes('storewitness-offline'),false);assert.notEqual(f.element('public-status').textContent,'Unavailable');
 await f.refresh();assert.ok(f.requests.some(request=>request.path==='/api/boards/B'&&request.options.method==='GET'));
 assert.equal(f.element('public-store-name').textContent,'Store B');assert.equal(f.element('public-status').textContent,'Open');
});

test('An interrupted unvalidated connection does not replace the existing owner key',async()=>{
 const incoming=deferred(),f=fixture(({path})=>path==='/api/boards/B/pair'?incoming.promise:undefined);
 await f.connect('A','key-A');const pending=f.connect('B','unvalidated-key-B');await settle();
 assert.equal(f.state().paired.id,'A');f.element('stop-observation').onclick();incoming.resolve(response(board('B')));await pending;
 assert.equal(f.state().paired.id,'A');assert.equal(f.state().paired.token,'key-A');
 const attempt=f.requests.find(request=>request.path==='/api/boards/B/pair');assert.equal(attempt.options.headers.authorization,'Bearer unvalidated-key-B');
});
