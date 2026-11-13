import {cleanLocations,distanceKm,eligibleAlternative} from './trip.mjs';
import {captureAge} from './lifecycle.mjs';
import {initialState,observe,publicStatus,setOverride,clearOverride,settleHistory,HISTORY_LIMIT} from './state.mjs';
export const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function api(request,db,now=Date.now()){
 const url=new URL(request.url), path=url.pathname;
 if(request.method==='GET'&&path==='/api/health'){try{if(!db)throw Error();await db.prepare('SELECT COUNT(*) AS n FROM boards').first();return json({ok:true,storage:true});}catch{return json({ok:false,storage:false},503);}}
 if(!db)return json({error:'Shared storage is not configured.'},503);
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
 if(request.method==='POST'){
  const origin=request.headers.get('origin'); if(origin&&origin!==url.origin)return json({error:'Cross-origin writes are not allowed.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
 }
 let data={};if(request.method==='POST'){let body='';const reader=request.body?.getReader();if(reader){let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return json({error:'Request too large.'},413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}body=new TextDecoder().decode(bytes);}try{data=JSON.parse(body);}catch{return json({error:'Invalid JSON.'},400);}if(data===null||typeof data!=='object'||Array.isArray(data))return json({error:'A JSON object is required.'},400);}
 if(path==='/api/boards'&&request.method==='POST'){
  const name=typeof data.name==='string'?data.name.trim():'';if(!name||name.length>60||!['camera','replay'].includes(data.mode))return json({error:'Enter a store name and valid source.'},400);
  const bucket=await hash((request.headers.get('cf-connecting-ip')??'local')+':'+Math.floor(now/3600000));
  const rate=await db.prepare('INSERT INTO rate_limits(bucket,hits) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(bucket).first();
  if(rate.hits>10)return json({error:'Creation limit reached. Try again next hour.'},429);
  await db.prepare('DELETE FROM rate_limits WHERE bucket NOT IN (SELECT bucket FROM rate_limits ORDER BY rowid DESC LIMIT 5000)').run();
  const count=await db.prepare('SELECT COUNT(*) AS n FROM boards').first();if(count.n>=1000)return json({error:'Prototype board capacity reached.'},429);
  const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
  await db.prepare('INSERT INTO boards(id,name,mode,token_hash,state,created_at) VALUES(?,?,?,?,?,?)').bind(id,name,data.mode,await hash(token),JSON.stringify(initialState(now)),now).run();
  return json({id,name,mode:data.mode,token},201);
 }
 const match=path.match(/^\/api\/boards\/([a-f0-9-]{36})(?:\/(observe|override|clear|pair|rotate|recover|archive|locations|alternatives))?$/);if(!match)return json({error:'Not found.'},404);
 const row=await db.prepare('SELECT * FROM boards WHERE id=?').bind(match[1]).first();if(!row)return json({error:'Store not found.'},404);
 let state=JSON.parse(row.state);const settled=settleHistory(state,now);
 if(settled!==state){const saved=await db.prepare('UPDATE boards SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(settled),row.id,row.revision).run();if(saved.meta.changes!==1)return json({error:'Another update arrived. Refresh and retry.'},409);state=settled;row.revision++;}
 const view=s=>({id:row.id,name:row.name,revision:row.revision,mode:row.mode,...publicStatus(s,now),...(s.archived?{status:'UNAVAILABLE',reason:'Owner archived this store. Observations paused.',candidate:null,count:0,override:undefined}:{}),archived:!!s.archived,location:s.location??null,history:s.history,historyLimit:HISTORY_LIMIT,serverTime:now});
 if(request.method==='GET'&&match[2]==='alternatives'){const alternatives=[];for(const id of (state.location?.branches??[])){const other=await db.prepare('SELECT * FROM boards WHERE id=?').bind(id).first();if(!other)continue;const os=JSON.parse(other.state),d={id:other.id,name:other.name,mode:other.mode,...publicStatus(os,now),archived:!!os.archived,location:os.location??null};if(eligibleAlternative(d,now,row.mode))alternatives.push({...d,distanceKm:distanceKm(state.location,d.location)});}alternatives.sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity)||a.name.localeCompare(b.name));return json({alternatives,serverTime:now,basis:'Owner-linked participating locations; distance is straight-line from the selected store, not driving distance.'});}
 if(request.method==='GET'&&!match[2])return json(view(state));
 if(request.method!=='POST'||!match[2])return json({error:'Not found.'},404);
 const authBucket=await hash((request.headers.get('cf-connecting-ip')??'local')+':auth:'+row.id+':'+Math.floor(now/60000));const authRate=await db.prepare('INSERT INTO rate_limits(bucket,hits) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(authBucket).first();if(authRate.hits>60)return json({error:'Too many owner requests. Wait one minute.'},429);
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');const recovering=match[2]==='recover';if(recovering?(!data.recoveryCode||!state.recoveryHash||await hash(String(data.recoveryCode))!==state.recoveryHash):(!token||await hash(token)!==row.token_hash))return json({error:recovering?'Invalid recovery code.':'Invalid pairing token.'},401);
 if(match[2]==='pair')return json({...view(state),archived:!!state.archived});
 if(['rotate','recover'].includes(match[2])){const newToken=crypto.randomUUID()+crypto.randomUUID(),recoveryCode=crypto.randomUUID()+crypto.randomUUID();const next={...state,recoveryHash:await hash(recoveryCode)};const saved=await db.prepare('UPDATE boards SET state=?,token_hash=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(next),await hash(newToken),row.id,row.revision).run();if(saved.meta.changes!==1)return json({error:'Another update arrived. Retry.'},409);return json({...view(next),token:newToken,recoveryCode});}
 if(match[2]==='archive'){if(typeof data.archived!=='boolean')return json({error:'Choose archive or restore.'},400);const next={...state,archived:data.archived};const saved=await db.prepare('UPDATE boards SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(next),row.id,row.revision).run();if(saved.meta.changes!==1)return json({error:'Another update arrived. Retry.'},409);return json(view(next));}
 if(match[2]==='locations'){let location;try{location=cleanLocations(data,row.id);}catch(e){return json({error:e.message},400);}const next={...state,location};const saved=await db.prepare('UPDATE boards SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(next),row.id,row.revision).run();if(saved.meta.changes!==1)return json({error:'Another update arrived. Retry.'},409);row.revision++;return json(view(next));}
 if(state.archived)return json({error:'Restore the archived store before changing it.'},409);
 let next;try{
  if(match[2]==='observe'){
   if(row.mode==='camera'&&(captureAge(data.capturedAt,now)===null||typeof data.observationId!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(data.observationId)))return json({error:'A fresh camera capture timestamp and observation ID are required.'},400);
   if(data.observationId&&data.observationId===state.lastObservationId)return json({error:'This observation was already received.'},409);
   if(data.source!==row.mode||!['OPEN','CLOSED','UNCERTAIN'].includes(data.status)||typeof data.confidence!=='number'||!Number.isFinite(data.confidence)||data.confidence<0||data.confidence>1)return json({error:'Observation must match this board source.'},400);
   if(state.lastSeenAt!==null&&now-state.lastSeenAt<8000)return json({error:'Wait at least eight seconds between observations.'},429);
   next=observe(state,{status:data.status,confidence:data.confidence,source:row.mode,reason:String(data.reason??'').slice(0,160),observedAt:row.mode==='camera'?captureAge(data.capturedAt,now):now},now);if(next===state)return json({error:'Observation is older than the last accepted capture.'},409);next={...next,lastObservationId:data.observationId??null};
  }else if(match[2]==='override'){
   const minutes=data.durationMinutes===undefined?15:data.durationMinutes;
   if(!Number.isInteger(minutes)||minutes<1||minutes>120)return json({error:'Choose a duration from 1 to 120 whole minutes.'},400);
   next=setOverride(state,{status:data.status,kind:data.kind??'status',reason:String(data.reason??'').slice(0,120),expiresAt:now+minutes*60000},now);
  }
  else next=clearOverride(state,now);
 }catch{return json({error:'Invalid status change.'},400);}
 const result=await db.prepare('UPDATE boards SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(next),row.id,row.revision).run();
 if(result.meta.changes!==1)return json({error:'Another update arrived. Refresh and retry.'},409);
 row.revision++;return json(view(next));
}
