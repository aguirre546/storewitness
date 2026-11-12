import {assessEvidence} from './evidence.mjs';
let workerPromise;
export async function loadSignReader(){
 if(!workerPromise)workerPromise=(async()=>{
  if(!window.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('OCR download failed. Check your connection and try again.'));};document.head.append(script);});
  const worker=await window.Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',langPath:'https://tessdata.projectnaptha.com/4.0.0'});
  await worker.setParameters({tessedit_pageseg_mode:'11'});return worker;
 })().catch(e=>{workerPromise=null;throw e;});
 return workerPromise;
}
export async function readSign(canvas,region='center'){
 const worker=await loadSignReader(),crop=document.createElement('canvas');let x=0,y=0,w=canvas.width,h=canvas.height;
 if(region==='center'){x=w*.15;y=h*.15;w*=.7;h*=.7;}
 crop.width=Math.round(w);crop.height=Math.round(h);crop.getContext('2d').drawImage(canvas,x,y,w,h,0,0,crop.width,crop.height);
 const {data}=await worker.recognize(crop),result=assessEvidence({text:data.text,ocrConfidence:data.confidence});
 return {...result,text:data.text.trim(),ocrConfidence:Math.round(data.confidence)};
}
