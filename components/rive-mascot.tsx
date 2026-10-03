"use client";
import {useEffect,useRef} from "react";
export default function RiveMascot({pose=0,className=""}:{pose?:number;className?:string}){
 const canvas=useRef<HTMLCanvasElement>(null),wrap=useRef<HTMLDivElement>(null);
 useEffect(()=>{let instance:any,resize:ResizeObserver|undefined,alive=true;const view=new IntersectionObserver(async entries=>{if(!entries.some(e=>e.isIntersecting))return;view.disconnect();try{const {Rive,RuntimeLoader,Layout,Fit,Alignment}=await import("@rive-app/canvas");if(!alive||!canvas.current)return;RuntimeLoader.setWasmUrl("/animations/rive.wasm");instance=new Rive({src:"/animations/character-poses.riv",canvas:canvas.current,stateMachines:"State Machine 1",autoplay:!matchMedia("(prefers-reduced-motion:reduce)").matches,layout:new Layout({fit:Fit.Contain,alignment:Alignment.Center}),onLoad:()=>{instance.resizeDrawingSurfaceToCanvas();const input=instance.stateMachineInputs("State Machine 1")?.find((item:any)=>item.name==="numberProperty");if(input)input.value=pose}});resize=new ResizeObserver(()=>instance?.resizeDrawingSurfaceToCanvas());resize.observe(canvas.current)}catch{}},{rootMargin:"240px"});if(wrap.current)view.observe(wrap.current);return()=>{alive=false;view.disconnect();resize?.disconnect();instance?.cleanup()}},[pose]);
 return <div ref={wrap} className={"rive-mascot "+className} aria-hidden="true"><canvas ref={canvas}/></div>
}
