"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LottieLight } from "lottie-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AnalyticsTracker from "@/components/analytics-tracker";
import LeadDialog from "@/components/lead-dialog";
import { RitualIcon } from "@/components/ritual-icons";
import { business, services, therapists } from "@/lib/spa-config";

const content = {
  nav: ["Treatments", "Therapists", "First visit", "About"],
  paths: ["services", "therapists", "first-visit", "about"],
  eyebrow: "Professional wellness · thoughtfully personal",
  title: "A quieter kind of luxury.",
  intro: "Unhurried massage rituals, transparent pricing and respectful professional care—designed around how you want to feel.",
  telegram: "Chat on Telegram",
  illustrative: "Illustrative ambience · replace with real venue photography when available",
  find: "Find your moment",
  findSub: "Choose the time you have. We’ll show rituals that fit, then continue privately on Telegram.",
  minutes: "minutes",
  styles: ["All", "Gentle relaxation", "Firmer pressure", "Aromatic oils"],
  fee: "Registration",
  first: "Your first visit, without guesswork",
  team: "Professional care, humanly delivered",
  gallery: "Inside the quiet",
  faq: "Good to know",
} as const;

type Runtime = {
  settings: Record<string, string>;
  therapists: Array<Record<string, string | number | null>>;
};

function telegramHref(value: string) {
  const clean = value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, "")
    .replace(/^(?:t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return `https://t.me/${clean || "[TELEGRAM_USERNAME]"}`;
}

function TelegramLink({
  href,
  label,
  className = "btn btn-telegram",
  service,
}: {
  href: string;
  label: string;
  className?: string;
  service?: string;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
      data-track="telegram_click"
      data-service={service}
      data-button={className.includes("hero-now")?"hero_chat_now":className.includes("hero")?"hero_telegram":className.includes("floating")?"floating_telegram":service?`service_${service}`:className.replaceAll(" ","_")}
      onClick={(event)=>{event.preventDefault();window.dispatchEvent(new CustomEvent("open-spa-lead",{detail:{href,label,service:service||"calm",buttonId:event.currentTarget.dataset.button}}))}}
      aria-label={`${label} — opens Telegram in a new tab`}
    >
      <MessageCircle />
      <span>{label}</span>
      <ArrowUpRight className="telegram-arrow" />
    </a>
  );
}

export default function SpaExperience({ route }: { route: string }) {
  const [duration, setDuration] = useState(60);
  const [style, setStyle] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [runtime, setRuntime] = useState<Runtime>({ settings: {}, therapists: [] });
  const [lead,setLead]=useState<{href:string;label:string;service:string;buttonId:string}|null>(null);
  const [floating,setFloating]=useState(false);
  useEffect(()=>{const open=(event:Event)=>setLead((event as CustomEvent).detail);window.addEventListener("open-spa-lead",open);const update=()=>{const hero=document.querySelector(".hero");const inHero=hero&&hero.getBoundingClientRect().bottom>100;const visible=[...document.querySelectorAll("[data-button]:not(.floating-telegram)")].some(el=>{const r=el.getBoundingClientRect();return r.height>0&&r.top<innerHeight&&r.bottom>0});setFloating(!inHero&&!visible)};window.addEventListener("scroll",update,{passive:true});update();return()=>{window.removeEventListener("open-spa-lead",open);window.removeEventListener("scroll",update)}},[]);

  useEffect(() => {
    fetch("/api/public-config")
      .then((response) => response.json())
      .then(setRuntime)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("in-view")),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".section,.gallery-band,.page-intro,.telegram-band").forEach((element) => {
      element.classList.add("scroll-reveal");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [route, reducedMotion]);

  const filtered = useMemo(
    () =>
      services.filter(
        (service) =>
          service.durations.some((item) => item.m === duration) &&
          (style === 0 || service.moodEn === content.styles[style]),
      ),
    [duration, style],
  );

  const to = (path: string) => `/en/${path}`;
  const siteName = (runtime.settings.site_name || business.name).slice(0, 80);
  const telegram = runtime.settings.telegram_username || business.telegram;
  const telegramUrl = telegramHref(telegram);
  const telegramLabel = (runtime.settings.telegram_cta_en || content.telegram).slice(0, 40);
  const knownRoute = ["home", "services", "therapists", "first-visit", "about", "contact", "privacy", "terms", "refund"].includes(route);

  return (
    <div className="site-shell">
      <AnalyticsTracker />
      <div className="scroll-progress" aria-hidden="true" />

      <header className="nav-wrap">
        <nav className="nav" aria-label="Primary navigation">
          <Link className="brand" href="/en">
            <span className="brand-mark"><Leaf /></span>
            <span><b>{siteName}</b><small>PRIVATE WELLNESS</small></span>
          </Link>
          <div className="nav-links">
            {content.nav.map((item, index) => (
              <Link key={item} className={route === content.paths[index] ? "active" : ""} href={to(content.paths[index])}>
                {item}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <Sheet>
              <SheetTrigger className="menu-btn" aria-label="Open navigation"><Menu /></SheetTrigger>
              <SheetContent className="mobile-sheet">
                <SheetHeader>
                  <SheetTitle>{siteName}</SheetTitle>
                  <SheetDescription>{content.eyebrow}</SheetDescription>
                </SheetHeader>
                <div className="mobile-links">
                  {content.nav.map((item, index) => <Link key={item} href={to(content.paths[index])}>{item}<ChevronRight /></Link>)}
                  <TelegramLink href={telegramUrl} label={telegramLabel} className="mobile-telegram" />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {(!knownRoute || route === "home") && (
        <Home
          duration={duration}
          setDuration={setDuration}
          style={style}
          setStyle={setStyle}
          filtered={filtered}
          runtime={runtime}
          telegramUrl={telegramUrl}
          telegramLabel={telegramLabel}
          reducedMotion={reducedMotion}
        />
      )}
      {route === "services" && (
        <Services
          duration={duration}
          setDuration={setDuration}
          style={style}
          setStyle={setStyle}
          filtered={filtered}
          runtime={runtime}
          telegramUrl={telegramUrl}
          telegramLabel={telegramLabel}
        />
      )}
      {route === "therapists" && <Therapists runtime={runtime} telegramUrl={telegramUrl} telegramLabel={telegramLabel} />}
      {route === "first-visit" && <FirstVisit runtime={runtime} telegramUrl={telegramUrl} telegramLabel={telegramLabel} />}
      {route === "about" && <About telegramUrl={telegramUrl} telegramLabel={telegramLabel} />}
      {route === "contact" && <TelegramContact runtime={runtime} telegramUrl={telegramUrl} telegramLabel={telegramLabel} />}
      {["privacy", "terms", "refund"].includes(route) && <Policy kind={route} />}
      {route === "privacy" && (
        <section className="policy-disclosure">
          <span>ANALYTICS & ADVERTISING</span>
          <h2>No advertising tracking without your choice.</h2>
          <p>With consent, we record page visits, time on site, traffic source and generic actions such as Telegram clicks. Raw IP addresses are never stored; a daily rotating hash is used. Meta Pixel and Google AdSense load only after “Allow all”.</p>
        </section>
      )}

      <Footer siteName={siteName} to={to} runtime={runtime} telegramUrl={telegramUrl} telegramLabel={telegramLabel} />
      {floating&&!lead&&<TelegramLink href={telegramUrl} label={telegramLabel} className="floating-telegram" />}
      {lead&&<LeadDialog lead={lead} close={()=>setLead(null)}/>}
    </div>
  );
}

function displayTherapists(runtime: Runtime) {
  return runtime.therapists?.length
    ? runtime.therapists
    : therapists.map((therapist, index) => ({
        id: therapist.id,
        name_en: therapist.name,
        speciality_en: therapist.en,
        imageUrl: index===0?"/images/real-aroma.jpg":"/images/real-deep.jpg",
      }));
}

function Home({
  duration,
  setDuration,
  style,
  setStyle,
  filtered,
  runtime,
  telegramUrl,
  telegramLabel,
  reducedMotion,
}: {
  duration: number;
  setDuration: (value: number) => void;
  style: number;
  setStyle: (value: number) => void;
  filtered: typeof services[number][];
  runtime: Runtime;
  telegramUrl: string;
  telegramLabel: string;
  reducedMotion: boolean;
}) {
  const team = displayTherapists(runtime);
  return (
    <main>
      <section className="hero">
        <Image src="/images/hero-spa.webp" alt="Serene green and copper spa interior" fill priority sizes="100vw" />
        <div className="hero-shade" />
        <div className="hero-orbit" aria-hidden="true"><LottieLight src="/breathe.json" autoplay={!reducedMotion} loop={!reducedMotion} /></div>
        <div className="hero-motes" aria-hidden="true"><i /><i /><i /></div>
        <div className="hero-copy reveal">
          <span className="eyebrow">{content.eyebrow}</span>
          <h1>{runtime.settings.hero_title||content.title}</h1>
          <p>{runtime.settings.hero_intro||content.intro}</p>
          <div className="hero-cta"><TelegramLink href={telegramUrl} label={telegramLabel} className="btn btn-telegram hero-telegram" /><TelegramLink href={telegramUrl} label="Chat now" className="btn hero-now" /></div>
          <div className="hero-trust">
            <span><ShieldCheck /> No user login. Personal assistance.</span>
            <span><Check /> Clear prices before you arrive.</span>
          </div>
        </div>
        <div className="hero-card" hidden>
          <RitualIcon kind="aroma" />
          <span>TAILORED TO YOUR PACE</span>
          <strong>30 · 60 · 90 minutes</strong>
          <small>Choose a ritual, then confirm availability directly on Telegram.</small>
        </div>
        <div className="scroll-cue">SCROLL <i /></div>
      </section>

      <MotionTicker />
      <Pricing runtime={runtime}/>
      <Explorer {...{ duration, setDuration, style, setStyle, filtered, runtime, telegramUrl, telegramLabel }} />

      <section className="experience-bento section">
        <article className="bento-title"><span className="kicker">A SMARTER SPA JOURNEY</span><h2>Calm experience. Sharp interface.</h2><p>A wellness journey that feels personal, transparent and effortless on every screen.</p></article>
        <article className="bento-lottie"><LottieLight src="/breathe.json" autoplay={!reducedMotion} loop={!reducedMotion} /><div><span>Breathe slower</span><strong>04 · 06</strong></div></article>
        <article className="bento-stat"><strong>1</strong><span>simple way to connect</span><small>Every primary action opens Telegram.</small></article>
        <article className="bento-path"><CalendarDays /><span>Your visit</span><div><i /> Discover <i /> Telegram <i /> Confirm</div></article>
      </section>

      <section className="editorial section">
        <div className="editorial-copy"><span className="kicker">01 · RITUAL</span><h2>Give the body pause. Give the mind room.</h2><p>Every treatment begins with a clear conversation about time, pressure and preference. No rush, no hidden terms.</p><TelegramLink href={telegramUrl} label="Discuss your ritual" className="text-link telegram-text-link" /></div>
        <div className="editorial-image"><Image src="/images/ritual-oils.webp" alt="Spa oils, linen and smooth stones" fill sizes="(max-width:800px) 100vw,50vw" /><span>{content.illustrative}</span></div>
      </section>

      <section className="dark-section section">
        <div className="section-head"><span className="kicker">02 · FIRST VISIT</span><h2>{content.first}</h2></div>
        <div className="steps">{[
          ["01", "Open Telegram", "Tap any blue button and start a private conversation."],
          ["02", "Confirm", "Share the ritual and time you prefer; staff confirms availability."],
          ["03", "Arrive", "Come at the confirmed time—no website account or online payment."],
        ].map((step) => <article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div>
        <div className="fee-strip"><div><small>{content.fee}</small><strong>{runtime.settings.registration_fee || business.registrationFee}</strong></div><p>Validity and refund terms are explained clearly before confirmation.</p><Check /></div>
      </section>

      <section className="section team">
        <div className="section-head"><span className="kicker">03 · PROFESSIONAL TEAM</span><h2>{content.team}</h2></div>
        <div className="team-grid">{team.map((therapist, index) => <article key={String(therapist.id)}><div className="portrait-photo"><Image src={String(therapist.imageUrl || (index===0?"/images/real-aroma.jpg":"/images/real-deep.jpg"))} alt="Professional therapist profile" fill sizes="(max-width:700px) 35vw,220px" /></div><div><h3>{String(therapist.name_en || "Therapist")}</h3><p>{String(therapist.speciality_en || "Professional massage care")}</p><small>Stock spa photograph · staff availability on request</small></div></article>)}</div>
      </section>

      <TelegramBand href={telegramUrl} label={telegramLabel} />

      <section className="gallery-band"><Image src="/images/spa-threshold.webp" alt="Serene spa treatment room" fill sizes="100vw" /><div><span className="kicker">04 · AMBIENCE</span><h2>{content.gallery}</h2><p>{content.illustrative}</p></div></section>
      <Faq />
    </main>
  );
}

function MotionTicker() {
  const phrase = ["PRIVATE WELLNESS", "TELEGRAM FIRST", "CLEAR PRICING", "PROFESSIONAL CARE"];
  return <div className="motion-ticker" aria-label="Private wellness, Telegram first, clear pricing, professional care"><div>{[...phrase, ...phrase].map((item, index) => <span key={`${item}-${index}`}><i />{item}</span>)}</div></div>;
}

function Pricing({runtime}:{runtime:Runtime}){const prices=[["hour_1","1 hour","₹1,700"],["hour_2","2 hours","₹2,000"],["hour_3","3 hours","₹3,000"],["hour_4","4 hours","₹4,000"],["full_day","Full day","₹5,000"],["full_night","Full night","₹5,000"]];return <section className="section pricing-section"><div className="section-head"><span className="kicker">YOUR TIME, CLEARLY PRICED</span><h2>Choose your pace.</h2><p>Gopalpura Mode, Jaipur, Rajasthan</p></div><div className="package-grid">{prices.map(([id,label,price])=><article key={id}><Clock3/><span>{label}</span><strong>{runtime.settings[`package_${id}`]||price}</strong></article>)}</div><p className="booking-price">Booking amount <strong>{runtime.settings.registration_fee||"₹199"}</strong> · Confirm availability with the team.</p></section>}

function Explorer({
  duration,
  setDuration,
  style,
  setStyle,
  filtered,
  runtime,
  telegramUrl,
  telegramLabel,
}: {
  duration: number;
  setDuration: (value: number) => void;
  style: number;
  setStyle: (value: number) => void;
  filtered: typeof services[number][];
  runtime: Runtime;
  telegramUrl: string;
  telegramLabel: string;
}) {
  return <section className="explorer section">
    <div className="section-head"><span className="kicker">CURATED FOR YOUR TIME</span><h2>{content.find}</h2><p>{content.findSub}</p></div>
    <div className="duration-tabs">{[30, 60, 90].map((value) => <button key={value} onClick={() => setDuration(value)} className={duration === value ? "selected" : ""} aria-pressed={duration === value}><b>{value}</b><span>{content.minutes}</span></button>)}</div>
    <div className="style-chips">{content.styles.map((item, index) => <button className={style === index ? "selected" : ""} key={item} onClick={() => setStyle(index)} aria-pressed={style === index}>{item}</button>)}</div>
    <div className="ritual-grid">{filtered.map((service) => <article className={`ritual-card ritual-${service.id}`} key={service.id}>
      <div className="ritual-photo"><Image src={runtime.settings[`image_${service.id}`]||service.image} alt={`Professional massage session — ${service.en}`} fill sizes="(max-width:680px) 92vw, (max-width:980px) 46vw, 30vw" /></div>
      <div className="ritual-content">
        <div className="ritual-top"><RitualIcon kind={service.id} /><span>{service.moodEn}</span><Clock3 /></div>
        <h3>{service.en}</h3><p>Pressure: {service.pressureEn}</p>
        <div className="price-line"><span>{duration} {content.minutes}</span><strong>{runtime.settings[`price_${service.id}_${duration}`] || (duration===60?"₹1,700":"Confirm on Telegram")}</strong></div>
        <TelegramLink href={telegramUrl} label={`${telegramLabel} about this ritual`} className="ritual-telegram" service={service.id} />
      </div>
    </article>)}</div>
  </section>;
}

function Services(props: Parameters<typeof Explorer>[0]) {
  return <main className="inner"><PageIntro eyebrow="TREATMENT MENU" title="Choose the kind of quiet you need." text="Filter by time, pressure and experience. Prices can be updated instantly from the admin dashboard." /><Explorer {...props} /><TelegramBand href={props.telegramUrl} label={props.telegramLabel} /></main>;
}

function Therapists({ runtime, telegramUrl, telegramLabel }: { runtime: Runtime; telegramUrl: string; telegramLabel: string }) {
  const team = displayTherapists(runtime);
  return <main className="inner"><PageIntro eyebrow="PROFESSIONAL TEAM" title="Skill comes first. Always." text="Profiles focus on experience, language and service specialities—and can be updated by the admin." /><section className="profile-list section">{team.map((therapist, index) => <article key={String(therapist.id)}><div className="profile-photo"><Image src={String(therapist.imageUrl || (index===0?"/images/real-aroma.jpg":"/images/real-deep.jpg"))} alt="Professional therapist profile" fill sizes="(max-width:700px) 100vw,420px" /></div><div><span className="kicker">THERAPIST PROFILE</span><h2>{String(therapist.name_en || "Therapist")}</h2><p>{String(therapist.speciality_en || "Professional massage care")}</p><dl><div><dt>Approach</dt><dd>Respectful, professional care</dd></div><div><dt>Availability</dt><dd>Confirm directly on Telegram</dd></div></dl><TelegramLink href={telegramUrl} label={telegramLabel} /></div></article>)}</section></main>;
}

function FirstVisit({ runtime, telegramUrl, telegramLabel }: { runtime: Runtime; telegramUrl: string; telegramLabel: string }) {
  const steps = [["Choose a service", "Review duration and live price."], ["Open Telegram", "Share a few details, then start a private chat."], ["Staff confirms", "Agree on real availability and registration."], ["Arrive and exhale", "Only a confirmed time is an appointment."]];
  return <main className="inner"><PageIntro eyebrow="FIRST VISIT" title="Clear from the start. Calm all the way through." /><section className="timeline section">{steps.map((item, index) => <article key={item[0]}><b>0{index + 1}</b><div><h2>{item[0]}</h2><p>{item[1]}</p></div></article>)}</section><section className="registration-panel"><span>REGISTRATION</span><h2>{runtime.settings.registration_fee || business.registrationFee}</h2><p>Validity, inclusions and refund eligibility are explained before your visit is confirmed.</p><TelegramLink href={telegramUrl} label={telegramLabel} /></section></main>;
}

function About({ telegramUrl, telegramLabel }: { telegramUrl: string; telegramLabel: string }) {
  return <main className="inner"><PageIntro eyebrow="ABOUT · HYGIENE" title="Wellness that feels calm—and stays clear." /><section className="about-grid section"><div className="about-image"><Image src="/images/spa-threshold.webp" alt="Serene spa ambience" fill sizes="(max-width:700px) 100vw,50vw" /></div><div><span className="kicker">OUR STANDARD</span><h2>Care before theatre.</h2><p>A considered, professional experience built around clarity, comfort and respectful communication.</p><ul>{["Fresh linen for every client", "Cleaning between treatments", "Respectful professional conduct"].map((item) => <li key={item}><Check />{item}</li>)}</ul><TelegramLink href={telegramUrl} label={telegramLabel} /></div></section></main>;
}

function TelegramContact({ runtime, telegramUrl, telegramLabel }: { runtime: Runtime; telegramUrl: string; telegramLabel: string }) {
  return <main className="inner telegram-contact"><PageIntro eyebrow="DIRECT CONTACT" title="One tap. A private conversation." text="Share your details, then speak with the team on Telegram." /><section className="telegram-contact-card section"><div className="telegram-contact-icon"><Send /></div><span>TELEGRAM-FIRST BOOKING</span><h2>Ready when you are.</h2><p>Share your preferred ritual, duration and time. The team will confirm availability before you travel.</p><TelegramLink href={telegramUrl} label={telegramLabel} className="btn btn-telegram telegram-contact-button" /><div className="contact-meta"><span><MapPin />{runtime.settings.address || business.address}, {business.city}</span><span><Clock3 />{runtime.settings.opening_hours || business.hours}</span></div></section></main>;
}

function TelegramBand({ href, label }: { href: string; label: string }) {
  return <section className="telegram-band"><div><span><Sparkles /> PRIVATE · DIRECT · SIMPLE</span><h2>Your next quiet moment starts with one message.</h2></div><TelegramLink href={href} label={label} className="telegram-band-button" /></section>;
}

function Policy({ kind }: { kind: string }) {
  const titles: Record<string, string> = { privacy: "Privacy Policy", terms: "Terms of Service", refund: "Cancellation & Refund" };
  return <main className="policy inner"><PageIntro eyebrow="POLICY" title={titles[kind]} /><article>{kind === "privacy" ? <><h2>What we collect</h2><p>The public website does not ask visitors to create an account. With consent, anonymous analytics may record page visits, session duration, traffic source and generic Telegram clicks.</p><h2>Use and retention</h2><p>Analytics uses a daily rotating visitor hash; raw IP addresses are not stored. Telegram conversations are handled under Telegram’s own policies.</p></> : kind === "terms" ? <><h2>Conversation, not a confirmed booking</h2><p>Opening Telegram or sending a message does not confirm an appointment. Staff confirms availability, pricing and registration separately.</p><h2>Professional conduct</h2><p>Respectful conduct is expected from the spa and every customer.</p></> : <><h2>Separate fees, clear terms</h2><p>Registration and service refund terms are explained before an appointment is confirmed. Ask the team on Telegram for the current cancellation window and no-show policy.</p></>}</article></main>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <section className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}<i /></section>;
}

function Faq() {
  const questions = [["Can I pay on the website?", "No. The public site has no payment or QR code."], ["Does a Telegram message confirm my appointment?", "No. Staff confirms actual availability and timing separately."], ["Do I need an account?", "No. Visitors browse freely and continue directly on Telegram."], ["Can I choose a therapist?", "You can share a preference on Telegram; it depends on availability."]];
  return <section className="faq section"><div className="section-head"><span className="kicker">FAQ</span><h2>{content.faq}</h2></div><Accordion type="single" collapsible>{questions.map((item, index) => <AccordionItem value={String(index)} key={item[0]}><AccordionTrigger>{item[0]}</AccordionTrigger><AccordionContent>{item[1]}</AccordionContent></AccordionItem>)}</Accordion></section>;
}

function Footer({ siteName, to, runtime, telegramUrl, telegramLabel }: { siteName: string; to: (path: string) => string; runtime: Runtime; telegramUrl: string; telegramLabel: string }) {
  return <footer><div className="footer-brand"><Leaf /><h2>{siteName}</h2><p>Quiet, transparent, professional wellness.</p><TelegramLink href={telegramUrl} label={telegramLabel} className="footer-telegram" /></div><div><b>Explore</b><Link href={to("services")}>Treatments</Link><Link href={to("therapists")}>Therapists</Link><Link href={to("first-visit")}>First visit</Link></div><div><b>Policies</b><Link href={to("privacy")}>Privacy</Link><Link href={to("terms")}>Terms</Link><Link href={to("refund")}>Cancellation & Refund</Link><button className="footer-cookie" onClick={() => window.dispatchEvent(new Event("open-cookie-preferences"))}>Cookie preferences</button></div><div><b>{runtime.settings.city||business.city}</b><span>{runtime.settings.address || business.address}</span><span>{runtime.settings.opening_hours || business.hours}</span></div><p className="footer-note">Direct Telegram booking · No visitor login · Admin-managed content and pricing.</p></footer>;
}
