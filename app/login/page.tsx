"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

type PerfilUsuario = {
  id: string;
  nome?: string;
  nomeCompleto?: string;
  idOnline?: string;
  pais?: string;
  valor?: number;
  imagem?: string;
  email?: string;
  isAdmin?: boolean;
};

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error || !data.user) {
        console.error(error);
        alert("Incorrect email or password.");
        return;
      }

      const user = data.user;

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (perfilError) {
        console.error(perfilError);
      }

      const usuarioLogado: PerfilUsuario = {
        id: user.id,
        nome: perfil?.nome || user.user_metadata?.nome || "",
        nomeCompleto:
          perfil?.nomeCompleto || user.user_metadata?.nomeCompleto || "",
        idOnline: perfil?.idOnline || user.user_metadata?.idOnline || "",
        pais: perfil?.pais || user.user_metadata?.pais || "",
        valor: perfil?.valor || 0,
        imagem: perfil?.imagem || user.user_metadata?.imagem || "",
        email: user.email || "",
        isAdmin:
          String(user.email || "").toLowerCase().trim() ===
          ADMIN_EMAIL.toLowerCase(),
      };

      localStorage.setItem("jogadorLogado", JSON.stringify(usuarioLogado));
      localStorage.setItem("sessaoAtiva", "true");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("Login failed. Please try again.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={leftStyle}>
          <p style={eyebrowStyle}>EURO CUP PLATFORM</p>

          <h1 style={titleStyle}>
            Welcome to <br />
            <span style={highlightStyle}>Euro Cup</span>
          </h1>

          <p style={subtitleStyle}>
            Sign in to manage your team, join tournaments, and follow the rankings.
          </p>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ ...inputStyle, marginTop: 14 }}
          />

          <button
            onClick={handleLogin}
            style={{
              ...buttonStyle,
              opacity: carregando ? 0.7 : 1,
              cursor: carregando ? "not-allowed" : "pointer",
            }}
            disabled={carregando}
          >
            {carregando ? "Signing in..." : "Sign In"}
          </button>

          <Link href="/criar-conta" style={linkStyle}>
            Create account
          </Link>
        </div>

        <div style={rightStyle}>
          <div style={imageOverlayStyle} />
          <img src="/banner-login.png" alt="Euro Cup login banner" style={imageStyle} />
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,106,0,0.22), transparent 32%), linear-gradient(135deg, #050B2E 0%, #070812 50%, #12051f 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontFamily: "Arial, sans-serif",
  padding: 20,
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  maxWidth: 1050,
  width: "100%",
  minHeight: 560,
  background: "rgba(5, 11, 46, 0.92)",
  border: "1px solid rgba(245, 197, 66, 0.35)",
  borderRadius: 28,
  overflow: "hidden",
  boxShadow: "0 0 50px rgba(245, 197, 66, 0.18)",
};

const leftStyle: React.CSSProperties = {
  flex: 1,
  padding: 44,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#F5C542",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 2,
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  fontSize: 42,
  lineHeight: 1.1,
  marginBottom: 14,
  fontWeight: 900,
};

const highlightStyle: React.CSSProperties = {
  color: "#F5C542",
  textShadow: "0 0 24px rgba(245,197,66,0.45)",
};

const subtitleStyle: React.CSSProperties = {
  color: "#c7c9d9",
  marginBottom: 30,
  lineHeight: 1.6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 15,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.35)",
  color: "#ffffff",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 15,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #F5C542, #FF6A00)",
  color: "#050B2E",
  fontWeight: "bold",
};

const linkStyle: React.CSSProperties = {
  marginTop: 18,
  color: "#F5C542",
  textDecoration: "none",
  fontWeight: 800,
  textAlign: "center",
};

const rightStyle: React.CSSProperties = {
  flex: 1,
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
};

const imageOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(5,11,46,0.25), rgba(255,106,0,0.22))",
  zIndex: 1,
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};