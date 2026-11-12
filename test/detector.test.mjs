import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKERS,detectMarker,createMarkerSVG} from '../src/detector.mjs';

function frame(width=400,height=300,shade=245){
  const data=new Uint8ClampedArray(width*height*4);
  for(let p=0;p<data.length;p+=4){data[p]=data[p+1]=data[p+2]=shade;data[p+3]=255;}
  return {width,height,data};
}
function rect(image,x0,y0,width,height,shade){
  for(let y=y0;y<y0+height;y++)for(let x=x0;x<x0+width;x++){
    const p=(y*image.width+x)*4;image.data[p]=image.data[p+1]=image.data[p+2]=shade;
  }
}
function draw(image,status,{x=80,y=60,cell=20,rotation=0,dark=15,light=245,flip=[]}={}){
  let grid=MARKERS[status].grid.map(row=>[...row]);
  for(let i=0;i<rotation;i++)grid=grid.map((row,y)=>row.map((_,x)=>grid[6-x][y]));
  for(const [cx,cy] of flip)grid[cy][cx]^=1;
  grid.forEach((row,cy)=>row.forEach((bit,cx)=>rect(image,x+cx*cell,y+cy*cell,cell,cell,bit?dark:light)));
}
for(const status of ['OPEN','CLOSED'])for(let rotation=0;rotation<4;rotation++){
  test(`${status} actual raster pixels at ${rotation*90} degrees`,()=>{
    const image=frame();draw(image,status,{rotation});const result=detectMarker(image);
    assert.equal(result.status,status);assert.equal(result.markerId,MARKERS[status].id);
    assert.ok(result.confidence>0.9);assert.deepEqual(result.bounds,{x:80,y:60,width:140,height:140});
  });
}
test('moderate low lighting and reduced contrast',()=>{
  const image=frame(400,300,165);draw(image,'OPEN',{dark:35,light:165});assert.equal(detectMarker(image).status,'OPEN');
});
test('one payload bit error is corrected',()=>{
  const image=frame();draw(image,'CLOSED',{flip:[[2,2]]});const result=detectMarker(image);
  assert.equal(result.status,'CLOSED');assert.match(result.reason,/one cell/);
});
test('malformed payload with several altered bits is uncertain',()=>{
  const image=frame();draw(image,'OPEN',{flip:[[1,1],[2,2],[3,3],[4,4]]});assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('blank, solid black, gray and low contrast frames are uncertain',()=>{
  for(const shade of [0,100,255])assert.equal(detectMarker(frame(400,300,shade)).status,'UNCERTAIN');
  const image=frame(400,300,125);draw(image,'CLOSED',{dark:90,light:125});assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('solid black square is not a sign',()=>{
  const image=frame();rect(image,80,60,140,140,0);assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('partially obstructed marker is uncertain',()=>{
  const image=frame();draw(image,'OPEN');rect(image,95,70,70,95,160);assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('small marker below 56 pixels is rejected',()=>{
  const image=frame();draw(image,'OPEN',{cell:7});assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('minimum 56 pixel marker is accepted',()=>{
  const image=frame();draw(image,'OPEN',{cell:8});assert.equal(detectMarker(image).status,'OPEN');
});
test('two contradictory markers are uncertain',()=>{
  const image=frame(640,480);draw(image,'OPEN',{x:40,y:50});draw(image,'CLOSED',{x:300,y:100});
  assert.equal(detectMarker(image).status,'UNCERTAIN');assert.match(detectMarker(image).reason,/Multiple/);
});
test('two same-status markers are also uncertain',()=>{
  const image=frame(640,480);draw(image,'OPEN',{x:40,y:50});draw(image,'OPEN',{x:300,y:100});assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('seeded random pixel noise does not create a marker',()=>{
  const image=frame();let seed=42;
  for(let p=0;p<image.data.length;p+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed>>>24;image.data[p]=image.data[p+1]=image.data[p+2]=v;}
  assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('severe horizontal smearing is uncertain',()=>{
  const image=frame();draw(image,'OPEN');const source=image.data.slice();
  for(let y=50;y<210;y++)for(let x=65;x<235;x++){
    let sum=0;for(let dx=-22;dx<=22;dx++)sum+=source[(y*image.width+x+dx)*4];
    const p=(y*image.width+x)*4;image.data[p]=image.data[p+1]=image.data[p+2]=sum/45;
  }
  assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('malformed images reject without throwing',()=>{
  for(const image of [null,{},frame(20,20),{width:400,height:300,data:[]}])assert.equal(detectMarker(image).status,'UNCERTAIN');
});
test('print SVG includes correct marker and honest readable label',()=>{
  for(const status of ['OPEN','CLOSED']){
    const svg=createMarkerSVG(status);assert.match(svg,new RegExp(`>${status}</text>`));
    assert.match(svg,/Victor Aguirre/);assert.match(svg,/shape-rendering="crispEdges"/);
    assert.equal((svg.match(/width="80" height="80"/g)||[]).length,MARKERS[status].grid.flat().filter(Boolean).length);
  }
  assert.throws(()=>createMarkerSVG('BROKEN'),/OPEN or CLOSED/);
});
