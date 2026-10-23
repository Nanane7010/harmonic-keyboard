export type Settings={wave:string,volume:number,attack:number,decay:number,sustain:number,release:number,poly:number};
type Voice={id:string,nodes:OscillatorNode[],gain:GainNode,release:number};
export class Synth{
 ctx?:AudioContext;master?:GainNode;voices=new Map<string,Voice>();tails=new Set<Voice>();
 async start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.50;const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=10;this.master.connect(comp);comp.connect(this.ctx.destination);}await this.ctx.resume();}
 volume(v:number){if(this.ctx&&this.master)this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.025);}
 on(id:string,f:number,s:Settings){if(!this.ctx||this.ctx.state!=='running')return false;if(this.voices.size>=s.poly)return false;const c=this.ctx,t=c.currentTime,g=c.createGain();g.connect(this.master!);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+s.attack);g.gain.exponentialRampToValueAtTime(Math.max(.0001,.12*s.sustain),t+s.attack+s.decay);const nodes:OscillatorNode[]=[];
 const partials=s.wave==='piano'?[1,.42,.20,.10,.055,.025]:[1];partials.forEach((amp,i)=>{if(f*(i+1)>=c.sampleRate/2)return;const o=c.createOscillator(),v=c.createGain();o.type=s.wave==='sawtooth'?'sawtooth':'sine';o.frequency.value=f*(i+1);v.gain.setValueAtTime(amp,t);if(s.wave==='piano')v.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.5,8/(i+1)));o.connect(v);v.connect(g);o.onended=()=>{o.disconnect();v.disconnect();};o.start();nodes.push(o);});this.voices.set(id,{id,nodes,gain:g,release:s.release});return true;}
 off(id:string,fast=false){const v=this.voices.get(id);if(!v||!this.ctx)return;const t=this.ctx.currentTime,r=fast?.025:v.release;v.gain.gain.cancelAndHoldAtTime(t);v.gain.gain.linearRampToValueAtTime(0,t+r);v.nodes.forEach(o=>o.stop(t+r+.02));this.tails.add(v);setTimeout(()=>{v.gain.disconnect();this.tails.delete(v);},(r+.05)*1000);this.voices.delete(id);}
 silencePrefix(prefix:string){[...this.voices.keys()].filter(id=>id.startsWith(prefix)).forEach(id=>this.off(id,true));if(this.ctx){const t=this.ctx.currentTime;for(const v of this.tails)if(v.id.startsWith(prefix)){v.gain.gain.cancelAndHoldAtTime(t);v.gain.gain.linearRampToValueAtTime(0,t+.025);v.nodes.forEach(o=>{try{o.stop(t+.04);}catch{}});}}}
 all(){this.silencePrefix('');}
}
