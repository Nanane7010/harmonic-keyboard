// Pure, bounded analysis of intervals above the lowest held note. Not scale generation.
export const LIMITS=[3,5,7,11,13] as const;
export const BOUNDS={numerator:32,denominator:32,product:256,tolerance:15};
export type Ratio={p:number,q:number,cents:number,complexity:number,prime:number};
export type Fit={limit:number,ratios:Ratio[],errors:number[],max:number,mean:number,complexity:number,prime:number};
export type RootBand={limit:number,index:number,ratio:Ratio,error:number,close:boolean};
export type Analysis={nearestBands:RootBand[],bands:RootBand[],frequencies:number[],fits:Fit[],recommended:number|null,closest:number|null,tolerance:number};
function gcd(a:number,b:number):number{return b?gcd(b,a%b):a;}
export function maxPrime(n:number){let max=1;for(let p=2;p*p<=n;p++)while(n%p===0){max=p;n/=p;}return Math.max(max,n);}
const pool:Ratio[]=[];
for(let q=1;q<=BOUNDS.denominator;q++)for(let p=q;p<=Math.min(2*q,BOUNDS.numerator);p++)if(gcd(p,q)===1&&p*q<=BOUNDS.product){const prime=Math.max(maxPrime(p),maxPrime(q));if(prime<=13)pool.push({p,q,cents:1200*Math.log2(p/q),complexity:Math.log2(p*q),prime});}
const pools=LIMITS.map(limit=>pool.filter(r=>r.prime<=limit));
export function analyze(input:number[],tolerance=BOUNDS.tolerance,rootFrequency?:number):Analysis{
 const frequencies=[...new Set(input.filter(f=>Number.isFinite(f)&&f>0))].sort((a,b)=>a-b);
 if(rootFrequency!==undefined&&frequencies.includes(rootFrequency)){frequencies.splice(frequencies.indexOf(rootFrequency),1);frequencies.unshift(rootFrequency);}
 const empty={nearestBands:[] as RootBand[],bands:[] as RootBand[],frequencies,fits:[],recommended:null,closest:null,tolerance};if(frequencies.length<2)return empty;
 const cents=frequencies.map(f=>1200*Math.log2(f/frequencies[0]));
 const fits=LIMITS.map((limit,li)=>{
  const options=cents.map((c,i)=>{const octave=Math.floor((c+1e-8)/1200);
   return pools[li].filter(r=>i!==0||r.p===1&&r.q===1).map(r=>{const p=r.p*2**Math.max(0,octave),q=r.q*2**Math.max(0,-octave),g=gcd(p,q);return {...r,p:p/g,q:q/g,cents:r.cents+octave*1200};});
  });
  const nearest=options.map((rs,i)=>rs.reduce((a,b)=>{const da=Math.abs(cents[i]-a.cents),db=Math.abs(cents[i]-b.cents);return db<da-1e-9||(Math.abs(db-da)<1e-9&&b.complexity<a.complexity)?b:a;}));
  const near=options.map((rs,i)=>rs.filter(r=>Math.abs(cents[i]-r.cents)<=tolerance+1e-9));
  // An admissible chord has signed errors inside a width-tolerance window containing zero.
  // Enumerating its possible minimum error gives an exact bounded minimum-complexity fit.
  const starts=[...new Set([0,...near.flatMap((rs,i)=>rs.map(r=>cents[i]-r.cents).filter(e=>e<=0))])];
  let ratios=nearest,best=Infinity,bestDeviation=Infinity;
  for(const low of starts){const candidate:Ratio[]=[];let score=0,deviation=0;
   for(let i=0;i<near.length;i++){const choices=near[i].filter(r=>{const e=cents[i]-r.cents;return e>=low-1e-9&&e<=low+tolerance+1e-9;});
    if(!choices.length)break;
    const r=choices.reduce((a,b)=>b.complexity<a.complexity-1e-9||(Math.abs(b.complexity-a.complexity)<1e-9&&Math.abs(cents[i]-b.cents)<Math.abs(cents[i]-a.cents))?b:a);candidate.push(r);score+=r.complexity;deviation+=Math.abs(cents[i]-r.cents);
   }
   if(candidate.length===cents.length&&(score<best-1e-9||Math.abs(score-best)<1e-9&&deviation<bestDeviation)){ratios=candidate;best=score;bestDeviation=deviation;}
  }
  const errors=cents.map((c,i)=>c-ratios[i].cents);let sum=0,count=0,max=0;
  for(let i=0;i<errors.length;i++)for(let j=i+1;j<errors.length;j++){const d=Math.abs(errors[i]-errors[j]);sum+=d;count++;max=Math.max(max,d);}
  return {limit,ratios,errors,max,mean:sum/count,complexity:ratios.reduce((s,r)=>s+r.complexity,0),prime:Math.max(...ratios.map(r=>r.prime))};
 });
 // All pools share identical complexity bounds. Lower prime limit wins among close fits;
 // complexity is the second tie-break, not an unconstrained accuracy contest.
 const acceptable=fits.filter(f=>f.max<=tolerance).sort((a,b)=>a.prime-b.prime||a.complexity-b.complexity||a.max-b.max||a.limit-b.limit);
 const closest=[...fits].sort((a,b)=>a.max-b.max||a.complexity-b.complexity||a.limit-b.limit)[0];
 const bands:RootBand[]=LIMITS.flatMap(limit=>cents.slice(1).map((c,j)=>{
  const octave=Math.floor((c+1e-8)/1200),folded=c-octave*1200;
  const family=pool.filter(r=>limit===3?r.prime<=3:r.prime===limit);
  const close=family.filter(r=>Math.abs(folded-r.cents)<=tolerance);
  const r=(close.length?close:family).reduce((a,b)=>{if(close.length&&Math.abs(a.complexity-b.complexity)>1e-9)return b.complexity<a.complexity?b:a;return Math.abs(folded-b.cents)<Math.abs(folded-a.cents)?b:a;});
  const p=r.p*2**Math.max(0,octave),q=r.q*2**Math.max(0,-octave),g=gcd(p,q),error=folded-r.cents;
  return {limit,index:j+1,ratio:{...r,p:p/g,q:q/g,cents:r.cents+1200*octave},error,close:Math.abs(error)<=tolerance};
 }));
 return {nearestBands:nearestRootBands(frequencies,tolerance),bands,frequencies,fits,recommended:acceptable[0]?.limit??null,closest:closest.limit,tolerance};
}

// Beta: nearest candidate in each exact prime family, including octave neighbours.
// Input is already root-first. Bounds are identical to the standard analysis.
export function nearestRootBands(frequencies:number[],tolerance=BOUNDS.tolerance):RootBand[]{
 if(frequencies.length<2)return [];
 return LIMITS.flatMap(limit=>frequencies.slice(1).map((f,j)=>{
  const cents=1200*Math.log2(f/frequencies[0]),octave=Math.floor(cents/1200);
  const candidates=pool.filter(r=>limit===3?r.prime<=3:r.prime===limit).flatMap(r=>[octave-1,octave,octave+1].map(o=>{
   const p=r.p*2**Math.max(0,o),q=r.q*2**Math.max(0,-o),g=gcd(p,q);
   return {...r,p:p/g,q:q/g,cents:r.cents+o*1200};
  }));
  const ratio=candidates.reduce((a,b)=>{const da=Math.abs(cents-a.cents),db=Math.abs(cents-b.cents);return db<da-1e-9||(Math.abs(db-da)<1e-9&&b.complexity<a.complexity)?b:a;});
  const error=cents-ratio.cents;
  return {limit,index:j+1,ratio,error,close:Math.abs(error)<=tolerance};
 }));
}
