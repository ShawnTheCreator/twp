"use client";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed top-0 left-0 w-full z-50 px-4 md:px-10 py-4 md:py-6 flex justify-between items-center text-twBlue mix-blend-multiply"
    >
      <div className="shrink-0 flex items-center">
        <img src="/logotwfront.png" alt="TWP" className="h-32 md:h-48 -my-10 md:-my-16" />
      </div>
      <div className="flex gap-2 sm:gap-4 md:gap-8 text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] font-bold overflow-x-auto no-scrollbar max-w-[85vw] pr-4 py-1">
        <a href="#home" className="hover:text-babyBlue transition-colors shrink-0">Home</a>
        <a href="#publishing" className="hover:text-babyBlue transition-colors shrink-0">Publishing</a>
        <a href="#about" className="hover:text-babyBlue transition-colors shrink-0">About</a>
        <a href="#authors" className="hover:text-babyBlue transition-colors shrink-0">Authors</a>
        <a href="#faq" className="hover:text-babyBlue transition-colors shrink-0">FAQ</a>
        <a href="#contact" className="hover:text-babyBlue transition-colors shrink-0">Contact</a>
      </div>
    </motion.nav>
  );
}
