"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ClipPathRevealProps {
  children: React.ReactNode;
  className?: string;
}

export default function ClipPathReveal({ children, className = "" }: ClipPathRevealProps) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(() => {
    gsap.set(contentRef.current, {
      clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
    });

    gsap.to(contentRef.current, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1.5,
      ease: "power4.inOut",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      },
    });
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div ref={contentRef} className="w-full h-full">
        {children}
      </div>
    </div>
  );
}
