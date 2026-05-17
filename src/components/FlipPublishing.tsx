"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function FlipPublishing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 1,
      },
    });

    // Animate cards entry and flip
    tl.from(".flip-card", {
      y: 200,
      opacity: 0,
      stagger: 0.2,
      duration: 1,
    })
    .to(".flip-card-inner", {
      rotationY: 180,
      stagger: 0.5,
      duration: 2,
    });
  }, []);

  return (
    <section ref={sectionRef} className="h-screen bg-twBlue flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="flex gap-12" style={{ perspective: "1000px" }}>
        {/* Hybrid Card */}
        <div className="flip-card w-[400px] h-[550px]">
          <div className="flip-card-inner relative w-full h-full transition-transform duration-700" style={{ transformStyle: "preserve-3d" }}>
            {/* Front */}
            <div className="absolute inset-0 bg-white rounded-[3rem] p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
              <div className="w-20 h-20 bg-babyBlue rounded-full mb-8 flex items-center justify-center text-white text-3xl font-bold">H</div>
              <h3 className="text-4xl font-bold text-twBlue uppercase mb-4">Hybrid</h3>
              <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Collaborative Model</p>
              <div className="mt-12 text-twBlue/40 text-sm italic">"Shared investment, shared success."</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-babyBlue rounded-[3rem] p-12 flex flex-col" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <h3 className="text-3xl font-bold text-twBlue uppercase mb-8">Hybrid Model</h3>
              <ul className="space-y-4">
                {[
                  "Manuscripts are vetted",
                  "Shared brand reputation",
                  "Partial royalties",
                  "Global Distribution",
                  "Premium Positioning"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-twBlue text-sm font-bold uppercase">
                    <Check size={16} /> {item}
                  </li>
                ))}
              </ul>
              <button className="mt-auto w-full py-4 bg-twBlue text-white rounded-full font-bold uppercase tracking-widest text-xs">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Assisted Card */}
        <div className="flip-card w-[400px] h-[550px]">
          <div className="flip-card-inner relative w-full h-full transition-transform duration-700" style={{ transformStyle: "preserve-3d" }}>
            {/* Front */}
            <div className="absolute inset-0 bg-white rounded-[3rem] p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
              <div className="w-20 h-20 bg-twBlue rounded-full mb-8 flex items-center justify-center text-white text-3xl font-bold">A</div>
              <h3 className="text-4xl font-bold text-twBlue uppercase mb-4">Assisted</h3>
              <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Full Control Model</p>
              <div className="mt-12 text-twBlue/40 text-sm italic">"Your vision, our expertise."</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-white border-4 border-babyBlue rounded-[3rem] p-12 flex flex-col" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <h3 className="text-3xl font-bold text-twBlue uppercase mb-8">Assisted Model</h3>
              <ul className="space-y-4">
                {[
                  "100% Rights Retained",
                  "100% Royalties Kept",
                  "Full Creative Control",
                  "Professional Design",
                  "ISBN & Legal Deposit"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-twBlue text-sm font-bold uppercase">
                    <Check size={16} className="text-babyBlue" /> {item}
                  </li>
                ))}
              </ul>
              <button className="mt-auto w-full py-4 bg-babyBlue text-twBlue rounded-full font-bold uppercase tracking-widest text-xs">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
