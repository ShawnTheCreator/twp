"use client";
import { motion } from "framer-motion";
import ClipPathReveal from "./ClipPathReveal";

export default function About() {
  return (
    <section id="about" className="py-32 px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl uppercase tracking-[0.4em] font-bold text-babyBlue mb-8">Who we are</h2>
            <h3 className="text-5xl md:text-8xl font-bold text-twBlue uppercase leading-none mb-8 md:mb-12">
              About <br /> <span className="text-babyBlue">TW Publishers</span>
            </h3>
            <div className="space-y-8 text-xl text-gray-600 leading-relaxed">
              <p>
                At TW Publishers, we believe books are more than ink on paper—they’re tools for positioning, influence, and lasting impact.
              </p>
              <p>
                Founded in Johannesburg, South Africa but operating globally, TW Publishers was born from a simple truth: there are leaders, experts, and changemakers with powerful stories—but no clear path to publish them professionally.
              </p>
              <p>
                We offer assisted and hybrid publishing that’s high-touch, high-quality, and highly strategic. We walk with you from manuscript to market.
              </p>
            </div>
            <button className="mt-12 bg-twBlue text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-babyBlue transition-colors">
              Get in touch
            </button>
          </motion.div>

          <ClipPathReveal className="w-full">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 p-6 sm:p-12 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100"
            >
              <h4 className="text-4xl font-bold text-twBlue uppercase mb-10">Our founder's story</h4>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  TW Publishers was founded by <span className="font-bold text-twBlue">Webster Tsenase</span>, a publishing strategist and award-winning publisher who understands the power of a book to shift perception.
                </p>
                <p>
                  Years ago, Webster saw too many brilliant minds struggling to get their expertise out. Not because they lacked content, but because they lacked guidance and a partner who believed in their vision.
                </p>
                <p>
                  Webster currently serves as a board member in South Africa’s Creative and Cultural Industries sector, representing the books and publishing sector.
                </p>
                <div className="pt-8 border-t border-gray-200 mt-8">
                  <p className="text-twBlue font-bold italic">
                    "To help people turn their wisdom into a powerful platform."
                  </p>
                </div>
              </div>
            </motion.div>
          </ClipPathReveal>
        </div>
      </div>
    </section>
  );
}
