export function expectedHours(schedule,now=Date.now()){
 if(!schedule||!/^\d{2}:\d{2}$/.test(schedule.open??'')||!/^\d{2}:\d{2}$/.test(schedule.close??''))return null;
 const valid=t=>{const[h,m]=t.split(':').map(Number);return h<24&&m<60;};if(!valid(schedule.open)||!valid(schedule.close)||schedule.open===schedule.close||!Array.isArray(schedule.days))return null;
 try{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:schedule.timeZone??'Asia/Manila',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday),clock=parts.hour+':'+parts.minute;
 if(schedule.open<schedule.close)return schedule.days.includes(day)&&clock>=schedule.open&&clock<schedule.close?'OPEN':'CLOSED';
 return (clock>=schedule.open&&schedule.days.includes(day))||(clock<schedule.close&&schedule.days.includes((day+6)%7))?'OPEN':'CLOSED';}catch{return null;}
}
export function assessEvidence(input={},schedule,now=Date.now()){
 const expected=expectedHours(schedule,now),text=String(input.text??'').toUpperCase().replace(/[^A-Z]/g,' '),hasOpen=/\bOPEN\b/.test(text),hasClosed=/\bCLOSED?\b/.test(text),clear=Number(input.ocrConfidence)>=80,brightness=Number.isFinite(input.brightness)?Math.max(0,Math.min(255,input.brightness)):null,people=Number.isInteger(input.people)&&input.people>=0?input.people:null;
 const summary={expected,brightness,lighting:brightness===null?'UNKNOWN':brightness<45?'DARK':brightness>100?'LIT':'DIM',people,sign:clear&&hasOpen!==hasClosed?(hasOpen?'OPEN':'CLOSED'):'UNREADABLE'};
 if(clear&&hasOpen&&hasClosed)return {status:'UNCERTAIN',confidence:0,reason:'Both OPEN and CLOSED text detected. Select a smaller sign region.',evidence:summary};
 if(summary.sign==='CLOSED')return {status:'CLOSED',confidence:.9,reason:'CLOSED sign text read. Schedule and people remain context, not guarantees.',evidence:summary};
 if(summary.sign==='OPEN'){
  if(expected==='CLOSED')return {status:'UNCERTAIN',confidence:0,reason:'OPEN sign conflicts with the configured schedule. Owner confirmation needed.',evidence:summary};
  return {status:'OPEN',confidence:.9,reason:'OPEN sign text read. Camera-derived observation; actual service is not guaranteed.',evidence:summary};
 }
 const likely=expected==='CLOSED'&&summary.lighting==='DARK'&&people===0;
 return {status:'UNCERTAIN',confidence:0,reason:likely?'Likely closed: outside schedule, dark view, and no person detected. A clear sign or owner confirmation is still needed.':`No clear sign. Schedule: ${expected??'unset'}; light: ${summary.lighting.toLowerCase()}; people: ${people===null?'not checked':people+' detected'}. These signals alone cannot confirm opening or closure.`,evidence:summary};
}
export function brightnessOf({data,width,height}){if(!data||!width||!height)return null;let sum=0,n=0;for(let i=0;i<data.length;i+=16){sum+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];n++;}return n?Math.round(sum/n):null;}
