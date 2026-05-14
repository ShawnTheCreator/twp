"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function FloatingEye() {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !outerRef.current || !innerRef.current) return;

      const { clientX, clientY } = e;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      const distance = Math.min(
        Math.hypot(clientX - centerX, clientY - centerY) / 10,
        20
      );

      const moveX = Math.cos(angle) * distance;
      const moveY = Math.sin(angle) * distance;

      gsap.to(outerRef.current, {
        x: moveX * 2,
        y: moveY * 2,
        duration: 0.6,
        ease: "power2.out",
      });

      gsap.to(innerRef.current, {
        x: moveX * 4,
        y: moveY * 4,
        duration: 0.4,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="relative w-40 h-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-twBlue/5 rounded-full blur-xl animate-pulse" />
      <div className="w-32 h-32 bg-white rounded-full border-2 border-twBlue/10 shadow-inner flex items-center justify-center overflow-hidden">
        <div ref={outerRef} className="w-16 h-16 bg-twBlue rounded-full flex items-center justify-center">
          <div ref={innerRef} className="w-6 h-6 bg-babyBlue rounded-full" />
        </div>
      </div>
      <div className="absolute -top-4 -right-4 w-12 h-12 bg-babyBlue rounded-full mix-blend-multiply opacity-50 blur-lg" />
    </div>
  );
}
