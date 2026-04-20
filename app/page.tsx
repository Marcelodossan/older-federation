"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function verificarSessao() {
      try {
        const supabase = createClient();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(error);
          router.replace("/login");
          return;
        }

        if (session?.user) {
          router.replace("/dashboard");
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error(error);
        router.replace("/login");
      }
    }

    verificarSessao();
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
      Carregando...
    </main>
  );
}