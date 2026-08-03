"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Set cookie for 30 days
      const date = new Date();
      date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
      document.cookie = `twp_ref=${ref}; expires=${date.toUTCString()}; path=/; Secure; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
