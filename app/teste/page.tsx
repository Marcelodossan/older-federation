"use client";

import { createClient } from "@/lib/supabase/client";

export default function TestePage() {
  const supabase = createClient();

  async function salvar() {
    const { error } = await supabase.from("equipes").insert({
      nome: "Time Teste",
      imagem: "",
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
      return;
    }

    alert("SALVOU NO BANCO 🔥");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={salvar}
        style={{
          padding: "14px 22px",
          borderRadius: 10,
          border: "1px solid #333",
          background: "#111",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Salvar teste
      </button>
    </main>
  );
}