export function createTripSound({url='/trip-alert.mp3',onState=()=>{},onError=()=>{},getContext=()=>new (window.AudioContext||window.webkitAudioContext)(),fetchAudio=fetch}={}){
  let context,bufferPromise,source,generation=0;
  function load(){context??=getContext();return bufferPromise??=(async()=>{const response=await fetchAudio(url);if(!response.ok)throw Error('Alert sound could not load.');return context.decodeAudioData(await response.arrayBuffer());})().catch(error=>{bufferPromise=null;throw error;});}
  function stop(){generation++;if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}onState(false);}
  async function prime(){try{context??=getContext();await context.resume();await load();}catch(error){onError(error);}}
  async function play(){stop();const run=generation;try{context??=getContext();await context.resume();const buffer=await load();if(run!==generation)return;const next=context.createBufferSource();next.buffer=buffer;next.connect(context.destination);source=next;next.onended=()=>{if(source===next){source=null;next.disconnect();onState(false);}};next.start();onState(true);}catch(error){if(run===generation)onError(error);}}
  return {prime,play,stop};
}
