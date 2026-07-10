"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function PublishingModels() {
  return (
    <section id="publishing" className="py-32 px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-8xl font-bold text-twBlue uppercase leading-none mb-6"
          >
            Which One <br /> <span className="text-babyBlue">Do You Want?</span>
          </motion.h2>
          <p className="text-xl text-gray-500 uppercase tracking-widest">Publishing Models</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Hybrid Publishing */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-babyBlue-light/30 p-12 rounded-[3rem] border border-babyBlue/20 flex flex-col h-full"
          >
            <h3 className="text-4xl font-bold text-twBlue uppercase mb-8">Hybrid Publishing</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              A collaborative publishing model where the author invests in the publishing process and retains more creative control—while benefiting from the professional expertise, distribution support, and credibility of a traditional publisher.
            </p>
            <div className="bg-white/80 p-8 rounded-3xl mb-10 italic text-gray-500 text-sm leading-relaxed">
              "Think of it like co-producing a music album: both the artist and the label bring something to the table. You invest financially, and TW Publishers invests expertise, project management, and reputation."
            </div>
            <ul className="space-y-4 mt-auto">
              {[
                "Manuscripts are vetted",
                "Shared brand and quality reputation",
                "Partial royalties for both",
                "Distribution often included",
                "Seen as more selective and prestigious"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-twBlue font-medium uppercase text-sm">
                  <div className="w-6 h-6 rounded-full bg-twBlue flex items-center justify-center text-white shrink-0">
                    <Check size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Assisted Publishing */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-twBlue/5 p-12 rounded-[3rem] border border-twBlue/10 flex flex-col h-full"
          >
            <h3 className="text-4xl font-bold text-twBlue uppercase mb-8">Assisted Publishing</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Perfect for authors who want to stay in full control of their message—while still producing a polished, professional book that commands respect. You own 100% of the rights and keep 100% of the royalties.
            </p>
            <div className="bg-twBlue/10 p-8 rounded-3xl mb-10 italic text-gray-500 text-sm leading-relaxed">
              "You’re the boss. You hire the publisher to help you publish your book professionally, but the final decisions rest with you. Industry-grade quality with your vision at the center."
            </div>
            <ul className="space-y-4 mt-auto">
              {[
                "You’re in full control",
                "You cover all costs",
                "No royalty sharing",
                "Ideal for authors who want support without a gatekeeper",
                "100% Rights & Royalties retained"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-twBlue font-medium uppercase text-sm">
                  <div className="w-6 h-6 rounded-full bg-babyBlue flex items-center justify-center text-white shrink-0">
                    <Check size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
