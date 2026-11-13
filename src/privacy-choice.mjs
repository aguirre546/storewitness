export const PRIVACY_KEY='storewitness-privacy-v1';
export const HOURS_KEY='storewitness-hours';
export const CHOICE_TTL=180*24*60*60*1000;
export function readChoice(storage,now=Date.now()){
 try{const p=JSON.parse(storage.getItem(PRIVACY_KEY));return p&&['accept','decline'].includes(p.choice)&&Number.isFinite(p.expiresAt)&&p.expiresAt>now&&p.expiresAt<=now+CHOICE_TTL?p.choice:null;}catch{return null;}
}
export function saveChoice(storage,choice,now=Date.now()){
 if(!['accept','decline'].includes(choice))throw new TypeError('Choose accept or decline.');
 try{if(choice==='decline'){storage.removeItem(HOURS_KEY);const keys=[];for(let i=0;i<(storage.length??0);i++){const key=storage.key(i);if(key?.startsWith(HOURS_KEY+':'))keys.push(key);}for(const key of keys)storage.removeItem(key);}storage.setItem(PRIVACY_KEY,JSON.stringify({choice,expiresAt:now+CHOICE_TTL}));return true;}catch{return false;}
}
