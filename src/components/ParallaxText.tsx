"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function ParallaxText() {
  const container = useRef<HTMLDivElement>(null);
  const line1 = useRef<HTMLDivElement>(null);
  const line2 = useRef<HTMLDivElement>(null);
  const line3 = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current || !line1.current || !line2.current || !line3.current) return;
    gsap.to(line1.current, {
      xPercent: -20,
      scrollTrigger: {
        trigger: container.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(line2.current, {
      xPercent: 20,
      scrollTrigger: {
        trigger: container.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(line3.current, {
      xPercent: -20,
      scrollTrigger: {
        trigger: container.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  }, []);

  return (
    <section ref={container} className="py-40 bg-white overflow-hidden flex flex-col gap-4">
      <div ref={line1} className="whitespace-nowrap flex gap-8 items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-[12vw] font-black uppercase text-twBlue leading-none">
            Strategy • Innovation • <span className="text-babyBlue">Excellence</span> •
          </span>
        ))}
      </div>
      <div ref={line2} className="whitespace-nowrap flex gap-8 items-center -translate-x-1/2">
        {[...Array(5)].map((_, i) => (
          <span key={i} 
            className="text-[12vw] font-black uppercase text-transparent leading-none"
            style={{ WebkitTextStroke: "1px rgba(0, 71, 171, 0.2)" }}
          >
            Publishing • Global • <span style={{ WebkitTextStroke: "1px rgba(178, 226, 242, 0.2)" }}>Impact</span> •
          </span>
        ))}
      </div>
      <div ref={line3} className="whitespace-nowrap flex gap-8 items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-[12vw] font-black uppercase text-twBlue leading-none">
            Authors • Vision • <span className="text-babyBlue">Results</span> •
          </span>
        ))}
      </div>
    </section>
  );
}
