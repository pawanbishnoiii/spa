"use client";
import {useEffect,useRef} from "react";
import Image from "next/image";
const cards=[
 ["/images/spa-aroma-new.jpg","Adult woman enjoying an aromatherapy ritual","Make room for calm"],
 ["/images/spa-facial-new.jpg","Smiling adult woman enjoying facial care","A ritual just for you"],
 ["/images/spa-pool-new.jpg","Adult woman taking a peaceful spa break","A fresh perspective"],
 ["/images/real-smile.jpg","Smiling adult woman with a towel wrap","Leave with a smile"],
];
export default function SpaPhotoStory(){
 const section=useRef<HTMLElement>(null),track=useRef<HTMLDivElement>(null);
 useEffect(()=>{let context:{revert:()=>void}|undefined;let alive=true;(async()=>{if(matchMedia("(min-width:681px), (prefers-reduced-motion:reduce)").matches)return;const [{default:gsap},{ScrollTrigger}]=await Promise.all([import("gsap"),import("gsap/ScrollTrigger")]);if(!alive||!section.current||!track.current)return;gsap.registerPlugin(ScrollTrigger);context=gsap.context(()=>{const distance=()=>Math.max(0,track.current!.scrollWidth-innerWidth+24);const timeline=gsap.timeline({scrollTrigger:{trigger:section.current,start:"top top",end:()=>"+="+Math.max(innerHeight*1.5,distance()),pin:true,scrub:.65,invalidateOnRefresh:true,anticipatePin:1}});timeline.to(track.current,{x:()=>-distance(),ease:"none"},0).to(".spa-story-progress i",{scaleX:1,ease:"none"},0)},section.current)})();return()=>{alive=false;context?.revert()}},[]);
 return <section ref={section} className="spa-photo-story section"><div className="section-head"><span className="kicker">SLOW DOWN · FEEL GOOD</span><h2>Your kind of reset.</h2><p>Swipe through a brighter, calmer side of self-care.</p></div><div className="spa-story-viewport"><div ref={track} className="spa-photo-strip">{cards.map(([src,alt,caption],i)=><figure key={src}><Image src={src} alt={alt} fill sizes="(max-width:680px) 78vw,25vw"/><span>0{i+1}</span><figcaption>{caption}</figcaption></figure>)}</div></div><div className="spa-story-progress" aria-hidden="true"><i/></div><small className="photo-story-note">Real stock spa photography · illustrative models, not staff portraits.</small></section>
}
