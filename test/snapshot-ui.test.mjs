import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// The worker serves shared src modules at the web root; resolve that route for this Node harness.
const source=(await readFile(new URL('../web/snapshot-ui.mjs',import.meta.url),'utf8')).replace("'./lifecycle.mjs'",JSON.stringify(new URL('../src/lifecycle.mjs',import.meta.url).href));
const {setupSnapshots}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

function fixture(){
 const original={document:globalThis.document,window:globalThis.window,createImageBitmap:globalThis.createImageBitmap};
 const elements=new Map(),events=new Map(),loads=[],requests=[];let owner={id:'store-a',mode:'camera'};
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',files:[],hidden:true,checked:false,disabled:false,textContent:'',removeAttribute(name){delete this[name];},replaceChildren(){},append(){}});return elements.get(id);};
 globalThis.document={getElementById:element,createElement:tag=>{assert.equal(tag,'canvas');return {getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,/9j/2Q=='};}};
 globalThis.window={addEventListener:(name,fn)=>events.set(name,fn)};
 globalThis.createImageBitmap=()=>new Promise((resolve,reject)=>loads.push({resolve,reject}));
 setupSnapshots({getPaired:()=>owner,video:{srcObject:{},videoWidth:640,videoHeight:480},request:async(...args)=>{requests.push(args);return {};},onResult:()=>{}});
 return {element,loads,requests,setOwner:value=>{owner=value;},select(){element('snapshot-file').files=[{type:'image/jpeg',size:10}];return element('snapshot-file').onchange();},image(){return {width:640,height:480,close(){this.closed=true;}};},restore(){for(const [key,value]of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}};
}

test('A slow CCTV image selected on one store cannot be prepared or shared under another',async()=>{
 const f=fixture();try{const pending=f.select(),image=f.image();f.setOwner({id:'store-b',mode:'camera'});f.loads[0].resolve(image);await pending;assert.equal(image.closed,true);assert.equal(f.element('snapshot-preview').src,undefined);f.element('snapshot-consent').checked=true;f.element('snapshot-captured').value=new Date().toISOString();await f.element('snapshot-share').onclick();assert.equal(f.requests.length,0);assert.match(f.element('snapshot-message').textContent,/Capture a frame/);}finally{f.restore();}
});

test('The newest selection wins and an older image error cannot clear its preview',async()=>{
 const f=fixture();try{const first=f.select(),second=f.select();f.loads[1].resolve(f.image());await second;const src=f.element('snapshot-preview').src;assert.ok(src);f.loads[0].reject(Error('Old decode failed'));await first;assert.equal(f.element('snapshot-preview').src,src);assert.equal(f.element('snapshot-preview').hidden,false);}finally{f.restore();}
});

test('A prepared camera frame remains tied to the connected owner store',async()=>{
 const f=fixture();try{f.element('snapshot-capture').onclick();assert.ok(f.element('snapshot-preview').src);f.setOwner({id:'store-b',mode:'camera'});f.element('snapshot-consent').checked=true;await f.element('snapshot-share').onclick();assert.equal(f.requests.length,0);assert.equal(f.element('snapshot-preview').hidden,true);assert.match(f.element('snapshot-message').textContent,/connected store changed/);}finally{f.restore();}
});

test('Selecting another image clears the old frame and permission before decoding finishes',async()=>{
 const f=fixture();try{f.element('snapshot-capture').onclick();f.element('snapshot-consent').checked=true;const pending=f.select();assert.equal(f.element('snapshot-consent').checked,false);assert.equal(f.element('snapshot-preview').hidden,true);await f.element('snapshot-share').onclick();assert.equal(f.requests.length,0);f.loads[0].resolve(f.image());await pending;assert.equal(f.element('snapshot-consent').checked,false);}finally{f.restore();}
});
