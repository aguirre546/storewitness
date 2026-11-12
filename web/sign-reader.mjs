import {assessEvidence} from './evidence.mjs';
import {signConfidence,enhanceContrast} from './sign-quality.mjs';
let workerPromise;
export async function loadSignReader(){
 if(!workerPromise)workerPromise=(async()=>{
  if(!window.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('OCR download failed. Check your connection and try again.'));};document.head.append(script);});
  const worker=await window.Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',langPath:'https://tessdata.projectnaptha.com/4.0.0'});
  await worker.setParameters({tessedit_pageseg_mode:'11'});return worker;
 })().catch(e=>{workerPromise=null;throw e;});
 return workerPromise;
}
export async function readSign(canvas,region='whole',{mirror=false,preview}={}){
 const started=performance.now(),worker=await loadSignReader();let last;
 const regions=region==='center'?['center','whole']:['whole'];
 for(let attempt=0;attempt<regions.length+1;attempt++){
  if(attempt>0&&performance.now()-started>6500)break;
  const enhanced=attempt===regions.length,area=enhanced?regions[0]:regions[attempt],crop=document.createElement('canvas');let x=0,y=0,w=canvas.width,h=canvas.height;
  if(area==='center'){x=w*.15;y=h*.15;w*=.7;h*=.7;}
  const scale=Math.min(2,1400/w);crop.width=Math.round(w*scale);crop.height=Math.round(h*scale);const ctx=crop.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,crop.width,crop.height);
  if(mirror){ctx.translate(crop.width,0);ctx.scale(-1,1);}ctx.drawImage(canvas,x,y,w,h,0,0,crop.width,crop.height);ctx.setTransform(1,0,0,1,0,0);
  if(enhanced)ctx.putImageData(enhanceContrast(ctx.getImageData(0,0,crop.width,crop.height)),0,0);
  if(preview){preview.width=crop.width;preview.height=crop.height;preview.getContext('2d').drawImage(crop,0,0);preview.hidden=false;}
  let timeout;const {data}=await Promise.race([worker.recognize(crop,{}, {blocks:true}),new Promise((_,reject)=>{timeout=setTimeout(()=>{worker.terminate();workerPromise=null;reject(Error('Text scan timed out. Reload the scanner and try a clearer frame.'));},15000);})]).finally(()=>clearTimeout(timeout));
  const quality=signConfidence(data),result=assessEvidence({text:data.text,ocrConfidence:quality});last={...result,text:data.text.trim(),ocrConfidence:Math.round(quality),durationMs:Math.round(performance.now()-started),method:(enhanced?'contrast-enhanced ':'original ')+area,attempts:attempt+1};
  if(result.status!=='UNCERTAIN'||/Both OPEN/.test(result.reason))return last;
 }
 return last;
}
