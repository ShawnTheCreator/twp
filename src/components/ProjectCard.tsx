"use client";
import { motion } from "framer-motion";

interface ProjectCardProps {
  title: string;
  category: string;
  image: string;
  color: string;
}

export default function ProjectCard({ title, category, image, color }: ProjectCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 0.98 }}
      className="group relative w-full aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100 cursor-pointer"
    >
      <div className={`absolute inset-0 ${color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
      
      <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase tracking-widest font-bold text-twBlue">{category}</span>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 -rotate-45 group-hover:rotate-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 15L15 5M15 5H8M15 5V12" stroke="#0047AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <div>
          <h3 className="text-4xl font-bold text-twBlue uppercase leading-none mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            {title}
          </h3>
          <div className="w-0 group-hover:w-full h-1 bg-babyBlue transition-all duration-700" />
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <span className="text-[15vw] font-black text-white/10 uppercase pointer-events-none">
            {title.split(' ')[0]}
          </span>
      </div>
    </motion.div>
  );
}
