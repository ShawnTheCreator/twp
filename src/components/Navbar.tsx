"use client";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed top-0 left-0 w-full z-50 px-10 py-6 flex justify-between items-center mix-blend-difference text-white"
    >
      <div className="text-2xl font-bold tracking-tighter uppercase">
        TWP
      </div>
      <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold">
        <a href="#home" className="hover:text-babyBlue transition-colors">Home</a>
        <a href="#publishing" className="hover:text-babyBlue transition-colors">Publishing</a>
        <a href="#about" className="hover:text-babyBlue transition-colors">About</a>
        <a href="#authors" className="hover:text-babyBlue transition-colors">Authors</a>
        <a href="#faq" className="hover:text-babyBlue transition-colors">FAQ</a>
        <a href="#contact" className="hover:text-babyBlue transition-colors">Contact</a>
      </div>
    </motion.nav>
  );
}
