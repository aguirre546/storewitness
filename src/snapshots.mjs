export const SNAPSHOT_TTL=15*60*1000;
export function closureKey(state,status){return !state.archived&&status.status==='CLOSED'?String(status.source==='owner'?state.override?.setAt:state.lastConfirmedAt):null;}
export function visibleSnapshots(state,status,now){const key=closureKey(state,status);if(!key)return [];return Object.entries(state.snapshots??{}).filter(([,s])=>s.expiresAt>now&&s.closureKey===key).map(([slot,s])=>({slot,capturedAt:s.capturedAt,sharedAt:s.sharedAt,expiresAt:s.expiresAt,source:s.source,caption:s.caption}));}
export function cleanSnapshot(data,state,status,now){
 const key=closureKey(state,status);if(!key)throw Error('A current CLOSED status or owner break is required.');
 if(!['outside','inside'].includes(data.slot)||data.consent!==true)throw Error('Choose outside or inside and confirm permission to share publicly.');
 if(!['cctv-upload','camera-frame'].includes(data.source))throw Error('Choose a snapshot source.');
 if(!Number.isFinite(data.capturedAt)||data.capturedAt>now+5000||now-data.capturedAt>10*60000||data.capturedAt<Number(key)-60000)throw Error('Use a frame captured during this closure, within the last ten minutes.');
 if(typeof data.dataUrl!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.dataUrl)||data.dataUrl.length>48000)throw Error('Use a compressed JPEG snapshot under 35 KB.');
 let bytes;try{bytes=Uint8Array.from(atob(data.dataUrl.slice(23)),c=>c.charCodeAt(0));}catch{throw Error('Invalid snapshot.');}
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw Error('Invalid JPEG snapshot.');
 const caption=typeof data.caption==='string'?data.caption.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,100):'';
 return {dataUrl:data.dataUrl,capturedAt:Math.min(data.capturedAt,now),sharedAt:now,expiresAt:now+SNAPSHOT_TTL,source:data.source,caption,closureKey:key};
}
