import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {localDB} from '../src/local-db.mjs';
import {api} from '../src/server.mjs';
import {initialState,observe,setOverride,settleHistory} from '../src/state.mjs';
const req=(path,body,token)=>new Request('https://store.test'+path,body?{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}:{});
test('Timed activity is chronological, idempotent and preserves break expiry time',()=>{
 let s=initialState(100000);s=observe(s,{status:'OPEN',source:'camera',confidence:1,observedAt:100000},100000);s=setOverride(s,{status:'CLOSED',kind:'break',expiresAt:400000},110000);s=settleHistory(s,500000);
 assert.deepEqual(s.history.map(x=>x.status),['FEED_UNAVAILABLE','CLOSED','BREAK_ENDED'].sort((a,b)=>({CLOSED:110000,FEED_UNAVAILABLE:135000,BREAK_ENDED:400000})[a]-({CLOSED:110000,FEED_UNAVAILABLE:135000,BREAK_ENDED:400000})[b]));
 assert.equal(s.history.at(-1).at,400000);assert.equal(settleHistory(s,600000),s);assert.equal(s.override,null);
});
test('Repeated uncertain observations create one transition, then confirmed recovery is recorded',()=>{let s=initialState(100000);for(const at of [100000,110000,120000])s=observe(s,{status:'UNCERTAIN',source:'camera',confidence:0,observedAt:at},at);assert.equal(s.history.length,1);for(const at of [130000,140000,150000])s=observe(s,{status:'OPEN',source:'camera',confidence:1,observedAt:at},at);assert.deepEqual(s.history.map(x=>x.status),['UNCERTAIN','OPEN']);});
test('Saved store history survives closing and reopening storage, with 200-event retention',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'storewitness-history-'));let db=localDB(join(dir,'history.sqlite'));
 try{const board=await(await api(req('/api/boards',{name:'History fixture',mode:'replay'}),db,100000)).json(),path='/api/boards/'+board.id;for(let i=0;i<205;i++){const r=await api(req(path+'/override',{status:i%2?'OPEN':'CLOSED',durationMinutes:5,reason:'Event '+i},board.token),db,110000+i*1000);assert.equal(r.status,200);}db.close();db=localDB(join(dir,'history.sqlite'));let data=await(await api(req(path),db,320000)).json();assert.equal(data.history.length,200);assert.equal(data.history[0].reason,'Event 5');assert.equal(data.history.at(-1).reason,'Event 204');assert.equal(data.token,undefined);data=await(await api(req(path),db,700000)).json();assert.equal(data.history.at(-1).status,'OVERRIDE_EXPIRED');const again=await(await api(req(path),db,710000)).json();assert.deepEqual(again.history,data.history);assert.equal(again.historyLimit,200);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});
