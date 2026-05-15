"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How do I know which package is right for me?",
    answer: "Each package serves a different stage: Origin is for first-time authors wanting a simple, beautiful book. Elevate adds writing guidance. Authority builds professional credibility. Empire turns your book into a full business. We offer a free consultation to help you choose."
  },
  {
    question: "How long does the publishing process take?",
    answer: "Timelines vary by package and manuscript status, typically ranging from 3 to 12 months for high-quality production and strategic launch setup."
  },
  {
    question: "Do I retain the rights to my book?",
    answer: "Yes. In our assisted publishing model, you retain 100% of the rights and 100% of the royalties. In hybrid models, rights and royalties are shared as per the collaborative agreement."
  },
  {
    question: "Do you help authors with writing or only publishing?",
    answer: "We offer both. From manuscript development sessions in our Elevate package to full ghostwriting in our Authority and Empire packages."
  },
  {
    question: "Will you help me get media coverage?",
    answer: "Yes, our higher-tier packages include comprehensive media relations, radio ads, and social media management to ensure your book gets the attention it deserves."
  },
  {
    question: "What makes TW Publishers different?",
    answer: "We don't just print books; we build brands. Our strategic approach focuses on positioning you as an expert in your field, not just an author."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 px-10 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-6xl font-bold text-twBlue uppercase leading-none mb-6">FAQ</h2>
          <p className="text-gray-500 uppercase tracking-widest text-sm">Common questions about your journey</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-10 py-8 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-bold text-twBlue uppercase tracking-tight">{faq.question}</span>
                <div className="w-8 h-8 rounded-full bg-babyBlue-light flex items-center justify-center text-twBlue">
                  {openIndex === idx ? <Minus size={18} /> : <Plus size={18} />}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-10 pb-10 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs font-bold">Still have questions?</p>
          <button className="bg-twBlue text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-babyBlue transition-colors">
            Book a consultation call
          </button>
        </div>
      </div>
    </section>
  );
}
