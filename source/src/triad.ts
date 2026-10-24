export const EDOS=[12,19,24,31,41,53] as const;
export type Edo=typeof EDOS[number];
export const isEdo=(n:unknown):n is Edo=>typeof n==='number'&&EDOS.includes(n as Edo);
export const mod=(v:number,N=31)=>((v%N)+N)%N;
export const ids=['A','B','C'] as const;
export type ChordId=typeof ids[number];
export const presets=[{id:'major',name:'長三和音',ratios:['1','5/4','3/2']},{id:'minor',name:'短三和音',ratios:['1','6/5','3/2']},{id:'seven-six',name:'7/6を含む三和音',ratios:['1','7/6','3/2']},{id:'nine-seven',name:'9/7を含む三和音',ratios:['1','9/7','3/2']}];
export type Chord={id:ChordId,name:string,enabled:boolean,rootOffset:number,intervals:number[],voicingOffsets:number[],presetId:string|null,sourceRatios:string[]|null};
export type Config={schemaVersion:2,mode:'triad-union',edo:Edo,tuning:{frequency:number,name:string},tonicStep:number,chords:Chord[],constraints:{targetNotes:7,requireTonic:true,requireLeadingTone:true,leadingToneSteps:{min:number,max:number}},auditionOrder:ChordId[]};
export type Workspace={schemaVersion:2,mode:'harmonic'|'triad-union',harmonic:{N:number,H:number,base:number,name:string},triad:Config};
export type Draft={edo?:Edo,id:ChordId,steps:number[],root:number|null,input:'latch'|'held',dirty:boolean,rootExplicit?:boolean};
export const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
export function presetShape(id:string,N=31){const p=presets.find(p=>p.id===id);if(!p)throw Error('プリセットが不正です');return p.ratios.map(v=>{const [a,b='1']=v.split('/').map(Number);return mod(Math.round(N*Math.log2(a/Number(b))),N);});}
export function defaultConfig(N:Edo=31):Config{return {schemaVersion:2,mode:'triad-union',edo:N,tuning:{frequency:261.625565,name:'C4'},tonicStep:0,chords:ids.map((id,i)=>({id,name:['種和音','下属側','属側'][i],enabled:true,rootOffset:[0,Math.round(N*Math.log2(4/3)),Math.round(N*Math.log2(3/2))][i],intervals:presetShape('major',N),voicingOffsets:presetShape('major',N),presetId:'major',sourceRatios:['1','5/4','3/2']})),constraints:{targetNotes:7,requireTonic:true,requireLeadingTone:true,leadingToneSteps:{min:Math.max(1,Math.round(2*N/31)),max:Math.max(1,Math.round(3*N/31))}},auditionOrder:['A','B','C','A']};}
export function defaultWorkspace():Workspace{return {schemaVersion:2,mode:'triad-union',harmonic:{N:31,H:16,base:261.625565,name:'C4'},triad:defaultConfig()};}
export function chordClasses(c:Chord,N=31){return c.intervals.map(i=>mod(c.rootOffset+i,N)).sort((a,b)=>a-b);}
export function synthesize(c:Config){const membership=new Map<number,ChordId[]>();c.chords.filter(c=>c.enabled).forEach(ch=>chordClasses(ch,c.edo).forEach(s=>membership.set(s,[...(membership.get(s)||[]),ch.id])));const steps=[...membership.keys()].sort((a,b)=>a-b);const gaps=steps.map((s,i)=>(steps[i+1]??steps[0]+c.edo)-s);const leading=steps.filter(s=>s!==0).at(-1)??null,leadingGap=leading===null?null:c.edo-leading;const hasTonic=steps.includes(0),leadingOK=hasTonic&&leadingGap!==null&&leadingGap>=c.constraints.leadingToneSteps.min&&leadingGap<=c.constraints.leadingToneSteps.max;return {steps,gaps,membership,hasTonic,leading,leadingGap,leadingOK,goal:steps.length===7&&hasTonic&&leadingOK,minGap:gaps.length?Math.min(...gaps):null,maxGap:gaps.length?Math.max(...gaps):null};}
export function draftFor(ch:Chord,c:Config):Draft{const root=c.tonicStep+ch.rootOffset;const steps=ch.voicingOffsets.map(v=>root+v);return {edo:c.edo,id:ch.id,steps,root:steps.find(s=>mod(s-root,c.edo)===0)??root,input:'latch',dirty:false,rootExplicit:true};}
export function draftValid(d:Draft,N=d.edo??31){return d.steps.length===3&&new Set(d.steps.map(s=>mod(s,N))).size===3&&d.root!==null&&d.steps.includes(d.root);}
export function registerDraft(d:Draft,c:Config):Config{if(!draftValid(d,c.edo))throw Error('異なる3音と、その中の根音を指定してください');const root=d.root!,next=clone(c),ch=next.chords.find(ch=>ch.id===d.id)!;ch.rootOffset=mod(root-c.tonicStep,c.edo);const canonical=c.tonicStep+ch.rootOffset;ch.intervals=d.steps.map(s=>mod(s-root,c.edo)).sort((a,b)=>a-b);ch.voicingOffsets=d.steps.map(s=>s-canonical);ch.presetId=null;return next;}
export function capturedSteps(voices:{step:number,source:string}[],N=31){const map=new Map<number,number>();voices.filter(v=>v.source==='manual').forEach(v=>{const pc=mod(v.step,N);if(!map.has(pc)||v.step<map.get(pc)!)map.set(pc,v.step);});return [...map.values()].sort((a,b)=>a-b);}
export function copyShape(from:Chord,to:Chord):Chord{return {...clone(to),intervals:[...from.intervals],voicingOffsets:[...from.voicingOffsets],presetId:from.presetId,sourceRatios:clone(from.sourceRatios)};}
const int=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
const obj=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const name=(x:unknown,max=80)=>typeof x==='string'&&x.length>0&&x.length<=max;
function fail(m:string):never{throw Error('読み込めません：'+m);}
export function validateConfig(v:unknown):Config{
 if(!obj(v)||![1,2].includes(v.schemaVersion)||v.mode!=='triad-union'||!isEdo(v.edo)||(v.schemaVersion===1&&v.edo!==31))fail('対応していない形式・バージョン・平均律です');
 if(!obj(v.tuning)||typeof v.tuning.frequency!=='number'||!Number.isFinite(v.tuning.frequency)||v.tuning.frequency<20||v.tuning.frequency>2000||!name(v.tuning.name,12))fail('調律参照が不正です');
 if(!int(v.tonicStep,-4*v.edo,4*v.edo)||!Array.isArray(v.chords)||v.chords.length!==3)fail('主音または和音数が不正です');
 for(const id of ids){const list=v.chords.filter((c:any)=>c?.id===id);if(list.length!==1)fail('A・B・Cを一つずつ指定してください');const c=list[0];
 if(!obj(c)||!name(c.name)||typeof c.enabled!=='boolean'||!int(c.rootOffset,0,v.edo-1))fail('和音情報が不正です');
 if(!Array.isArray(c.intervals)||c.intervals.length!==3||!c.intervals.every((n:any)=>int(n,0,v.edo-1))||new Set(c.intervals).size!==3||!c.intervals.includes(0))fail('和音の形は根音0を含む異なる3音が必要です');
 if(!Array.isArray(c.voicingOffsets)||c.voicingOffsets.length!==3||!c.voicingOffsets.every((n:any)=>int(n,-16*v.edo,16*v.edo))||c.voicingOffsets.map((n:number)=>mod(n,v.edo)).sort((a:number,b:number)=>a-b).join(',')!==[...c.intervals].sort((a:number,b:number)=>a-b).join(','))fail('ボイシングが和音の形と一致しません');
 if(c.presetId!==null&&(!name(c.presetId)||!presets.some(p=>p.id===c.presetId)))fail('プリセットが不正です');
 if(c.sourceRatios!==null&&(!Array.isArray(c.sourceRatios)||c.sourceRatios.length!==3||!c.sourceRatios.every((r:any)=>typeof r==='string'&&/^\d{1,6}(\/\d{1,6})?$/.test(r)&&r.split('/').every((n:string)=>+n>0))))fail('由来比率が不正です');
 }
 const k=v.constraints;if(!obj(k)||k.targetNotes!==7||k.requireTonic!==true||k.requireLeadingTone!==true||!obj(k.leadingToneSteps)||!int(k.leadingToneSteps.min,1,v.edo-1)||!int(k.leadingToneSteps.max,k.leadingToneSteps.min,v.edo-1))fail('探索条件が不正です');
 if(!Array.isArray(v.auditionOrder)||v.auditionOrder.length!==4||!v.auditionOrder.every((id:any)=>ids.includes(id)))fail('試奏順序はA・B・Cを使って4枠指定してください');
 return {...clone(v),schemaVersion:2} as Config;
}
export function validateWorkspace(v:unknown):Workspace{
 if(obj(v)&&v.mode==='triad-union'&&'edo' in v){const w=defaultWorkspace();w.triad=validateConfig(v);return w;}
 if(!obj(v)||![1,2].includes(v.schemaVersion)||!['harmonic','triad-union'].includes(v.mode))fail('保存形式が不正です');
 const h=v.harmonic;if(!obj(h)||!int(h.N,5,120)||!int(h.H,2,128)||typeof h.base!=='number'||!Number.isFinite(h.base)||h.base<20||h.base>2000||!name(h.name,12))fail('倍音モードの設定が不正です');
 const triad=validateConfig(v.triad);return {schemaVersion:2,mode:v.mode,harmonic:{N:h.N,H:h.H,base:h.base,name:h.name},triad};
}
export function decodeWorkspace(text:string){if(text.length>1000000)fail('ファイルが大きすぎます');return validateWorkspace(JSON.parse(text));}

