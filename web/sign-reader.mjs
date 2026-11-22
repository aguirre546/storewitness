import {bounded} from './lifecycle.mjs';
import {assessEvidence} from './evidence.mjs';
import {signConfidence,enhanceContrast,adaptiveThreshold,sanitizeCrop,scanQuality,sourceLetterHeight} from './sign-quality.mjs';

let workerPromise,scriptPromise,queue=Promise.resolve(),pendingScans=0;
const FAR_CROP={x:.31,y:.29,width:.38,height:.42};
const stopWorker=worker=>{try{Promise.resolve(worker.terminate()).catch(()=>{});}catch{}};
async function loadScript(){
 if(window.Tesseract)return;
 if(!scriptPromise){let script;
  scriptPromise=bounded(new Promise((resolve,reject)=>{script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(Error('OCR download failed. Check your connection and try again.'));document.head.append(script);}),30000,'Text scanner download timed out. Retry loading.').catch(error=>{script?.remove();scriptPromise=null;throw error;});
 }
 await scriptPromise;
 if(!window.Tesseract){scriptPromise=null;throw Error('The text scanner did not load. Check your connection and retry.');}
}
export async function loadSignReader(){
 if(!workerPromise){
  const pending=(async()=>{
   await loadScript();
   const initializing=window.Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',langPath:'https://tessdata.projectnaptha.com/4.0.0',cacheMethod:'write'});
   const worker=await bounded(initializing,45000,'Text scanner initialization timed out.',()=>{initializing.then(stopWorker).catch(()=>{});});
   try{await bounded(worker.setParameters({tessedit_pageseg_mode:'11',user_defined_dpi:'300'}),8000,'Text scanner setup timed out.');}catch(error){stopWorker(worker);throw error;}
   return worker;
  })();
  workerPromise=pending;
  pending.catch(()=>{if(workerPromise===pending)workerPromise=null;});
 }
 return workerPromise;
}

function makeCrop(canvas,rectangle,mirror,filter){
 const area=sanitizeCrop(rectangle),x=Math.round(canvas.width*area.x),y=Math.round(canvas.height*area.y),w=Math.max(1,Math.min(canvas.width-x,Math.round(canvas.width*area.width))),h=Math.max(1,Math.min(canvas.height-y,Math.round(canvas.height*area.height)));
 // Keep native detail, enlarge small targets, and cap working memory on phones.
 const scale=Math.min(3,2200/w,2200/h,Math.sqrt(2400000/(w*h))),crop=document.createElement('canvas');
 crop.width=Math.max(1,Math.round(w*scale));crop.height=Math.max(1,Math.round(h*scale));
 const ctx=crop.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Your browser could not prepare the scanner image.');
 ctx.fillStyle='white';ctx.fillRect(0,0,crop.width,crop.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(mirror){ctx.translate(crop.width,0);ctx.scale(-1,1);}ctx.drawImage(canvas,x,y,w,h,0,0,crop.width,crop.height);ctx.setTransform(1,0,0,1,0,0);
 const pixels=ctx.getImageData(0,0,crop.width,crop.height),quality=scanQuality(pixels);
 if(filter==='contrast')ctx.putImageData(enhanceContrast(pixels),0,0);
 if(filter==='adaptive')ctx.putImageData(adaptiveThreshold(pixels),0,0);
 return {crop,scale,quality,sourceCrop:{x,y,width:w,height:h}};
}

async function scan(canvas,region,{mirror=false,preview,crop:customCrop}={}){
 if(!canvas?.width||!canvas?.height)throw Error('No camera image is available. Enable your camera or choose an image first.');
 const started=performance.now(),worker=await loadSignReader(),scanStarted=performance.now();
 const area=region==='target'?sanitizeCrop(customCrop):region==='far'?FAR_CROP:region==='center'?{x:.15,y:.15,width:.7,height:.7}:{};
 const plans=[{area,filter:'original'},{area,filter:'contrast'},{area,filter:'adaptive'}];
 let best,bestCrop,completed=0;
 for(let attempt=0;attempt<plans.length;attempt++){
  // Model download is excluded from the recognition budget; scans never overlap.
  if(attempt>0&&performance.now()-scanStarted>14000)break;
  const prepared=makeCrop(canvas,plans[attempt].area,mirror,plans[attempt].filter);
  if(preview){preview.width=prepared.crop.width;preview.height=prepared.crop.height;preview.getContext('2d').drawImage(prepared.crop,0,0);preview.hidden=false;}
  let data;
  try{
   const reading=await bounded(worker.recognize(prepared.crop,{}, {blocks:true}),12000,'Text scan timed out. Reload the scanner and try a clearer frame.',()=>{stopWorker(worker);workerPromise=null;});
   data=reading.data;
  }catch(error){stopWorker(worker);workerPromise=null;throw error;}
  completed++;
  const confidence=signConfidence(data),result=assessEvidence({text:data.text,ocrConfidence:confidence}),letterHeightPx=sourceLetterHeight(data,prepared.scale),tips=[...prepared.quality.tips];
  if(letterHeightPx!==null&&letterHeightPx<20)tips.push('Small letters in the original frame. Move closer, use optical zoom, or make the sign larger; digital enlargement cannot restore missing strokes.');
  if(result.status==='UNCERTAIN')tips.push('Keep the entire OPEN, CLOSE, or CLOSED word sharp inside the target. Hold the camera steady and avoid reflections.');
  const quality={sourceWidth:canvas.width,sourceHeight:canvas.height,cropWidth:prepared.sourceCrop.width,cropHeight:prepared.sourceCrop.height,processedWidth:prepared.crop.width,processedHeight:prepared.crop.height,brightness:prepared.quality.brightness,contrast:prepared.quality.contrast,letterHeightPx,insufficientDetail:letterHeightPx!==null&&letterHeightPx<10,tips,region:prepared.sourceCrop};
  const reading={...result,text:String(data.text??'').trim(),ocrConfidence:Math.round(confidence),durationMs:Math.round(performance.now()-started),method:plans[attempt].filter+' '+region,attempts:attempt+1,quality};
  // Do not promote an apparent match whose source letters have almost no detail.
  if(reading.status!=='UNCERTAIN'&&quality.insufficientDetail){reading.status='UNCERTAIN';reading.confidence=0;reading.evidence={...reading.evidence,sign:'UNREADABLE'};reading.reason='The sign letters are too small in the original camera frame. Use a closer view or optical zoom before confirming status.';}
  if(!best||reading.ocrConfidence>best.ocrConfidence||reading.status!=='UNCERTAIN'){best=reading;bestCrop=prepared.crop;}
  // A conflict needs a smaller target, not a later crop that can hide one word.
  if(/Both OPEN/.test(result.reason)||reading.status!=='UNCERTAIN')return reading;
 }
 if(preview&&bestCrop){preview.width=bestCrop.width;preview.height=bestCrop.height;preview.getContext('2d').drawImage(bestCrop,0,0);}
 return {...best,attempts:completed,durationMs:Math.round(performance.now()-started)};
}

export function readSign(canvas,region='whole',options={}){
 if(pendingScans>=2)return Promise.reject(Error('The text scanner is busy. Wait for the current check to finish.'));
 pendingScans++;
 // A worker accepts one OCR job at a time. Keep rejections from poisoning its queue.
 const task=queue.then(()=>scan(canvas,region,options));
 queue=task.catch(()=>{});
 return task.finally(()=>{pendingScans--;});
}
