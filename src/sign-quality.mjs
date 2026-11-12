const statusWord=text=>/^(OPEN|CLOSE|CLOSED)$/.test(String(text).trim().toUpperCase().replace(/^[^A-Z]+|[^A-Z]+$/g,''));
export function signConfidence(data={}){
 const words=(data.blocks??[]).flatMap(b=>(b.paragraphs??[]).flatMap(p=>(p.lines??[]).flatMap(l=>l.words??[])));
 const matches=words.filter(w=>statusWord(w.text)&&Number.isFinite(w.confidence));
 return matches.length?Math.min(...matches.map(w=>w.confidence)):Number(data.confidence)||0;
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
