"use client";

import Link from "next/link";

export default function CampeonatosPage() {
  const cards = Array.from({ length: 15 });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/dashboard"
          style={{
            color: "#ff4fd8",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          ← Voltar para dashboard
        </Link>
      </div>

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid #1f1f1f",
          borderRadius: "18px",
          padding: "12px",
        }}
      >
        <div
          style={{
            background: "#050505",
            border: "1px solid #262626",
            borderRadius: "14px",
            padding: "18px 14px 22px 14px",
            minHeight: "500px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              marginBottom: "20px",
            }}
          >
            Lista de Campeonatos
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "20px",
            }}
          >
            {cards.map((_, i) => (
              <div
                key={i}
                style={{
                  height: "200px",
                  background: "#0b0b0b",
                  borderRadius: "6px",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}