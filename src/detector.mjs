/** Controlled coded-sign recognition. This does not infer business status from
 * arbitrary scenes, people, lighting, ordinary text, or an unconfigured shutter.
 * Present the printed marker approximately square and front-facing to the camera.
 */
const payloads = {
  OPEN: ['10110', '01001', '11100', '00101', '10011'],
  CLOSED: ['11000', '10101', '00011', '11010', '01101'],
};
export const MARKERS = Object.freeze(Object.fromEntries(Object.entries(payloads).map(([status, rows]) => [status,
  Object.freeze({ id: `storewitness-${status.toLowerCase()}-v1`, status, grid: Object.freeze([
    Object.freeze([1,1,1,1,1,1,1]),
    ...rows.map(row => Object.freeze([1,...[...row].map(Number),1])),
    Object.freeze([1,1,1,1,1,1,1]),
  ]) }),
])));

function rotate(grid) { return grid.map((row,y) => row.map((_,x) => grid[6-x][y])); }
const variants = Object.values(MARKERS).flatMap(marker => {
  let grid = marker.grid;
  return Array.from({length:4}, (_,rotation) => {
    const result = { ...marker, grid, rotation: rotation * 90 };
    grid = rotate(grid); return result;
  });
});

export function createMarkerSVG(status) {
  const marker = MARKERS[status];
  if (!marker) throw new TypeError('Marker status must be OPEN or CLOSED');
  const cells = marker.grid.flatMap((row,y) => row.flatMap((bit,x) => bit ? [`<rect x="${70+x*80}" y="${70+y*80}" width="80" height="80"/>`] : [])).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="850" viewBox="0 0 700 850" role="img" aria-label="StoreWitness ${status} camera marker"><rect width="700" height="850" fill="white"/><g fill="black" shape-rendering="crispEdges">${cells}</g><text x="350" y="727" text-anchor="middle" font-family="Arial,sans-serif" font-size="75" font-weight="bold" fill="black">${status}</text><text x="350" y="782" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="black">StoreWitness · Victor Aguirre</text><text x="350" y="817" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="black">Keep the entire square visible and front-facing.</text></svg>`;
}

const uncertain = reason => ({ status:'UNCERTAIN', confidence:0, reason });

export function detectMarker(imageData) {
  const {width:w,height:h,data} = imageData ?? {};
  if (!Number.isInteger(w) || !Number.isInteger(h) || w<56 || h<56 || w*h>4_000_000 || !data || data.length<w*h*4) return uncertain('Invalid or unsupported image dimensions');
  const n=w*h, gray=new Uint8Array(n), hist=new Uint32Array(256);
  let sum=0;
  for(let i=0;i<n;i++) { const p=i*4; const v=(data[p]*77+data[p+1]*150+data[p+2]*29)>>8; gray[i]=v; hist[v]++; sum+=v; }
  // Otsu threshold adapts to moderate brightness changes. Contrast is checked
  // again on each marker, so flat/dim frames cannot become valid observations.
  let left=0,leftSum=0,best=-1,threshold=127;
  for(let t=0;t<255;t++) { left+=hist[t]; leftSum+=hist[t]*t; if(!left || left===n) continue;
    const delta=leftSum/left-(sum-leftSum)/(n-left), score=left*(n-left)*delta*delta;
    if(score>best) {best=score;threshold=t;}
  }
  if(best<0) return uncertain('No contrasting marker found');
  threshold=Math.min(210,Math.max(40,threshold));
  const visited=new Uint8Array(n), queue=new Int32Array(n), candidates=[];
  for(let start=0;start<n;start++) {
    if(visited[start] || gray[start]>threshold) continue;
    let head=0,tail=1; queue[0]=start;visited[start]=1;
    let minX=w,minY=h,maxX=0,maxY=0;
    while(head<tail) {
      const p=queue[head++],y=Math.floor(p/w),x=p-y*w;
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      const neighbors=[x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1];
      for(const q of neighbors) if(q>=0 && !visited[q] && gray[q]<=threshold) {visited[q]=1;queue[tail++]=q;}
    }
    const bw=maxX-minX+1,bh=maxY-minY+1,aspect=bw/bh;
    if(bw<56 || bh<56 || aspect<0.8 || aspect>1.25 || tail/(bw*bh)<0.24) continue;
    if(candidates.length<128) candidates.push({x:minX,y:minY,width:bw,height:bh});
  }
  const matches=[];
  for(const bounds of candidates) {
    const means=[];
    for(let cy=0;cy<7;cy++)for(let cx=0;cx<7;cx++) {
      const x0=Math.ceil(bounds.x+(cx+0.22)*bounds.width/7),x1=Math.floor(bounds.x+(cx+0.78)*bounds.width/7);
      const y0=Math.ceil(bounds.y+(cy+0.22)*bounds.height/7),y1=Math.floor(bounds.y+(cy+0.78)*bounds.height/7);
      let total=0,count=0;
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){total+=gray[y*w+x];count++;}
      means.push(total/count);
    }
    const sorted=[...means].sort((a,b)=>a-b), low=sorted[4],high=sorted[44],contrast=high-low;
    if(contrast<70)continue;
    const split=(low+high)/2,bits=means.map(v=>v<split?1:0);
    // Excessive middle tones usually indicate an out-of-focus or misaligned sign.
    if(means.filter(v=>Math.abs(v-split)<contrast*0.18).length>3)continue;
    const ranked=variants.map(v=>({...v,errors:v.grid.flat().reduce((acc,bit,i)=>acc+(bit!==bits[i]),0)})).sort((a,b)=>a.errors-b.errors);
    if(ranked[0].errors>1 || ranked[1].errors<=1)continue;
    const v=ranked[0];
    matches.push({status:v.status,markerId:v.id,bounds,confidence:Number(((1-v.errors/49)*Math.min(1,contrast/150)).toFixed(3)),reason:`Designated ${v.status} marker recognized${v.errors?' with one cell corrected':''}`});
  }
  if(matches.length>1)return uncertain('Multiple markers visible; show exactly one designated sign');
  return matches[0] ?? uncertain('No readable designated marker; keep the complete sign steady and front-facing');
}
