import {analyze} from './limit';
self.onmessage=(event:MessageEvent<{id:number,frequencies:number[],tolerance:number,rootFrequency?:number}>)=>{const {id,frequencies,tolerance,rootFrequency}=event.data;self.postMessage({id,result:analyze(frequencies,tolerance,rootFrequency)});};
