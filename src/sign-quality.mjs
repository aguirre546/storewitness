const statusWord=text=>/^(OPEN|CLOSE|CLOSED)$/.test(String(text).trim().toUpperCase().replace(/^[^A-Z]+|[^A-Z]+$/g,''));
const signWords=data=>(data.blocks??[]).flatMap(b=>(b.paragraphs??[]).flatMap(p=>(p.lines??[]).flatMap(l=>l.words??[]))).filter(w=>statusWord(w.text));
export function signConfidence(data={}){
 const matches=signWords(data).filter(w=>Number.isFinite(w.confidence));
 const confidence=matches.length?Math.min(...matches.map(w=>w.confidence)):Number(data.confidence)||0;
 return Math.max(0,Math.min(100,confidence));
}
// Coordinates describe the source frame, before the optional mirror correction.
export function sanitizeCrop(crop={}){
 const finite=(value,fallback)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;
 const width=Math.max(.05,Math.min(1,finite(crop?.width,1))),height=Math.max(.05,Math.min(1,finite(crop?.height,1)));
 return {x:Math.max(0,Math.min(1-width,finite(crop?.x,0))),y:Math.max(0,Math.min(1-height,finite(crop?.y,0))),width,height};
}
export function sourceLetterHeight(data={},scale=1){
 const heights=signWords(data).map(w=>(w.bbox?.y1-w.bbox?.y0)/scale).filter(h=>Number.isFinite(h)&&h>0);
 return heights.length&&Number.isFinite(scale)&&scale>0?Math.round(Math.min(...heights)*10)/10:null;
}
export function scanQuality(image={}){
 const {data,width,height}=image;
 if(!data||!width||!height)return {brightness:null,contrast:null,tips:['No readable camera pixels. Enable the camera or choose a new image.']};
 const histogram=new Uint32Array(256),step=Math.max(1,Math.floor(Math.sqrt(width*height/180000)));let count=0,total=0;
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){const i=(y*width+x)*4,value=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);histogram[value]++;total+=value;count++;}
 const percentile=q=>{let n=0;for(let i=0;i<256;i++){n+=histogram[i];if(n>=count*q)return i;}return 255;};
 const brightness=Math.round(total/count),contrast=percentile(.98)-percentile(.02),tips=[];
 if(brightness<45)tips.push('The selected area is dark. Light the sign or use a camera with suitable night illumination.');
 if(brightness>235)tips.push('Mostly bright pixels: if the letters look overexposed, reduce glare or exposure.');
 if(contrast<25)tips.push('Most pixels have low contrast. If text is unclear, target the sign more tightly and improve lighting or focus.');
 return {brightness,contrast,tips};
}
export function enhanceContrast(image){
 const {data,width,height}=image;if(!data||!width||!height)return image;
 const histogram=new Uint32Array(256),gray=new Uint8Array(width*height);
 for(let i=0;i<gray.length;i++){gray[i]=Math.round(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2]);histogram[gray[i]]++;}
 const percentile=q=>{let total=0;for(let i=0;i<256;i++){total+=histogram[i];if(total>=gray.length*q)return i;}return 255;};
 const low=percentile(.02),high=percentile(.98);if(high-low<8)return image;
 for(let i=0;i<gray.length;i++){const value=Math.max(0,Math.min(255,Math.round((gray[i]-low)*255/(high-low))));data[i*4]=data[i*4+1]=data[i*4+2]=value;}
 return image;
}
// Local mean threshold helps uneven lighting; it does not invent missing detail.
export function adaptiveThreshold(image,windowSize=35,offset=8){
 const {data,width,height}=image;if(!data||!width||!height)return image;
 const quality=scanQuality(image);if(quality.contrast<8)return image;
 const gray=new Uint8Array(width*height),stride=width+1,integral=new Float64Array((width+1)*(height+1));
 for(let y=0;y<height;y++){let row=0;for(let x=0;x<width;x++){const i=y*width+x;gray[i]=Math.round(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2]);row+=gray[i];integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row;}}
 const radius=Math.max(1,Math.floor(Math.max(3,Math.min(101,Number(windowSize)||35))/2));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const left=Math.max(0,x-radius),right=Math.min(width,x+radius+1),top=Math.max(0,y-radius),bottom=Math.min(height,y+radius+1),sum=integral[bottom*stride+right]-integral[top*stride+right]-integral[bottom*stride+left]+integral[top*stride+left],mean=sum/((right-left)*(bottom-top)),i=y*width+x,value=gray[i]<mean-offset?0:255;data[i*4]=data[i*4+1]=data[i*4+2]=value;}
 return image;
}
