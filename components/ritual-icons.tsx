import { Droplets, Flame, Flower2 } from "lucide-react";

export function RitualIcon({kind}:{kind:"calm"|"deep"|"aroma"}){
  return <span className={`ritual-icon ${kind}`} aria-hidden="true">{kind==="calm"?<Droplets/>:kind==="deep"?<Flame/>:<Flower2/>}</span>
}
