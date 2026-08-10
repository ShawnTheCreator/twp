"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ConsultationModal({ isOpen, onClose, title = "Book a Consultation" }: ConsultationModalProps) {
  const [formData, setFormData] = useState({ Name: "", Email: "", Phone: "", Message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Stop listening if modal closes
      setIsListening(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice typing is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setFormData(prev => ({ ...prev, Message: finalTranscript }));
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Sanitize and Validate
    if (formData.Name.trim().length < 2) {
      setValidationError("Please enter a valid full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (!formData.Phone || !isValidPhoneNumber(formData.Phone)) {
      setValidationError("Please enter a valid phone number with country code.");
      return;
    }

    if (formData.Message.trim().length < 10) {
      setValidationError("Please provide a little more detail about how we can help.");
      return;
    }

    // 1. Instantly show success state (Optimistic UI - 0ms latency)
    setStatus("success");
    
    // 2. Automatically snap the modal shut after half a second
    setTimeout(() => {
      onClose();
      setStatus("idle");
      setFormData({ Name: "", Email: "", Phone: "", Message: "" });
    }, 500);

    // 3. Fire the API request silently in the background (Fire and Forget)
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      const referralCode = getCookie("twp_ref") || "";

      const API_BASE = "https://twp-pfrw.onrender.com";
      fetch(`${API_BASE}/api/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit", // We don't need cookies, sending explicitly
        body: JSON.stringify({ ...formData, Phone: formData.Phone, Subject: title, ReferralCode: referralCode })
      }).catch(err => console.error("Background booking error:", err));
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
            /* Override phone input default styles to match our design */
            .PhoneInputInput {
              border: none !important;
              outline: none !important;
              background: transparent !important;
              font-size: 1rem;
              padding-left: 0.5rem;
            }
            .PhoneInput {
              width: 100%;
              padding: 0.75rem 1rem;
              border-radius: 0.75rem;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              transition: all 0.2s;
            }
            .PhoneInput:focus-within {
              border-color: #1a4f8b;
              box-shadow: 0 0 0 1px #1a4f8b;
            }
            .mic-pulsating {
              animation: mic-pulse 1.5s infinite;
            }
            @keyframes mic-pulse {
              0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
          `}} />
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
              className="pointer-events-auto w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
            >
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              ✕
            </button>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-twBlue uppercase leading-none mb-6 break-words pr-8">
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
                {validationError && (
                  <div className="bg-orange-50 text-orange-600 p-3 rounded-lg text-sm font-medium border border-orange-100">
                    {validationError}
                  </div>
                )}
                {status === "error" && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                    Failed to send request. Please ensure the backend is running or try again.
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input required type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <PhoneInput
                    international
                    defaultCountry="ZA"
                    value={formData.Phone}
                    onChange={(value) => setFormData({...formData, Phone: value || ""})}
                    placeholder="+27 00 000 0000"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-500">How can we help? <span className="text-red-500">*</span></label>
                    <button 
                      type="button" 
                      onClick={toggleListening}
                      title={isListening ? "Stop listening" : "Type with your voice"}
                      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all ${isListening ? 'text-red-600 bg-red-100 mic-pulsating' : 'text-twBlue bg-blue-50 hover:bg-blue-100'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      {isListening ? "Listening..." : "Voice"}
                    </button>
                  </div>
                  <textarea required value={formData.Message} onChange={e => setFormData({...formData, Message: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-twBlue focus:ring-1 focus:ring-twBlue transition-all resize-none h-32" placeholder={isListening ? "Listening to your voice..." : "Tell us about your project..."} />
                </div>
                <button disabled={status === "loading" || isListening} type="submit" className="w-full bg-twBlue text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-twBlue/90 transition-colors disabled:opacity-70 flex justify-center mt-2">
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
