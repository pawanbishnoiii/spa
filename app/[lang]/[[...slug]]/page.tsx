import SpaExperience from "@/components/spa-experience";

export default async function SpaPage({ params }: { params: Promise<{lang:string; slug?:string[]}> }) {
  const { lang, slug = [] } = await params;
  return <SpaExperience lang={lang === "en" ? "en" : "hi"} route={slug[0] ?? "home"} />;
}
