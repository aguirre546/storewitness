export const boardId=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
export function tripAlert(data,now=Date.now()){
 if(!data||data.archived||data.status!=='CLOSED')return null;
 const owner=data.override?.expiresAt>now&&data.override.status==='CLOSED';
 if(!owner&&(data.source!=='camera'&&data.mode!=='replay'||!Number.isFinite(data.lastSeenAt)||now-data.lastSeenAt>=35000||!data.lastConfirmedAt))return null;
 const source=owner?'owner':data.mode==='replay'?'replay':'camera';
 return {key:[data.id,source,owner?data.override.setAt:data.lastConfirmedAt,data.override?.kind??'closed'].join(':'),source,title:data.override?.kind==='break'?'Destination is on a break':'Destination is closed',message:(data.mode==='replay'?'Demo alert. ':'')+data.name+(data.override?.kind==='break'?' is on a break. ':' is closed. ')+(source==='camera'?'Confirmed camera sign reading. ':source==='owner'?'Owner supplied this status. ':'Replay test observation. ')+'Check alternatives when safely parked.'};
}
export function cleanLocations(input,id){
 if(!input||typeof input!=='object')throw Error('Enter location settings.');
 const address=String(input.address??'').trim();if(address.length>180)throw Error('Address must be at most 180 characters.');
 const coordinate=(value,max)=>{if(value===''||value===null||value===undefined)return null;const n=Number(value);if(!Number.isFinite(n)||Math.abs(n)>max)throw Error('Check latitude and longitude.');return n;};
 const latitude=coordinate(input.latitude,90),longitude=coordinate(input.longitude,180);if((latitude===null)!==(longitude===null))throw Error('Enter both coordinates or leave both blank.');
 if(!Array.isArray(input.branches)||input.branches.length>6)throw Error('Link up to six participating Store IDs.');
 const branches=[...new Set(input.branches)];if(branches.some(x=>!boardId(x)||x===id))throw Error('Use valid Store IDs different from this store.');
 return {address,latitude,longitude,branches};
}
export function distanceKm(a,b){if(![a?.latitude,a?.longitude,b?.latitude,b?.longitude].every(Number.isFinite))return null;const rad=x=>x*Math.PI/180,dlat=rad(b.latitude-a.latitude),dlon=rad(b.longitude-a.longitude);const v=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;return Math.round(6371*2*Math.asin(Math.sqrt(Math.min(1,v)))*10)/10;}
export function eligibleAlternative(data,now,mode){return !!data&&!data.archived&&data.mode===mode&&data.status==='OPEN'&&(data.source==='owner'?data.override?.status==='OPEN'&&data.override.expiresAt>now:Number.isFinite(data.lastSeenAt)&&now-data.lastSeenAt<35000&&!!data.lastConfirmedAt);}
