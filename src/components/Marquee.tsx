"use client";
import { motion } from "framer-motion";

interface MarqueeProps {
  text: string;
  speed?: number;
  className?: string;
}

export default function Marquee({ text, speed = 20, className = "" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden whitespace-nowrap flex border-y border-twBlue/10 py-4 ${className}`}>
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        className="flex gap-20 pr-20"
      >
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-4xl md:text-8xl font-black uppercase text-twBlue/5 tracking-tighter">
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
