"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ProjectCard from "./ProjectCard";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  { title: "Modern Echoes", category: "Fiction", color: "bg-babyBlue" },
  { title: "Digital Soul", category: "Technology", color: "bg-twBlue" },
  { title: "Blue Horizon", category: "Poetry", color: "bg-babyBlue" },
  { title: "Urban Tales", category: "Photography", color: "bg-twBlue" },
  { title: "Global Vision", category: "Business", color: "bg-babyBlue" },
];

export default function HorizontalPortfolio() {
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);

  useGSAP(() => {
    const totalWidth = sectionRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;
    
    const pin = gsap.to(
      sectionRef.current,
      {
        x: () => -(totalWidth - viewportWidth),
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: () => `+=${totalWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      }
    );
    return () => {
      pin.kill();
    };
  }, []);

  return (
    <section id="authors" className="overflow-hidden bg-white">
      <div ref={triggerRef}>
        <div ref={sectionRef} className="h-screen flex items-center px-[10vw] gap-[10vw] w-fit">
          <div className="w-[40vw] shrink-0">
            <h2 className="text-8xl font-bold text-twBlue uppercase leading-none mb-8">
              Our <br /> <span className="text-babyBlue">Authors</span>
            </h2>
            <p className="text-xl text-gray-500 uppercase tracking-tight max-w-xs">
              Meticulously crafted works that drive results and impact.
            </p>
          </div>
          {projects.map((project, index) => (
            <div key={index} className="w-[35vw] shrink-0">
              <ProjectCard {...project} image={`/project${index + 1}.jpg`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
