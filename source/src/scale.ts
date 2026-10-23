export type Harmonic={n:number,error:number};
export function scale(N:number,H:number){
 if(!Number.isInteger(N)||N<5||N>120||!Number.isInteger(H)||H<2||H>128)throw Error('設定範囲外');
 const harmonics=new Map<number,Harmonic[]>();
 for(let n=1;n<=H;n++){const raw=N*Math.log2(n), rounded=Math.round(raw),s=rounded%N;harmonics.set(s,[...(harmonics.get(s)||[]),{n,error:(rounded-raw)*1200/N}]);}
 const white=[...harmonics.keys()].sort((a,b)=>a-b);return {white,harmonics,gaps:white.map((s,i)=>(white[i+1]??N)-s)};
}
export const frequency=(base:number,step:number,N:number)=>base*2**(step/N);
export function ratioCandidates(cents:number){const a=[];for(let q=1;q<=16;q++)for(let p=q;p<=32;p++){if(gcd(p,q)!==1)continue;const error=cents-1200*Math.log2(p/q);a.push({p,q,error});}return a.sort((a,b)=>Math.abs(a.error)-Math.abs(b.error)||a.p+a.q-b.p-b.q).slice(0,3);}
function gcd(a:number,b:number):number{return b?gcd(b,a%b):a;}
