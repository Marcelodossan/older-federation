"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
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
          window.location.href = "/login";
          return;
        }

        if (session?.user) {
          localStorage.setItem("sessaoAtiva", "true");
          window.location.href = "/dashboard";
          return;
        }

        localStorage.removeItem("sessaoAtiva");
        localStorage.removeItem("jogadorLogado");
        window.location.href = "/login";
      } catch (error) {
        console.error(error);
        window.location.href = "/login";
      }
    }

    verificarSessao();
  }, []);

  return null;
}