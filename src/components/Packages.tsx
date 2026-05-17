"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";
import { initiatePayfastCheckout } from "@/lib/payfast";

const packages = [
  {
    name: "Origin",
    price: 30000,
    priceLabel: "R 30,000",
    installment: "R 10,000pm x 3",
    features: [
      "Typesetting and layout",
      "Cover design (2 concepts)",
      "ISBN + Barcode + legal deposit",
      "Print setup + global distribution",
      "30-minute strategy call",
      "Digital assets",
      "Press release"
    ],
    forYou: [
      "I don't know where to start.",
      "I need a professional book that doesn't look self-published."
    ],
    color: "bg-white",
    textColor: "text-twBlue"
  },
  {
    name: "Elevate",
    price: 210000,
    priceLabel: "R 210,000",
    installment: "R 17,500pm x 12",
    features: [
      "Everything in ORIGIN",
      "Manuscript development (5 sessions)",
      "Story structure and messaging clarity",
      "Editing and proofreading",
      "Author brand starter kit",
      "Exclusive Books distribution",
      "100 paperback copies",
      "12 months support"
    ],
    forYou: [
      "I want to position myself.",
      "I want to publish with confidence and clarity.",
      "I need a proper launch."
    ],
    color: "bg-babyBlue",
    textColor: "text-white"
  },
  {
    name: "Authority",
    price: 351000,
    priceLabel: "R 351,000",
    installment: "R 29,250pm x 12",
    features: [
      "Everything in ORIGIN and ELEVATE",
      "Full ghostwriting OR hybrid writing",
      "Full author brand development",
      "Photoshoot & Website (3–5 pages)",
      "6 weeks post-launch content",
      "National Radio Ads & Social Media Management",
      "Video trailer for the book",
      "12 months support"
    ],
    forYou: [
      "I don't have time to write.",
      "I want a book that positions me as an authority.",
      "I want a business-return on the book."
    ],
    color: "bg-twBlue",
    textColor: "text-white"
  },
  {
    name: "Empire",
    price: 750000,
    priceLabel: "R 750,000",
    installment: "R 62,500pm x 12",
    features: [
      "Everything in ORIGIN, ELEVATE and AUTHORITY",
      "Course/Challenge portal build",
      "Digital workbook + slides",
      "Lead magnet + email funnel",
      "Keynote speaking deck",
      "Global media features pitches",
      "24 months support"
    ],
    forYou: [
      "I need my book to MAKE MONEY.",
      "I want to be a speaker, coach or authority figure.",
      "I want a business built from my book."
    ],
    color: "bg-black",
    textColor: "text-white"
  },
  {
    name: "Book Launch",
    price: 25000,
    priceLabel: "R 25,000",
    installment: "R 12,500pm x 2",
    features: [
      "Exclusive Books distribution",
      "Welcome drinks & Tapas",
      "Stage and PA system",
      "Photography & videography",
      "Press release service",
      "Social media advertising"
    ],
    forYou: [
      "I need a proper launch."
    ],
    color: "bg-gray-100",
    textColor: "text-twBlue"
  }
];

export default function Packages() {
  const [isMounted, setIsMounted] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"]
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#ffffff", "#B2E2F2", "#ffffff"]
  );

  const handlePayment = async (pkg: any) => {
    await initiatePayfastCheckout({
      amount: pkg.price,
      itemName: `TW Publishers - ${pkg.name} Package`,
      developerPercentage: 10, // Your 10% commission
    });
  };

  return (
    <motion.div 
      id="packages"
      ref={container}
      style={{ backgroundColor }}
      className="py-32 px-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <h2 className="text-7xl font-bold text-twBlue uppercase leading-none mb-4">
            Publishing <br /> <span className="text-babyBlue">Packages</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`${pkg.color} ${pkg.textColor} p-12 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col`}
            >
              <div className="mb-10">
                <h3 className="text-4xl font-bold uppercase mb-2">{pkg.name}</h3>
                <div className="h-1 w-12 bg-current opacity-30 mb-6" />
                <p className="text-3xl font-bold mb-1">{pkg.priceLabel}</p>
                <p className="text-sm opacity-70 uppercase tracking-widest">or {pkg.installment}</p>
              </div>

              <ul className="space-y-4 mb-12 flex-grow">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium">
                    <Check size={16} className="shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-8 border-t border-current/10">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-4 opacity-70">For you if:</p>
                <ul className="space-y-2 mb-8">
                  {pkg.forYou.map((item, i) => (
                    <li key={i} className="text-sm italic opacity-80">"{item}"</li>
                  ))}
                </ul>
                <button 
                  onClick={() => handlePayment(pkg)}
                  className={`w-full py-4 rounded-full border-2 border-current font-bold uppercase tracking-widest text-xs hover:bg-current hover:text-inherit transition-colors`}
                >
                  Book Consultation
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-32 p-16 bg-babyBlue-light rounded-[4rem] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
            <div>
              <h3 className="text-5xl font-bold text-twBlue uppercase mb-4">Add Ons</h3>
              <p className="text-twBlue/60 uppercase tracking-widest text-sm font-bold">"I don't need all the bells and whistles"</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full md:w-auto">
              {[
                { name: "Typesetting & Layout", price: 10000 },
                { name: "Cover Design & Mockups", price: 8000 },
                { name: "Press Release Service", price: 5000 },
                { name: "1hr Expert Consultation", price: 10000 }
              ].map((addon, i) => (
                <button 
                  key={i} 
                  onClick={() => handlePayment({ name: addon.name, price: addon.price })}
                  className="bg-white p-6 rounded-2xl flex items-center justify-between gap-4 text-twBlue font-bold text-sm hover:scale-105 transition-transform text-left"
                >
                  <div className="flex items-center gap-4">
                    <Plus size={18} className="text-babyBlue" />
                    {addon.name}
                  </div>
                  <span>R {isMounted ? addon.price.toLocaleString("en-US") : addon.price.toString()}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-babyBlue rounded-full blur-[120px] -mr-32 -mt-32 opacity-50" />
        </div>
      </div>
    </motion.div>
  );
}
