"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

export default function PageLoader() {
  const [counter, setCounter] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsVisible(false), 500);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: "-100vh" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[10000] bg-twBlue flex flex-col items-center justify-center"
        >
          <div className="relative overflow-hidden">
            <motion.h1 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="text-[15vw] font-black text-white uppercase leading-none tracking-tighter"
            >
              {counter}%
            </motion.h1>
          </div>
          <div className="w-full max-w-md h-[1px] bg-white/20 mt-8 relative overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${counter}%` }}
              className="absolute inset-0 bg-babyBlue"
            />
          </div>
          <p className="text-babyBlue uppercase tracking-[0.5em] text-xs font-bold mt-8">
            TW Publishers &copy; 2026
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