// One seed shape, translated to three independently positioned roots.
export function shareSeedShape(c:Config):Config {const seed=c.chords.find(ch=>ch.id==='A')!;return {...c,chords:c.chords.map(ch=>copyShape(seed,ch))};}
export function sharedWorkspace(w:Workspace):Workspace{return {...w,triad:shareSeedShape(w.triad)};}
export function registerSeedDraft(d:Draft,c:Config):Config{return shareSeedShape(registerDraft({...d,id:'A'},c));}

export function changeEdo(c:Config,N:Edo):Config{
 if(!isEdo(N))throw Error('対応していない平均律です');
 if(c.edo===N)return clone(c);
 const ratio=N/c.edo,round=(n:number)=>Math.round(n*ratio),next=clone(c);
 next.edo=N;next.schemaVersion=2;next.tonicStep=round(c.tonicStep);
 next.constraints.leadingToneSteps={min:Math.max(1,round(c.constraints.leadingToneSteps.min)),max:Math.min(N-1,Math.max(1,round(c.constraints.leadingToneSteps.max)))};
 next.chords=c.chords.map(ch=>{
  // Presets retain their pure ratios; custom voicings retain nearest cents.
  const voicingOffsets=ch.presetId?presetShape(ch.presetId,N):ch.voicingOffsets.map(round);
  const intervals=[...new Set(voicingOffsets.map(v=>mod(v,N)))].sort((a,b)=>a-b);
  if(intervals.length!==3||!intervals.includes(0))throw Error(`${N} EDOでは種和音の音が同じ段に重なります。別の和音を選んでから切り替えてください。`);
  return {...ch,rootOffset:mod(round(ch.rootOffset),N),intervals,voicingOffsets};
 });
 return validateConfig(shareSeedShape(next));
}
