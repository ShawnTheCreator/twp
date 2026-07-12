"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";

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
      "100 paperback copies (We become your first customer @R300 a copy)",
      "Event coordination and management",
      "12 months support"
    ],
    forYou: [
      "I want to position myself.",
      "I want to publish with confidence and clarity.",
      "I need a proper launch."
    ],
    color: "bg-babyBlue",
    textColor: "text-slate-900"
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
    badge: "Exclusive Books",
    price: 25000,
    priceLabel: "R 25,000",
    installment: "R 12,500pm x 2",
    features: [
      "Exclusive Books distribution | To participating stores",
      "Welcome drinks & Tapas",
      "Stage and PA system",
      "Photography & videography",
      "Social media advertising for 6 weeks",
      "Event management & coordination"
    ],
    forYou: [
      "I need a proper launch."
    ],
    color: "bg-gray-100",
    textColor: "text-twBlue"
  }
];

interface PackagesProps {
  onBookClick?: (title: string) => void;
}

export default function Packages({ onBookClick }: PackagesProps = {}) {
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

  const handleBooking = (pkg: any) => {
    if (onBookClick) {
      onBookClick(`Book ${pkg.name} Package`);
    }
  };

  return (
    <motion.div 
      id="packages"
      ref={container}
      style={{ backgroundColor }}
      className="py-32 px-4 md:px-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <h2 className="text-5xl md:text-7xl font-bold text-twBlue uppercase leading-none mb-4">
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
                {pkg.badge && (
                  <div className="inline-block bg-twBlue text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                    {pkg.badge}
                  </div>
                )}
                <h3 className="text-4xl font-bold uppercase mb-2">{pkg.name}</h3>
                <div className="h-1 w-12 bg-current opacity-30 mb-6" />
              </div>

              <ul className="space-y-4 mb-12 flex-grow">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium">
                    <Check size={16} className="shrink-0 mt-0.5" />
                    <span>
                      {feature.includes("|") ? (
                        <>
                          {feature.split("|")[0].trim()}
                          <span className="ml-2 inline-block bg-babyBlue text-twBlue text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {feature.split("|")[1].trim()}
                          </span>
                        </>
                      ) : feature}
                    </span>
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
                  onClick={() => handleBooking(pkg)}
                  className={`w-full py-4 rounded-full border-2 border-current font-bold uppercase tracking-widest text-xs hover:bg-current hover:text-inherit transition-colors`}
                >
                  Book Consultation
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-32 p-6 md:p-16 bg-babyBlue-light rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="text-4xl md:text-5xl font-bold text-twBlue uppercase mb-6">Experience a Launch</h3>
            <p className="text-twBlue/80 uppercase tracking-widest text-[10px] md:text-sm font-bold mb-10 max-w-2xl">
              Watch how we turn a book launch into an industry-defining moment.
            </p>
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black max-w-4xl mx-auto">
              <iframe 
                className="w-full h-full absolute inset-0"
                src="https://www.youtube.com/embed/xKrOIUDFSdA?autoplay=0&controls=1" 
                title="Book Launch Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-babyBlue rounded-full blur-[120px] -mr-32 -mt-32 opacity-50" />
        </div>
      </div>
    </motion.div>
  );
}
