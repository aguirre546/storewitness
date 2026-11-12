export async function requestCamera(mediaDevices,constraints,{timeoutMs=20000,isCurrent=()=>true}={}){
 let expired=false,timer;
 const pending=Promise.resolve().then(()=>mediaDevices.getUserMedia(constraints)).then(stream=>{
  if(expired||!isCurrent()){stream.getTracks().forEach(t=>t.stop());throw Error('Camera request cancelled.');}return stream;
 });
 try{return await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('No camera frame arrived within 20 seconds. Check camera permission and connect your selected webcam or phone camera, then retry.'));},timeoutMs);})]);}
 catch(e){expired=true;throw e;}finally{clearTimeout(timer);}
}
