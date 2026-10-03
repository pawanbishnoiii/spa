"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const cards = [
  [
    "/images/spa-aroma-new.jpg",
    "Adult woman enjoying an aromatherapy ritual",
    "Make room for calm",
  ],
  [
    "/images/spa-facial-new.jpg",
    "Smiling adult woman enjoying facial care",
    "A ritual just for you",
  ],
  [
    "/images/spa-pool-new.jpg",
    "Adult woman taking a peaceful spa break",
    "A fresh perspective",
  ],
  [
    "/images/real-smile.jpg",
    "Smiling adult woman with a towel wrap",
    "Leave with a smile",
  ],
];

export default function SpaPhotoStory() {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let context: { revert: () => void } | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let refreshFrame = 0;
    let alive = true;
    (async () => {
      if (
        matchMedia("(min-width:681px), (prefers-reduced-motion:reduce)").matches
      )
        return;
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (
        !alive ||
        !section.current ||
        !pin.current ||
        !viewport.current ||
        !track.current
      )
        return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const distance = () =>
          Math.max(
            0,
            track.current!.scrollWidth - viewport.current!.clientWidth,
          );
        gsap.set(track.current, { x: 0 });
        gsap.set(".spa-story-progress i", { scaleX: 0.06 });
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance() + window.innerHeight * 0.85}`,
            pin: pin.current,
            pinSpacing: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        timeline
          .to(track.current, { x: () => -distance(), ease: "none" }, 0)
          .to(".spa-story-progress i", { scaleX: 1, ease: "none" }, 0)
          .fromTo(
            ".spa-photo-strip figure",
            { scale: 0.96, rotate: -0.5 },
            { scale: 1, rotate: 0, stagger: 0.18, ease: "none" },
            0,
          );

        const refresh = () => {
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        };
        resizeObserver = new ResizeObserver(refresh);
        resizeObserver.observe(viewport.current!);
        resizeObserver.observe(track.current!);
        Promise.all(
          Array.from(track.current!.querySelectorAll("img")).map((image) =>
            image.decode?.().catch(() => undefined),
          ),
        ).finally(refresh);
      }, section.current);
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(refreshFrame);
      resizeObserver?.disconnect();
      context?.revert();
    };
  }, []);

  return (
    <section ref={section} className="spa-photo-story section">
      <div ref={pin} className="spa-story-pin">
        <div className="section-head">
          <span className="kicker">SLOW DOWN · FEEL GOOD</span>
          <h2>Your kind of reset.</h2>
          <p>Keep scrolling. The story moves with you.</p>
        </div>
        <div ref={viewport} className="spa-story-viewport">
          <div ref={track} className="spa-photo-strip">
            {cards.map(([src, alt, caption], index) => (
              <figure key={src}>
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(max-width:680px) 78vw,25vw"
                />
                <span>0{index + 1}</span>
                <figcaption>{caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="spa-story-progress" aria-hidden="true">
          <i />
        </div>
        <small className="photo-story-note">
          Real stock spa photography · illustrative models, not staff portraits.
        </small>
      </div>
    </section>
  );
}
