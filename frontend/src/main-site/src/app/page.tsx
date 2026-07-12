"use client";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import FlipPublishing from "@/components/FlipPublishing";
import Packages from "@/components/Packages";
import About from "@/components/About";
import FAQ from "@/components/FAQ";
import HorizontalPortfolio from "@/components/HorizontalPortfolio";
import Marquee from "@/components/Marquee";
import MagneticButton from "@/components/MagneticButton";
import PageLoader from "@/components/PageLoader";
import ParallaxText from "@/components/ParallaxText";
import ConsultationModal from "@/components/ConsultationModal";
import { useEffect, useState } from "react";
import Lenis from "lenis";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Book a Consultation");

  const openModal = (title: string) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };
  useEffect(() => {
    // Smooth scrolling
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Track visitor via .NET Backend
    const trackVisitor = async () => {
      try {
        await fetch("http://localhost:5000/api/track/visitor", {
          method: "POST"
        });
      } catch (error) {
        console.error("Tracking failed - Is .NET backend running?", error);
      }
    };
    
    // Only track once per session to avoid spamming on hot reloads
    if (!sessionStorage.getItem("tw_tracked")) {
      trackVisitor();
      sessionStorage.setItem("tw_tracked", "true");
    }
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <PageLoader />
      <Navbar />
      <Hero />
      
      {/* African Excellence Awards Banner */}
      <div className="bg-twBlue py-4 border-y border-white/20 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-4 md:gap-8 text-white uppercase tracking-[0.2em] text-xs md:text-sm font-bold text-center">
          <span className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#B2E2F2" />
            </svg>
            Best publishing house of the year 2026
          </span>
          <span className="hidden md:inline text-white/50">•</span>
          <span className="text-babyBlue">by African Excellence Awards</span>
        </div>
      </div>
      
      <Marquee text="T W PUBLISHERS" speed={30} className="bg-white" />

      <section className="py-24 px-10 bg-twBlue text-white text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-bold uppercase mb-12 leading-none">
            Are you ready to be positioned as an expert in your field?
          </h2>
          <MagneticButton>
            <button onClick={() => openModal("Book a Consultation Call")} className="bg-babyBlue text-twBlue px-12 py-6 rounded-full text-xl font-bold uppercase tracking-widest hover:bg-white transition-colors duration-500 shadow-2xl">
              Book a consultation call
            </button>
          </MagneticButton>
        </div>
      </section>

      <FlipPublishing />
      
      <ParallaxText />

      <Packages onBookClick={openModal} />

      <About />

      <HorizontalPortfolio />

      <FAQ />

      <section id="contact" className="py-20 md:py-32 px-6 md:px-10 bg-babyBlue relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <h3 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white uppercase leading-none mb-10">
            Publish your <br /> <span className="text-twBlue">Expertise</span>
          </h3>
          <MagneticButton>
            <button onClick={() => openModal("Get in Touch")} className="bg-white text-twBlue px-10 py-5 rounded-full text-xl font-bold uppercase tracking-widest hover:bg-twBlue hover:text-white transition-colors duration-500 shadow-xl">
              Get in touch
            </button>
          </MagneticButton>
        </div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/20 rounded-full blur-[100px]" />
      </section>

      <footer className="bg-twBlue text-white py-24 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="space-y-8">
            <span className="text-4xl font-bold tracking-tighter">TWP</span>
            <p className="text-twBlue-light text-sm leading-relaxed max-w-xs uppercase tracking-widest">
              Award-winning publishing house bridging the gap for global experts.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-babyBlue">Visit Us</h4>
            <p className="text-sm opacity-80 leading-relaxed">
              134 River Road,<br />
              Johannesburg 1684,<br />
              South Africa
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-babyBlue">Contact</h4>
            <div className="text-sm space-y-2 opacity-80">
              <p>010 500 4326</p>
              <p>064 779 4326 (WhatsApp)</p>
              <p>hello@twpublishers.co.za</p>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-babyBlue">Legal</h4>
            <div className="text-sm space-y-2 opacity-80 uppercase tracking-widest text-[10px]">
              <a href="#" className="hover:text-babyBlue block">Legal Notice</a>
              <a href="#" className="hover:text-babyBlue block">Privacy Policy</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] opacity-50">
          <p>© 2026 T W Publishers. All rights reserved.</p>
          <p>Global Publishing & Brand Positioning</p>
        </div>
      </footer>
      
      <ConsultationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalTitle} 
      />
    </main>
  );
}
