export const mod=(v:number,N=31)=>((v%N)+N)%N;
export const ids=['A','B','C'] as const;
export type ChordId=typeof ids[number];
export const presets=[{id:'major',name:'長三和音',ratios:['1','5/4','3/2']},{id:'minor',name:'短三和音',ratios:['1','6/5','3/2']},{id:'seven-six',name:'7/6を含む三和音',ratios:['1','7/6','3/2']},{id:'nine-seven',name:'9/7を含む三和音',ratios:['1','9/7','3/2']}];
export type Chord={id:ChordId,name:string,enabled:boolean,rootOffset:number,intervals:number[],voicingOffsets:number[],presetId:string|null,sourceRatios:string[]|null};
export type Config={schemaVersion:1,mode:'triad-union',edo:31,tuning:{frequency:number,name:string},tonicStep:number,chords:Chord[],constraints:{targetNotes:7,requireTonic:true,requireLeadingTone:true,leadingToneSteps:{min:number,max:number}},auditionOrder:ChordId[]};
export type Workspace={schemaVersion:1,mode:'harmonic'|'triad-union',harmonic:{N:number,H:number,base:number,name:string},triad:Config};
export type Draft={id:ChordId,steps:number[],root:number|null,input:'latch'|'held',dirty:boolean,rootExplicit?:boolean};
export const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
export function presetShape(id:string,N=31){const p=presets.find(p=>p.id===id);if(!p)throw Error('プリセットが不正です');return p.ratios.map(v=>{const [a,b='1']=v.split('/').map(Number);return mod(Math.round(N*Math.log2(a/Number(b))),N);});}
export function defaultConfig():Config{return {schemaVersion:1,mode:'triad-union',edo:31,tuning:{frequency:261.625565,name:'C4'},tonicStep:0,chords:ids.map((id,i)=>({id,name:['種和音','下属側','属側'][i],enabled:true,rootOffset:[0,13,18][i],intervals:[0,10,18],voicingOffsets:[0,10,18],presetId:'major',sourceRatios:['1','5/4','3/2']})),constraints:{targetNotes:7,requireTonic:true,requireLeadingTone:true,leadingToneSteps:{min:2,max:3}},auditionOrder:['A','B','C','A']};}
export function defaultWorkspace():Workspace{return {schemaVersion:1,mode:'triad-union',harmonic:{N:31,H:16,base:261.625565,name:'C4'},triad:defaultConfig()};}
export function chordClasses(c:Chord){return c.intervals.map(i=>mod(c.rootOffset+i)).sort((a,b)=>a-b);}
export function synthesize(c:Config){const membership=new Map<number,ChordId[]>();c.chords.filter(c=>c.enabled).forEach(ch=>chordClasses(ch).forEach(s=>membership.set(s,[...(membership.get(s)||[]),ch.id])));const steps=[...membership.keys()].sort((a,b)=>a-b);const gaps=steps.map((s,i)=>(steps[i+1]??steps[0]+31)-s);const leading=steps.filter(s=>s!==0).at(-1)??null,leadingGap=leading===null?null:31-leading;const hasTonic=steps.includes(0),leadingOK=hasTonic&&leadingGap!==null&&leadingGap>=c.constraints.leadingToneSteps.min&&leadingGap<=c.constraints.leadingToneSteps.max;return {steps,gaps,membership,hasTonic,leading,leadingGap,leadingOK,goal:steps.length===7&&hasTonic&&leadingOK,minGap:gaps.length?Math.min(...gaps):null,maxGap:gaps.length?Math.max(...gaps):null};}
export function draftFor(ch:Chord,c:Config):Draft{const root=c.tonicStep+ch.rootOffset;const steps=ch.voicingOffsets.map(v=>root+v);return {id:ch.id,steps,root:steps.find(s=>mod(s-root)===0)??root,input:'latch',dirty:false,rootExplicit:true};}
export function draftValid(d:Draft){return d.steps.length===3&&new Set(d.steps.map(s=>mod(s))).size===3&&d.root!==null&&d.steps.includes(d.root);}
export function registerDraft(d:Draft,c:Config):Config{if(!draftValid(d))throw Error('異なる3音と、その中の根音を指定してください');const root=d.root!,next=clone(c),ch=next.chords.find(ch=>ch.id===d.id)!;ch.rootOffset=mod(root-c.tonicStep);const canonical=c.tonicStep+ch.rootOffset;ch.intervals=d.steps.map(s=>mod(s-root)).sort((a,b)=>a-b);ch.voicingOffsets=d.steps.map(s=>s-canonical);ch.presetId=null;return next;}
export function capturedSteps(voices:{step:number,source:string}[]){const map=new Map<number,number>();voices.filter(v=>v.source==='manual').forEach(v=>{const pc=mod(v.step);if(!map.has(pc)||v.step<map.get(pc)!)map.set(pc,v.step);});return [...map.values()].sort((a,b)=>a-b);}
export function copyShape(from:Chord,to:Chord):Chord{return {...clone(to),intervals:[...from.intervals],voicingOffsets:[...from.voicingOffsets],presetId:from.presetId,sourceRatios:clone(from.sourceRatios)};}
const int=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
const obj=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const name=(x:unknown,max=80)=>typeof x==='string'&&x.length>0&&x.length<=max;
function fail(m:string):never{throw Error('読み込めません：'+m);}
export function validateConfig(v:unknown):Config{
 if(!obj(v)||v.schemaVersion!==1||v.mode!=='triad-union'||v.edo!==31)fail('対応していない形式・バージョン・平均律です');
 if(!obj(v.tuning)||typeof v.tuning.frequency!=='number'||!Number.isFinite(v.tuning.frequency)||v.tuning.frequency<20||v.tuning.frequency>2000||!name(v.tuning.name,12))fail('調律参照が不正です');
 if(!int(v.tonicStep,-124,124)||!Array.isArray(v.chords)||v.chords.length!==3)fail('主音または和音数が不正です');
 for(const id of ids){const list=v.chords.filter((c:any)=>c?.id===id);if(list.length!==1)fail('A・B・Cを一つずつ指定してください');const c=list[0];
 if(!obj(c)||!name(c.name)||typeof c.enabled!=='boolean'||!int(c.rootOffset,0,30))fail('和音情報が不正です');
 if(!Array.isArray(c.intervals)||c.intervals.length!==3||!c.intervals.every((n:any)=>int(n,0,30))||new Set(c.intervals).size!==3||!c.intervals.includes(0))fail('和音の形は根音0を含む異なる3音が必要です');
 if(!Array.isArray(c.voicingOffsets)||c.voicingOffsets.length!==3||!c.voicingOffsets.every((n:any)=>int(n,-496,496))||c.voicingOffsets.map((n:number)=>mod(n)).sort((a:number,b:number)=>a-b).join(',')!==[...c.intervals].sort((a:number,b:number)=>a-b).join(','))fail('ボイシングが和音の形と一致しません');
 if(c.presetId!==null&&(!name(c.presetId)||!presets.some(p=>p.id===c.presetId)))fail('プリセットが不正です');
 if(c.sourceRatios!==null&&(!Array.isArray(c.sourceRatios)||c.sourceRatios.length!==3||!c.sourceRatios.every((r:any)=>typeof r==='string'&&/^\d{1,6}(\/\d{1,6})?$/.test(r)&&r.split('/').every((n:string)=>+n>0))))fail('由来比率が不正です');
 }
 const k=v.constraints;if(!obj(k)||k.targetNotes!==7||k.requireTonic!==true||k.requireLeadingTone!==true||!obj(k.leadingToneSteps)||!int(k.leadingToneSteps.min,1,30)||!int(k.leadingToneSteps.max,k.leadingToneSteps.min,30))fail('探索条件が不正です');
 if(!Array.isArray(v.auditionOrder)||v.auditionOrder.length!==4||!v.auditionOrder.every((id:any)=>ids.includes(id)))fail('試奏順序はA・B・Cを使って4枠指定してください');
 return clone(v) as Config;
}
export function validateWorkspace(v:unknown):Workspace{
 if(obj(v)&&v.mode==='triad-union'&&v.edo===31){const w=defaultWorkspace();w.triad=validateConfig(v);return w;}
 if(!obj(v)||v.schemaVersion!==1||!['harmonic','triad-union'].includes(v.mode))fail('保存形式が不正です');
 const h=v.harmonic;if(!obj(h)||!int(h.N,5,120)||!int(h.H,2,128)||typeof h.base!=='number'||!Number.isFinite(h.base)||h.base<20||h.base>2000||!name(h.name,12))fail('倍音モードの設定が不正です');
 const triad=validateConfig(v.triad);return {schemaVersion:1,mode:v.mode,harmonic:{N:h.N,H:h.H,base:h.base,name:h.name},triad};
}
export function decodeWorkspace(text:string){if(text.length>1000000)fail('ファイルが大きすぎます');return validateWorkspace(JSON.parse(text));}

// One seed shape, translated to three independently positioned roots.
export function shareSeedShape(c:Config):Config {const seed=c.chords.find(ch=>ch.id==='A')!;return {...c,chords:c.chords.map(ch=>copyShape(seed,ch))};}
export function sharedWorkspace(w:Workspace):Workspace{return {...w,triad:shareSeedShape(w.triad)};}
export function registerSeedDraft(d:Draft,c:Config):Config{return shareSeedShape(registerDraft({...d,id:'A'},c));}
