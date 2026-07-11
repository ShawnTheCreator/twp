"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ConsultationModal({ isOpen, onClose, title = "Book a Consultation" }: ConsultationModalProps) {
  const [formData, setFormData] = useState({ Name: "", Email: "", Phone: "", Message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const res = await fetch("http://localhost:5000/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Network response was not ok");
      
      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setFormData({ Name: "", Email: "", Phone: "", Message: "" });
      }, 3000);
    } catch (error) {
      console.error("Booking error:", error);
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-twBlue/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative"
            >
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              ✕
            </button>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-twBlue uppercase leading-none mb-6 break-words">
              {title.split(" ").map((word, i, arr) => (
                <span key={i} className={i === arr.length - 1 ? "text-babyBlue" : ""}>{word} </span>
              ))}
            </h2>

            {status === "success" ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h3>
                <p className="text-slate-500">We'll be in touch with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                    Failed to send request. Please ensure the backend is running or try again.
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Full Name</label>
                  <input required type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Email Address</label>
                  <input required type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Phone Number</label>
                  <input required type="tel" value={formData.Phone} onChange={e => setFormData({...formData, Phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">How can we help?</label>
                  <textarea required value={formData.Message} onChange={e => setFormData({...formData, Message: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all resize-none h-32" placeholder="Tell us about your project..." />
                </div>
                <button disabled={status === "loading"} type="submit" className="w-full bg-twBlue text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-twBlue/90 transition-colors disabled:opacity-70 flex justify-center">
                  {status === "loading" ? <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : "Submit Request"}
                </button>
              </form>
            )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
