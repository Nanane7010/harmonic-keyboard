export class ManualInput {
 pending=new Map<string,{step:number}>();
 step(id:string){return this.pending.get(id)?.step;}
 cancel(id:string){this.pending.delete(id);}
 clear(){this.pending.clear();}
 async press(id:string,step:number,ready:boolean,start:()=>Promise<boolean>,play:()=>void){
  const ticket={step};this.pending.set(id,ticket);
  if(ready){play();return;}
  if(await start()&&this.pending.get(id)===ticket)play();
 }
}
