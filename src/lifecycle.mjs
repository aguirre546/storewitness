export function sessionGuard(){let epoch=0;return {start:()=>++epoch,current:id=>id===epoch,cancel:()=>++epoch};}
export async function bounded(promise,ms,message='Operation timed out.',onTimeout=()=>{}){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{onTimeout();reject(Error(message));},ms);})]);}finally{clearTimeout(timer);}}
export function captureAge(value,now){return typeof value==='number'&&Number.isFinite(value)&&value<=now+5000&&now-value<35000?Math.min(value,now):null;}
export function storeTime(at,now=Date.now()){
 if(!Number.isFinite(at))return 'No observation yet';
 const age=Math.max(0,Math.floor((now-at)/1000));const amount=age<60?age:age<3600?Math.floor(age/60):age<86400?Math.floor(age/3600):Math.floor(age/86400);const unit=age<60?'second':age<3600?'minute':age<86400?'hour':'day';const relative=amount+' '+unit+(amount===1?'':'s')+' ago';
 return relative+' · '+absoluteTime(at);
}
export function absoluteTime(at){return new Date(at).toLocaleString('en-PH',{timeZone:'Asia/Manila',year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:true})+' PHT';}
export async function copyField(field,status,label){const value=field.value.trim();if(!value){status.textContent='Enter '+label+' first.';return;}try{await navigator.clipboard.writeText(value);status.textContent=label+' copied.';}catch{if(field.type==='password')field.type='text';field.focus();field.select();status.textContent='Touch and hold the selected '+label+' and choose Copy. Hide the token when finished.';}}
