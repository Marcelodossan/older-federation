"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

export default function CriarContaPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleCriarConta() {
    if (!nome || !email || !senha || !confirmarSenha) {
      alert("Preencha todos os campos");
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem");
      return;
    }

    try {
      setCarregando(true);

      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
            idOnline: nome.trim(),
            isAdmin:
              email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase(),
          },
        },
      });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        alert("Conta criada. Verifique seu email para confirmar o cadastro.");
        window.location.href = "/login";
        return;
      }

      const novoUsuario = {
        id: user.id,
        nome: nome.trim(),
        nomeCompleto: nome.trim(),
        email: user.email || email.trim(),
        foto: null,
        idOnline: nome.trim(),
        posicao: "GOL",
        numero: "1",
        imagem: "",
        overall: 55,
        valor: 550000,
        pais: "Brasil",
        clubeAtualId: "",
        clubeAtualNome: "",
        criadoPor: user.id,
        isAdmin:
          String(user.email || "").toLowerCase().trim() ===
          ADMIN_EMAIL.toLowerCase(),
      };

      const { error: perfilError } = await supabase.from("usuarios").upsert(
        {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          nomeCompleto: novoUsuario.nomeCompleto,
          email: novoUsuario.email,
          foto: novoUsuario.foto,
          idOnline: novoUsuario.idOnline,
          posicao: novoUsuario.posicao,
          numero: novoUsuario.numero,
          imagem: novoUsuario.imagem,
          overall: novoUsuario.overall,
          valor: novoUsuario.valor,
          pais: novoUsuario.pais,
          clubeAtualId: novoUsuario.clubeAtualId,
          clubeAtualNome: novoUsuario.clubeAtualNome,
          criadoPor: novoUsuario.criadoPor,
          isAdmin: novoUsuario.isAdmin,
        },
        { onConflict: "id" }
      );

      if (perfilError) {
        console.error(perfilError);
        alert("Conta criada, mas houve erro ao salvar perfil no banco.");
        window.location.href = "/login";
        return;
      }

      localStorage.setItem("jogadorLogado", JSON.stringify(novoUsuario));
      localStorage.setItem("sessaoAtiva", "true");

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Erro ao criar conta");
    } finally {
      setCarregando(false);
    }
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

        <button
          onClick={handleCriarConta}
          style={{
            ...buttonStyle,
            opacity: carregando ? 0.7 : 1,
            cursor: carregando ? "not-allowed" : "pointer",
          }}
          disabled={carregando}
        >
          {carregando ? "Criando..." : "Criar conta"}
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
};