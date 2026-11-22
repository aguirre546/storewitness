export const SNAPSHOT_TTL=15*60*1000;
// Validate bounded JPEG headers before persisting owner-provided bytes. This is
// structural validation, not independent verification of the photograph.
function snapshotJpegSize(bytes){
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)return null;
 let offset=2,size=null,components=0;
 while(offset<bytes.length-2){
  if(bytes[offset++]!==255)return null;
  while(bytes[offset]===255)offset++;
  const marker=bytes[offset++];
  if(!marker||marker===216||marker===217||marker===1||marker>=208&&marker<=215||offset+2>bytes.length-2)return null;
  const length=bytes[offset]*256+bytes[offset+1];
  if(length<2||offset+length>bytes.length-2)return null;
  if(marker>=192&&marker<=207&&![196,200,204].includes(marker)){
   if(size||![192,193,194].includes(marker)||length<11||bytes[offset+2]!==8)return null;
   const height=bytes[offset+3]*256+bytes[offset+4],width=bytes[offset+5]*256+bytes[offset+6];components=bytes[offset+7];
   if(![1,3].includes(components)||length!==8+3*components||!width||!height||width>640||height>480)return null;
   size={width,height};
  }
  if(marker===218){const scans=bytes[offset+2];return size&&scans>=1&&scans<=components&&length===6+2*scans&&offset+length<bytes.length-2?size:null;}
  offset+=length;
 }
 return null;
}
export function closureKey(state,status){return !state.archived&&status.status==='CLOSED'?String(status.source==='owner'?state.override?.setAt:state.lastConfirmedAt):null;}
export function visibleSnapshots(state,status,now){const key=closureKey(state,status);if(!key)return [];return Object.entries(state.snapshots??{}).filter(([,s])=>s.expiresAt>now&&s.closureKey===key).map(([slot,s])=>({slot,capturedAt:s.capturedAt,sharedAt:s.sharedAt,expiresAt:s.expiresAt,source:s.source,caption:s.caption}));}
export function cleanSnapshot(data,state,status,now){
 const key=closureKey(state,status);if(!key)throw Error('A current CLOSED status or owner break is required.');
 if(!['outside','inside'].includes(data.slot)||data.consent!==true)throw Error('Choose outside or inside and confirm permission to share publicly.');
 if(!['cctv-upload','camera-frame'].includes(data.source))throw Error('Choose a snapshot source.');
 if(!Number.isFinite(data.capturedAt)||data.capturedAt>now+5000||now-data.capturedAt>10*60000||data.capturedAt<Number(key)-60000)throw Error('Use a frame captured during this closure, within the last ten minutes.');
 if(typeof data.dataUrl!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.dataUrl)||data.dataUrl.length>48000)throw Error('Use a compressed JPEG snapshot under 35 KB.');
 let bytes;try{bytes=Uint8Array.from(atob(data.dataUrl.slice(23)),c=>c.charCodeAt(0));}catch{throw Error('Invalid snapshot.');}
 if(!snapshotJpegSize(bytes))throw Error('Use a valid JPEG snapshot no larger than 640 by 480 pixels.');
 const caption=typeof data.caption==='string'?data.caption.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,100):'';
 return {dataUrl:data.dataUrl,capturedAt:Math.min(data.capturedAt,now),sharedAt:now,expiresAt:now+SNAPSHOT_TTL,source:data.source,caption,closureKey:key};
}
