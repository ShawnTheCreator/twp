"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ProjectCard from "./ProjectCard";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  { title: "Modern Echoes", category: "Fiction", color: "bg-babyBlue", link: "https://www.prweb.com/releases/modern-echoes" },
  { title: "Digital Soul", category: "Technology", color: "bg-twBlue", link: "https://www.prnewswire.com/news-releases/digital-soul" },
  { title: "Blue Horizon", category: "Poetry", color: "bg-babyBlue", link: "https://www.businesswire.com/news/home/blue-horizon" },
  { title: "Urban Tales", category: "Photography", color: "bg-twBlue", link: "https://www.globenewswire.com/news-release/urban-tales" },
  { title: "Global Vision", category: "Business", color: "bg-babyBlue", link: "https://www.prweb.com/releases/global-vision" },
  { title: "Future Minds", category: "Innovation", color: "bg-twBlue", link: "https://www.prnewswire.com/news-releases/future-minds" }
];

export default function HorizontalPortfolio() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !triggerRef.current) return;

    let mm = gsap.matchMedia();

    // Desktop: Horizontal scroll pinning
    mm.add("(min-width: 768px)", () => {
      if (!sectionRef.current || !triggerRef.current) return;

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
    });

    // Mobile: Standard vertical scroll with clean fade-in
    mm.add("(max-width: 767px)", () => {
      gsap.from(".portfolio-card", {
        opacity: 0,
        y: 50,
        stagger: 0.2,
        duration: 1,
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top 80%",
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="authors" className="overflow-hidden bg-white">
      <div ref={triggerRef}>
        <div 
          ref={sectionRef} 
          className="min-h-screen md:h-screen flex flex-col md:flex-row items-center px-6 md:px-[10vw] py-24 md:py-0 gap-16 md:gap-[10vw] w-full md:w-fit"
        >
          <div className="w-full md:w-[40vw] shrink-0 text-center md:text-left">
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-bold text-twBlue uppercase leading-none mb-4 md:mb-8">
              Our <br /> <span className="text-babyBlue">Authors</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-500 uppercase tracking-tight max-w-xs mx-auto md:mx-0">
              Meticulously crafted works that drive results and impact.
            </p>
          </div>
          {projects.map((project, index) => (
            <div key={index} className="portfolio-card w-full sm:w-[80vw] md:w-[35vw] shrink-0">
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <ProjectCard title={project.title} category={project.category} color={project.color} image={`/project${index + 1}.jpg`} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
