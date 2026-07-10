"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Determine initially whether the device is desktop or touch-based
    const hasTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsVisible(!hasTouch);

    const mouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const touchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setIsVisible(true);
      }
    };

    const touchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setIsVisible(true);
      }
    };

    const touchEnd = () => {
      // Vanish the circle smoothly when the finger leaves the viewport
      setIsVisible(false);
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("touchend", touchEnd, { passive: true });
    window.addEventListener("touchcancel", touchEnd, { passive: true });

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
      window.removeEventListener("touchcancel", touchEnd);
    };
  }, []);

  const variants = {
    default: {
      x: position.x - 16,
      y: position.y - 16,
      opacity: isVisible ? 1 : 0,
      scale: isVisible ? 1 : 0,
      backgroundColor: "#B2E2F2",
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] opacity-70"
      variants={variants}
      animate="default"
      transition={{ type: "smooth", stiffness: 500, damping: 28, mass: 0.5 }}
    />
  );
}
