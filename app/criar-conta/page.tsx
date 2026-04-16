"use client";

import Link from "next/link";
import { useState } from "react";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

export default function CriarContaPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  function handleCriarConta() {
    if (!nome || !email || !senha || !confirmarSenha) {
      alert("Preencha todos os campos");
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem");
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");

    const jaExiste = usuarios.some(
      (u: any) =>
        String(u.email || "").toLowerCase().trim() ===
        email.toLowerCase().trim()
    );

    if (jaExiste) {
      alert("Já existe uma conta com esse email");
      return;
    }

    const novoUsuario = {
      id: crypto.randomUUID(),
      nome,
      email,
      senha,
      foto: null,
      idOnline: nome,
      posicao: "GOL",
      numero: "1",
      imagem: "",
      overall: 55,
      valor: 550000,
      clubeAtualId: "",
      clubeAtualNome: "",
      criadoPor: email,
      isAdmin:
        email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase(),
    };

    const novosUsuarios = [...usuarios, novoUsuario];

    localStorage.setItem("usuarios", JSON.stringify(novosUsuarios));
    localStorage.setItem("jogadorLogado", JSON.stringify(novoUsuario));
    localStorage.setItem("sessaoAtiva", "true");

    window.location.href = "/dashboard";
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
          width: "100%",
          maxWidth: 520,
          background: "#0b0b0b",
          border: "1px solid #1c1c1c",
          borderRadius: 24,
          padding: 36,
          boxShadow: "0 0 40px rgba(255,79,216,0.15)",
        }}
      >
        <h1 style={{ fontSize: 34, marginTop: 0, marginBottom: 10 }}>
          Criar <span style={{ color: "#ff4fd8" }}>conta</span>
        </h1>

        <p style={{ color: "#aaa", marginBottom: 24 }}>
          Cadastre seu email e senha para entrar na plataforma.
        </p>

        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={inputStyle}
        />

        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, marginTop: 14 }}
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ ...inputStyle, marginTop: 14 }}
        />

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          style={{ ...inputStyle, marginTop: 14 }}
        />

        <button onClick={handleCriarConta} style={buttonStyle}>
          Criar conta
        </button>

        <Link
          href="/login"
          style={{
            marginTop: 18,
            color: "#ff4fd8",
            textDecoration: "none",
            fontWeight: 700,
            textAlign: "center",
            display: "block",
          }}
        >
          Já tenho conta
        </Link>
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
  width: "100%",
  marginTop: 20,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "#ff4fd8",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};