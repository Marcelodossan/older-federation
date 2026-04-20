"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      try {
        const supabase = createClient();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!ativo) return;

        if (error) {
          console.error("Erro ao buscar sessão:", error);
          router.replace("/login");
          return;
        }

        if (session?.user) {
          router.replace("/dashboard");
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error("Erro inesperado ao verificar sessão:", error);
        router.replace("/login");
      }
    }

    verificarSessao();

    return () => {
      ativo = false;
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
      Carregando...
    </main>
  );
}