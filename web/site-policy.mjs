import {readChoice,saveChoice} from './privacy-choice.mjs';
let sessionChoice=null;
function storage(){try{return window.localStorage;}catch{return null;}}
export const canSavePreferences=()=>sessionChoice==='accept'||(sessionChoice===null&&readChoice(storage())==='accept');
const css=document.createElement('link');css.rel='stylesheet';css.href='/policy.css';document.head.append(css);
const footer=document.querySelector('footer')??document.body.appendChild(document.createElement('footer'));
const nav=document.createElement('nav');nav.className='policy-links';nav.setAttribute('aria-label','Policies and support');
for(const [label,url]of [['Terms','/terms'],['Privacy Policy','/privacy'],['Contact Us','/contact']]){const a=document.createElement('a');a.textContent=label;a.href=url;nav.append(a);}
const manage=document.createElement('button');manage.type='button';manage.textContent='Manage cookies';manage.className='policy-manage';nav.append(manage);footer.append(nav);
const banner=document.createElement('section');banner.className='cookie-panel';banner.setAttribute('role','region');banner.setAttribute('aria-label','Cookie and storage choices');
const title=document.createElement('h2');title.textContent='Your cookie & storage choice';title.id='privacy-choice-title';
const copy=document.createElement('p');copy.textContent='We remember this choice on your device. Accept also lets us save your opening hours here. Decline keeps hours for this session only. No advertising cookies. Camera access is always your choice.';
const link=document.createElement('a');link.href='/privacy';link.textContent='Read our Privacy Policy';
const actions=document.createElement('div');actions.className='cookie-actions';
const status=document.createElement('p');status.className='privacy-choice-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
document.body.append(status);
let returnFocus=null;
for(const [text,choice]of [['Accept','accept'],['Decline','decline']]){const b=document.createElement('button');b.type='button';b.className='button button-outline';b.textContent=text;b.onclick=()=>{sessionChoice=choice;const saved=saveChoice(storage(),choice);banner.hidden=true;document.body.classList.remove('cookie-choice-open');status.textContent=(choice==='accept'?'Optional preference storage accepted.':'Optional preference storage declined.')+(saved?' You can change this in Manage cookies.':' This choice applies to this page session because device storage is unavailable.');window.dispatchEvent(new Event('storewitness-privacy-change'));if(returnFocus){returnFocus.focus();returnFocus=null;}};actions.append(b);}
banner.append(title,copy,link,actions);document.body.append(banner);
function openChoices(focus=false){banner.hidden=false;document.body.classList.add('cookie-choice-open');if(focus){returnFocus=document.activeElement;banner.querySelector('button').focus();}}
manage.onclick=()=>openChoices(true);
const initial=readChoice(storage());banner.hidden=!!initial;if(!initial)openChoices();
window.addEventListener('storage',e=>{if(e.key==='storewitness-privacy-v1'){sessionChoice=null;banner.hidden=!!readChoice(storage());document.body.classList.toggle('cookie-choice-open',!banner.hidden);window.dispatchEvent(new Event('storewitness-privacy-change'));}});
