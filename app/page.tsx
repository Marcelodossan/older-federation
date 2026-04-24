"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      try {
        const supabase = createClient();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isActive) return;

        if (error) {
          console.error("Error fetching session:", error);
          router.replace("/login");
          return;
        }

        if (session?.user) {
          router.replace("/dashboard");
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        router.replace("/login");
      }
    }

    checkSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      Loading...
    </main>
  );
}