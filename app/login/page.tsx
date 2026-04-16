"use client";

import Link from "next/link";
import { useState } from "react";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin() {
    if (!email || !senha) {
      alert("Preencha email e senha");
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");

    const usuarioEncontrado = usuarios.find(
      (u: any) =>
        String(u.email || "").toLowerCase().trim() ===
          email.toLowerCase().trim() && String(u.senha || "") === senha
    );

    if (!usuarioEncontrado) {
      alert("Email ou senha incorretos");
      return;
    }

    const usuarioLogado = {
      ...usuarioEncontrado,
      isAdmin:
        String(usuarioEncontrado.email || "").toLowerCase().trim() ===
        ADMIN_EMAIL.toLowerCase(),
    };

    localStorage.setItem("jogadorLogado", JSON.stringify(usuarioLogado));
    localStorage.setItem("sessaoAtiva", "true");

    window.location.href = "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          maxWidth: 1000,
          width: "100%",
          background: "#0b0b0b",
          border: "1px solid #1c1c1c",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(255,79,216,0.15)",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1 style={{ fontSize: 36, marginBottom: 10 }}>
            Welcome to <br />
            <span style={{ color: "#ff4fd8" }}>Older Federation</span>
          </h1>

          <p style={{ color: "#aaa", marginBottom: 30 }}>
            Entre na sua conta para continuar.
          </p>

          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ ...inputStyle, marginTop: 14 }}
          />

          <button onClick={handleLogin} style={buttonStyle}>
            Entrar
          </button>

          <Link
            href="/criar-conta"
            style={{
              marginTop: 18,
              color: "#ff4fd8",
              textDecoration: "none",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Criar conta
          </Link>
        </div>

        <div
          style={{
            flex: 1,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/banner-login.png"
            alt="Banner"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #333",
  background: "#000",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "#ff4fd8",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};