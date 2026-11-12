const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const items=document.querySelectorAll('.hero,.page-intro,.intro,.status-card,.activity-card,.trust-grid article,.operator-grid>.panel,.override-panel,.metric-grid,.scope-note,.maker-line,.stage,.control-panel,.explanation-grid article,.scope');
if('IntersectionObserver'in window&&!reduce.matches){
 document.documentElement.classList.add('motion-enabled');
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}},{threshold:.08,rootMargin:'0px 0px -15px 0px'});
 items.forEach((el,i)=>{el.classList.add('reveal');el.style.setProperty('--reveal-delay',Math.min(i%3*60,120)+'ms');observer.observe(el);});
 reduce.addEventListener('change',()=>{if(reduce.matches){document.documentElement.classList.remove('motion-enabled');observer.disconnect();}},{once:true});
}
let scheduled=false;function progress(){const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--reading-progress',String(max>0?Math.min(1,Math.max(0,scrollY/max)):0));scheduled=false;}
addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(progress);}},{passive:true});addEventListener('resize',progress);progress();
