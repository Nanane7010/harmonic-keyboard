export type KeyPosition={step:number,x:number,y:number,white:boolean};
export function keyboardGeometry(N:number,white:number[],gaps:number[],oct:number,zoom:number,octaves=2){
 const width=90*zoom,blackW=44*zoom,row=46*zoom,rows=Math.max(...gaps)-1,height=Math.max(280*zoom,rows*row+100*zoom),total=white.length*octaves*width+blackW/2+width*.35+4*zoom;
 const keys:KeyPosition[]=[];
 for(let o=0;o<octaves;o++)for(let i=0;i<white.length;i++){
  const start=(o*white.length+i)*width,step=(oct+o)*N+white[i];keys.push({step,x:start+width/2,y:0,white:true});
  for(let j=1;j<gaps[i];j++)keys.push({step:step+j,x:start+width+(j-1)*Math.min(5*zoom,width*.35/Math.max(1,gaps[i]-2)),y:(rows-j)*row+8*zoom,white:false});
 }
 return {width,blackW,row,rows,height,total,keys};
}
// Piecewise pitch projection onto actual key centres, not a fictitious uniform pixel axis.
export function pitchX(step:number,keys:KeyPosition[]){
 if(!keys.length)return 0;if(keys.length===1)return keys[0].x;
 let i=Math.floor(step-keys[0].step);i=Math.max(0,Math.min(keys.length-2,i));
 const a=keys[i],b=keys[i+1];return a.x+(step-a.step)/(b.step-a.step)*(b.x-a.x);
}
export const bandShape=(limit:number,x0:number,x1:number)=>{
 const t=limit===3?[24,24]:limit===5?[164,164]:limit===7?[47,103]:limit===11?[142,86]:[65,145];
 const [y0,y1]=t;
 return {y0,y1,path:limit===13?`M ${x0} ${y0} C ${x0+(x1-x0)*.55} ${y0}, ${x0+(x1-x0)*.45} ${y1}, ${x1} ${y1}`:`M ${x0} ${y0} L ${x1} ${y1}`};
};

// Keep real key x coordinates. Compress only the signed vertical cents cue so
// even remote candidates stay inside their family lane (not a linear cents axis).
export function deviationSegment(limit:number,rootFrequency:number,actualFrequency:number,ratio:number,error:number,N:number,base:number,keys:KeyPosition[]){
 const idealFrequency=rootFrequency*ratio;
 const idealX=pitchX(N*Math.log2(idealFrequency/base),keys);
 const actualX=pitchX(N*Math.log2(actualFrequency/base),keys);
 const idealY=bandShape(limit,0,idealX).y1;
 const actualY=idealY-18*Math.tanh(error/30);
 return {idealX,actualX,idealY,actualY,idealFrequency};
}
