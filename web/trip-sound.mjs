export function createTripSound({url='/trip-alert.mp3',voiceUrl='/trip-voice-tl.mp3',onState=()=>{},onPhase=()=>{},onError=()=>{},getContext=()=>new (window.AudioContext||window.webkitAudioContext)(),fetchAudio=fetch,vibrate=pattern=>globalThis.navigator?.vibrate?.(pattern)??false}={}){
 let context,source,generation=0;const buffers=new Map();
 function buzz(pattern){try{return vibrate(pattern);}catch{return false;}}
 function load(path){context??=getContext();if(!buffers.has(path))buffers.set(path,(async()=>{const r=await fetchAudio(path);if(!r.ok)throw Error('Alert audio could not load.');return context.decodeAudioData(await r.arrayBuffer());})().catch(error=>{buffers.delete(path);throw error;}));return buffers.get(path);}
 function stop(){generation++;buzz(0);if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}onState(false);onPhase('Stopped');}
 async function prime(){try{context??=getContext();await context.resume();await Promise.all([load(url),load(voiceUrl)]);}catch(error){onError(error);}}
 async function play({alarm=true,voice=false,vibration=true}={}){stop();const run=generation;if(!alarm&&!voice)return;try{context??=getContext();await context.resume();const [alarmBuffer,voiceBuffer]=await Promise.all([alarm?load(url):null,voice?load(voiceUrl):null]);if(run!==generation)return;
 function stage(buffer,kind){if(run!==generation)return;const next=context.createBufferSource();next.buffer=buffer;next.connect(context.destination);source=next;next.onended=()=>{if(run!==generation||source!==next)return;source=null;next.disconnect();buzz(0);if(kind==='alarm'&&voiceBuffer)stage(voiceBuffer,'voice');else{onState(false);onPhase('Finished');}};next.start();onState(true);onPhase(kind==='alarm'?'Alarm · vibration only during alarm':'Taglish voice · vibration off');if(kind==='alarm'&&vibration){const pattern=[];let ms=Math.floor(buffer.duration*1000);while(ms>0){let part=Math.min(400,ms);pattern.push(part);ms-=part;if(ms>0){part=Math.min(180,ms);pattern.push(part);ms-=part;}}buzz(pattern);}else buzz(0);}
 stage(alarmBuffer??voiceBuffer,alarmBuffer?'alarm':'voice');
 }catch(error){if(run===generation){stop();onError(error);}}}
 return {prime,play,stop};
}
