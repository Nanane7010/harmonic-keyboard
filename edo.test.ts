import assert from 'node:assert/strict';
import {EDOS,defaultConfig,defaultWorkspace,changeEdo,presetShape,presets,synthesize,draftFor,draftValid,registerSeedDraft,capturedSteps,validateWorkspace,validateConfig,clone,mod} from './triad.ts';
import {scale,frequency} from './scale.ts';import {keyboardGeometry,pitchX} from './geometry.ts';import {analyze} from './limit.ts';
for(const N of EDOS){
 const c=defaultConfig(N),w={...defaultWorkspace(),triad:c};assert.deepEqual(validateWorkspace(JSON.parse(JSON.stringify(w))),w);
 const s=synthesize(c);assert.equal(s.gaps.reduce((a,b)=>a+b,0),N);assert(s.steps.every(x=>x>=0&&x<N));
 for(const preset of presets){const steps=presetShape(preset.id,N);assert.equal(new Set(steps).size,3);for(let i=0;i<3;i++){const [p,q=1]=preset.ratios[i].split('/').map(Number);assert(Math.abs(steps[i]*1200/N-1200*Math.log2(p/q))<=600/N+1e-8);}}
 const d=draftFor(c.chords[0],c);d.steps=[d.steps[1]-N,d.steps[2],0];d.root=0;assert(draftValid(d));const registered=registerSeedDraft(d,c);assert.deepEqual(validateConfig(registered),registered);assert(registered.chords.every(ch=>ch.voicingOffsets.join(',')===d.steps.join(',')));
 assert(!draftValid({...d,steps:[0,N,1],root:0}));assert.deepEqual(capturedSteps([{step:0,source:'manual'},{step:N,source:'manual'},{step:1,source:'manual'},{step:N+1,source:'manual'}],N),[0,1]);
 for(const white of [s.steps,scale(N,16).white]){const gaps=white.map((v,i)=>(white[i+1]??white[0]+N)-v),g=keyboardGeometry(N,white,gaps,0,1);assert.equal(g.keys.length,2*N);assert.equal(new Set(g.keys.map(k=>k.step)).size,2*N);g.keys.forEach(k=>assert.equal(pitchX(k.step,g.keys),k.x));assert(g.keys.every(k=>Number.isFinite(k.x)&&Number.isFinite(k.y)));}
 assert.equal(frequency(200,N,N),400);const a=analyze(c.chords[0].intervals.map(s=>frequency(200,s,N)));assert.equal(a.nearestBands.length,10);
 for(const target of EDOS){const next=changeEdo(c,target);assert.deepEqual(next.chords[0].intervals,presetShape('major',target));assert.equal(next.edo,target);assert.deepEqual(validateConfig(next),next);}
 const bad=clone(w);bad.triad.chords[0].rootOffset=N;assert.throws(()=>validateWorkspace(bad));
}
const old:any=defaultWorkspace();old.schemaVersion=1;old.triad.schemaVersion=1;const migrated=validateWorkspace(old);assert.equal(migrated.schemaVersion,2);assert.equal(migrated.triad.schemaVersion,2);assert.deepEqual(migrated.triad.chords,old.triad.chords);assert.equal(old.schemaVersion,1);
old.triad.edo=12;assert.throws(()=>validateWorkspace(old));
const c=defaultConfig(),d={...draftFor(c.chords[0],c),steps:[0,1,18],root:0,dirty:true};const narrow=registerSeedDraft(d,c);const before=JSON.stringify(narrow);assert.throws(()=>changeEdo(narrow,12),/同じ段/);assert.equal(JSON.stringify(narrow),before);
const custom=registerSeedDraft({...d,steps:[-13,0,10]},c);const moved=changeEdo(custom,53);assert.deepEqual(moved.chords[0].voicingOffsets,[-22,0,17]);assert.equal(mod(-1,53),52);
console.log('PASS: six EDOs, 36 conversions, preset tuning, full keyboard maps, octave frequency, shared inverted drafts, capture, legacy migration, JSON bounds and collision rollback');
