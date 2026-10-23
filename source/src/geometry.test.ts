import {keyboardGeometry,pitchX,bandShape} from './geometry.ts';
import {scale} from './scale.ts';
import {analyze,maxPrime} from './limit.ts';
const assert=(v:boolean,m:string)=>{if(!v)throw Error(m);};
for(const N of [5,12,31,53,120])for(const H of [2,16,128])for(const zoom of [.8,1,2])for(const oct of [-4,0,4]){
 const s=scale(N,H),g=keyboardGeometry(N,s.white,s.gaps,oct,zoom);assert(g.keys.length===N*2,'all keys mapped');
 g.keys.forEach((k,i)=>{assert(k.step===oct*N+i,'pitch ordering');assert(pitchX(k.step,g.keys)===k.x,'monitor aligns with exact key centre');assert(k.x>=0&&k.x<g.total,'key within shared width');if(i)assert(k.x>g.keys[i-1].x,'monotonic pitch axis');});
 const step=oct*N+.5;assert(Math.abs(pitchX(step,g.keys)-(g.keys[0].x+g.keys[1].x)/2)<1e-8,'continuous pitch projection');
}
const g=keyboardGeometry(31,scale(31,16).white,scale(31,16).gaps,0,1);assert(pitchX(0,g.keys)===45,'root white centre');assert(pitchX(1,g.keys)===90,'first black centre');assert(pitchX(5,g.keys)===135,'next white centre');
const frequencies=[0,10,18,25,14].map(s=>261.625565*2**(s/31)),r=analyze(frequencies);assert(r.bands.length===20,'all five families for each root interval');
for(const b of r.bands){assert(b.index>0,'only root to non-root');const prime=Math.max(maxPrime(b.ratio.p),maxPrime(b.ratio.q));assert(b.limit===3?prime<=3:prime===b.limit,'exact prime family');const cents=1200*Math.log2(r.frequencies[b.index]/r.frequencies[0]);assert(Math.abs(cents-b.ratio.cents-b.error)<1e-8,'root-relative error');const rootX=45,target=pitchX(31*Math.log2(r.frequencies[b.index]/r.frequencies[0]),g.keys),shape=bandShape(b.limit,rootX,target);assert(shape.path.startsWith(`M ${rootX} `),'every band starts at same root x');}
assert(r.bands.some(b=>b.limit===3&&b.ratio.p===3&&b.ratio.q===2&&b.close),'fifth shown in 3 family inside larger chord');assert(r.bands.some(b=>b.limit===5&&b.ratio.p===5&&b.ratio.q===4&&b.close),'third shown in 5 family');assert(r.bands.some(b=>b.limit===7&&b.ratio.p===7&&b.ratio.q===4&&b.close),'7/4');assert(r.bands.some(b=>b.limit===11&&b.ratio.p===11&&b.ratio.q===8&&b.close),'11/8');
assert(bandShape(3,0,100).y0===bandShape(3,0,100).y1,'3 horizontal');assert(bandShape(5,0,100).y0>bandShape(3,0,100).y0,'5 lower');assert(bandShape(7,0,100).y1>bandShape(7,0,100).y0,'7 descends');assert(bandShape(11,0,100).y1<bandShape(11,0,100).y0,'11 ascends');assert(bandShape(13,0,100).path.includes(' C '),'13 curve');
console.log('PASS: 135 layout configurations, exact key/monitor coordinates, all 5 prime families, root-only bands and 5 distinct shapes');
