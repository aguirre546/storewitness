// Bound local pixel work without throwing away detail from ordinary HD/4K inputs.
export function frameSize(width,height,maxWidth=3840,maxHeight=2160){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)throw Error('Waiting for a readable camera frame.');
 const scale=Math.min(1,maxWidth/width,maxHeight/height);
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function cameraConstraints(device='',quality='detail'){
 const size=quality==='balanced'?{width:{ideal:1920},height:{ideal:1080}}:{width:{ideal:3840},height:{ideal:2160}};
 return {video:{...size,...(device?{deviceId:{exact:device}}:{facingMode:{ideal:'environment'}})},audio:false};
}
