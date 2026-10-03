import SpaExperience from "@/components/spa-experience";
import { redirect } from "next/navigation";

export default async function SpaPage({ params }: { params: Promise<{lang:string; slug?:string[]}> }) {
  const { lang, slug = [] } = await params;
  if (lang !== "en") redirect(`/en${slug.length ? `/${slug.join("/")}` : ""}`);
  return <SpaExperience route={slug[0] ?? "home"} />;
}
