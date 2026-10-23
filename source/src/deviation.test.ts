import assert from 'node:assert/strict';
import {analyze,nearestRootBands,LIMITS,maxPrime,BOUNDS} from './limit.ts';
import {deviationSegment,keyboardGeometry,pitchX} from './geometry.ts';
import {scale} from './scale.ts';
const base=261.625565,s=scale(31,16),keys=keyboardGeometry(31,s.white,s.gaps,-1,1,3).keys;
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
for(const cents of [-1301,-1199,-701,-1,0,1,387.1,541.94,696.77,1199,1201,2401]){
 const bands=nearestRootBands([base,base*2**(cents/1200)]);
 assert.equal(bands.length,5);
 for(const b of bands){
  assert(b.limit===3?b.ratio.prime<=3:b.ratio.prime===b.limit);
  let best=Infinity;
  for(let q=1;q<=BOUNDS.denominator;q++)for(let p=q;p<=Math.min(2*q,BOUNDS.numerator);p++)if(gcd(p,q)===1&&p*q<=BOUNDS.product){const prime=Math.max(maxPrime(p),maxPrime(q));if(!(b.limit===3?prime<=3:prime===b.limit))continue;
   for(let o=-4;o<=4;o++)best=Math.min(best,Math.abs(cents-1200*Math.log2(p/q)-o*1200));
  }
  assert(Math.abs(Math.abs(b.error)-best)<1e-7,'global nearest bounded candidate across octaves');
 }
}
for(const error of [-120,-10,0,10,120]){
 const ideal=base*1.25,actual=ideal*2**(error/1200),d=deviationSegment(5,base,actual,1.25,error,31,base,keys);
 assert(Math.abs(d.idealFrequency-ideal)<1e-9);
 assert.equal(d.actualX,pitchX(31*Math.log2(actual/base),keys));
 assert.equal(Math.sign(d.actualX-d.idealX),Math.sign(error));
 assert.equal(Math.sign(d.actualY-d.idealY),-Math.sign(error)||0);
 assert(Math.abs(d.actualY-d.idealY)<18);
}
const major=analyze([0,10,18].map(v=>base*2**(v/31)));assert.equal(major.recommended,5);assert.equal(major.nearestBands.length,10);
const third=major.nearestBands.find(b=>b.limit===5&&b.index===1)!;assert.equal(third.ratio.p/third.ratio.q,1.25);assert(Math.abs(third.error-.7830603287)<1e-7);
assert.equal(analyze([]).nearestBands.length,0);assert.equal(analyze([base]).nearestBands.length,0);
const inv=analyze([base,base*1.25,base*1.5],15,base*1.25);assert(inv.nearestBands.some(b=>b.limit===5&&Math.abs(b.ratio.p/b.ratio.q-.8)<1e-9&&Math.abs(b.error)<1e-7));
console.log('PASS: beta nearest ratios, octave boundaries, negative intervals, explicit root, exact matches, signed visual projection and unchanged major recommendation');
