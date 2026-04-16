"use client";

import Link from "next/link";

export default function MensagensClubePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "30px",
      }}
    >
      <Link href="/editar-clube" style={{ color: "#ff4fd8", textDecoration: "none" }}>
        ← Voltar para editar clube
      </Link>

      <h1 style={{ marginTop: "24px", color: "#ff4fd8" }}>
        Mensagens do clube
      </h1>

      <p style={{ color: "#cfcfcf" }}>
        Depois a gente detalha essa aba.
      </p>
    </main>
  );
}