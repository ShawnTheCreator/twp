import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function FlipPublishing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [flipped1, setFlipped1] = useState(false);
  const [flipped2, setFlipped2] = useState(false);

  useGSAP(() => {
    if (!sectionRef.current) return;
    
    let mm = gsap.matchMedia();

    // Desktop
    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
        },
      });

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
    });

    // Mobile
    mm.add("(max-width: 767px)", () => {
      gsap.from(".flip-card", {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="h-auto py-24 md:py-0 md:h-screen bg-twBlue flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="flex flex-col md:flex-row gap-8 md:gap-12" style={{ perspective: "1000px" }}>
        {/* Hybrid Card */}
        <div 
          onClick={() => setFlipped1(!flipped1)}
          className={`flip-card w-[90vw] max-w-[360px] md:w-[400px] h-[500px] md:h-[550px] cursor-pointer ${flipped1 ? "is-flipped-mobile" : ""}`}
        >
          <div className="flip-card-inner relative w-full h-full transition-transform duration-700" style={{ transformStyle: "preserve-3d" }}>
            {/* Front */}
            <div className="absolute inset-0 bg-white rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
              <div className="w-20 h-20 bg-babyBlue rounded-full mb-8 flex items-center justify-center text-white text-3xl font-bold">H</div>
              <h3 className="text-4xl font-bold text-twBlue uppercase mb-4">Hybrid</h3>
              <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Collaborative Model</p>
              <div className="mt-8 md:mt-12 text-twBlue/40 text-sm italic">"Shared investment, shared success."</div>
              <div className="mt-4 md:hidden text-[10px] text-babyBlue uppercase font-bold tracking-widest">Tap to reveal info</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-babyBlue rounded-[3rem] p-8 md:p-12 flex flex-col" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <h3 className="text-3xl font-bold text-twBlue uppercase mb-6 md:mb-8">Hybrid Model</h3>
              <ul className="space-y-3 md:space-y-4">
                {[
                  "Manuscripts are vetted",
                  "Shared brand reputation",
                  "Shared Royalties",
                  "Global Distribution",
                  "Premium Positioning",
                  "Shared investment"
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
        <div 
          onClick={() => setFlipped2(!flipped2)}
          className={`flip-card w-[90vw] max-w-[360px] md:w-[400px] h-[500px] md:h-[550px] cursor-pointer ${flipped2 ? "is-flipped-mobile" : ""}`}
        >
          <div className="flip-card-inner relative w-full h-full transition-transform duration-700" style={{ transformStyle: "preserve-3d" }}>
            {/* Front */}
            <div className="absolute inset-0 bg-white rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
              <div className="w-20 h-20 bg-twBlue rounded-full mb-8 flex items-center justify-center text-white text-3xl font-bold">A</div>
              <h3 className="text-4xl font-bold text-twBlue uppercase mb-4">Assisted</h3>
              <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Full Control Model</p>
              <div className="mt-8 md:mt-12 text-twBlue/40 text-sm italic">"Your vision, our expertise."</div>
              <div className="mt-4 md:hidden text-[10px] text-twBlue uppercase font-bold tracking-widest">Tap to reveal info</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-white border-4 border-babyBlue rounded-[3rem] p-8 md:p-12 flex flex-col" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <h3 className="text-3xl font-bold text-twBlue uppercase mb-6 md:mb-8">Assisted Model</h3>
              <ul className="space-y-3 md:space-y-4">
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
