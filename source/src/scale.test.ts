import {scale,frequency} from './scale.ts';
function assert(v:boolean,m:string){if(!v)throw Error(m);}
assert(JSON.stringify(scale(31,16).white)==='[0,5,10,14,18,22,25,28]','white');
assert(JSON.stringify(scale(31,16).gaps)==='[5,5,4,4,4,3,3,3]','gaps');
assert(Math.abs(14*1200/31-541.93548)<.00001,'11th');assert(Math.abs(10*1200/31-387.09677)<.00001,'third');
assert(frequency(261.625565,31,31)===523.25113,'octave');
for(let n=5;n<=120;n++)for(let h=2;h<=128;h++){const s=scale(n,h);assert(s.white[0]===0&&new Set(s.white).size===s.white.length,'unique');assert(s.gaps.reduce((a,b)=>a+b,0)===n,'coverage');}
console.log('PASS: default scale, intervals, octave, all 14,732 N/H combinations');
