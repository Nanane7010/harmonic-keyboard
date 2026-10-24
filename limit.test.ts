import {analyze,BOUNDS,maxPrime} from './limit.ts';
function assert(v:boolean,m:string){if(!v)throw Error(m);}
const chord=(steps:number[],n=31)=>analyze(steps.map(s=>261.625565*2**(s/n)));
const major=chord([0,10,18]);assert(major.recommended===5,'31 EDO major recommends 5-limit');const f=major.fits.find(f=>f.limit===5)!;assert(f.ratios.map(r=>r.p+'/'+r.q).join(',')==='1/1,5/4,3/2','major ratios');assert(f.max<6,'major error');
const seventh=chord([0,10,18,25]);assert(seventh.recommended===7,'harmonic seventh recommends 7-limit');assert(seventh.fits.find(f=>f.limit===7)!.ratios.some(r=>r.p===7&&r.q===4),'7/4');
const eleven=chord([0,14,18]);assert(eleven.recommended===11,'11th recommends 11-limit');assert(eleven.fits.find(f=>f.limit===11)!.ratios.some(r=>r.p===11&&r.q===8),'11/8');
const thirteen=analyze([200,250,325]);assert(thirteen.fits.find(f=>f.limit===13)!.ratios.some(r=>r.p===13&&r.q===8),'13/8 candidate');
assert(chord([0]).fits.length===0,'single note waits');assert(analyze([200,200]).fits.length===0,'duplicate input');assert(analyze([NaN,Infinity,-1,0]).fits.length===0,'invalid');
const invers=analyze([250,300,400]);assert(invers.fits.find(f=>f.limit===5)!.ratios.map(r=>r.p+'/'+r.q).join(',')==='1/1,6/5,8/5','inversion');
assert(chord([31,41,49]).recommended===major.recommended,'octave invariant');assert(chord([0,10,49]).recommended===5,'voicing');
const exact=analyze([200,250,300]);assert(exact.fits.find(f=>f.limit===5)!.max<1e-9,'exact major');
assert(analyze([200,201]).recommended===3,'close unison');assert(chord([0,1,2]).recommended===null,'no close candidate');
for(let n=5;n<=120;n++){const result=chord([0,Math.round(n*.32),Math.round(n*.58)],n);for(const fit of result.fits){assert(fit.ratios.every(r=>Math.max(maxPrime(r.p),maxPrime(r.q))<=fit.limit),'limit prime');assert(Number.isFinite(fit.mean)&&fit.max>=fit.mean,'errors');for(const r of fit.ratios)assert(r.p<=BOUNDS.numerator&&r.q<=BOUNDS.denominator&&r.p*r.q<=BOUNDS.product,'common bounds');}}
const start=performance.now();for(let i=0;i<100;i++)chord(Array.from({length:64},(_,j)=>j));console.log('64-note analysis average ms:',(performance.now()-start)/100);
console.log('PASS: major, 7th, 11th, 13th, inversion, voicing, octave invariance, empty, duplicates, bound fairness and no match');console.log(JSON.stringify([major,seventh,eleven].map(r=>({recommended:r.recommended,fit:r.fits.find(f=>f.limit===r.recommended)})),null,2));
