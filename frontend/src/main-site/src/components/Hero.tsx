"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import SplitText from "./SplitText";
import FloatingEye from "./FloatingEye";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -2]);
  const skew = useTransform(scrollYProgress, [0, 0.5], [0, 10]);

  return (
    <div id="home" ref={container} className="h-[150vh] relative">
      <motion.section 
        style={{ scale, rotate }}
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-center bg-white overflow-hidden"
      >
        <div className="absolute top-10 right-10 md:top-20 md:right-20">
          <FloatingEye />
        </div>

        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-babyBlue rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-twBlue rounded-full blur-[100px]" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden select-none z-0">
          <span className="text-[12vw] md:text-[15vw] font-black uppercase text-gray-500 whitespace-nowrap">
            10 Trowel Awards
          </span>
        </div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <motion.div
            style={{ skewY: skew }}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          >
            <h1 className="hero-text text-twBlue mb-4 flex flex-wrap justify-center items-baseline">
              TW <span className="text-babyBlue ml-4">Publishers</span>
            </h1>
          </motion.div>
          
          <SplitText 
            text="Crafting the Future"
            className="text-xl uppercase tracking-[0.3em] text-gray-500 font-light justify-center"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
          className="absolute bottom-20 left-6 md:left-10 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border border-twBlue flex items-center justify-center animate-bounce">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M10 16L4 10M10 16L16 10" stroke="#0047AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs uppercase tracking-widest text-twBlue">Scroll to explore</span>
        </motion.div>

        <div className="hidden md:block absolute top-1/2 right-10 -translate-y-1/2 rotate-90 origin-right">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400">Award Winning Agency 2026</span>
        </div>
      </motion.section>
    </div>
  );
}
