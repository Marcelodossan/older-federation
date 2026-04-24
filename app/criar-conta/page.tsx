"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

export default function CreateAccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            nome: cleanName,
            idOnline: cleanName,
            isAdmin: cleanEmail === ADMIN_EMAIL.toLowerCase(),
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
        alert("Account created. Please check your email to confirm.");
        window.location.href = "/login";
        return;
      }

      const { error: profileError } = await supabase.from("usuarios").upsert(
        {
          id: user.id,
          nome: cleanName,
          email: user.email || cleanEmail,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error(profileError);
        alert("Account created, but failed to save profile.");
        window.location.href = "/login";
        return;
      }

      localStorage.setItem(
        "jogadorLogado",
        JSON.stringify({
          id: user.id,
          nome: cleanName,
          email: user.email || cleanEmail,
          isAdmin: cleanEmail === ADMIN_EMAIL.toLowerCase(),
        })
      );

      localStorage.setItem("sessaoAtiva", "true");

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Error creating account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>
          Create <span style={highlightStyle}>account</span>
        </h1>

        <p style={subtitleStyle}>
          Register your email and password to access the platform.
        </p>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, marginTop: 14 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginTop: 14 }}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ ...inputStyle, marginTop: 14 }}
        />

        <button
          onClick={handleCreateAccount}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <Link href="/login" style={linkStyle}>
          I already have an account
        </Link>
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
  width: "100%",
  maxWidth: 520,
  background: "rgba(5, 11, 46, 0.92)",
  border: "1px solid rgba(245, 197, 66, 0.35)",
  borderRadius: 24,
  padding: 36,
  boxShadow: "0 0 50px rgba(245, 197, 66, 0.18)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 34,
  marginBottom: 10,
  fontWeight: 900,
};

const highlightStyle: React.CSSProperties = {
  color: "#F5C542",
};

const subtitleStyle: React.CSSProperties = {
  color: "#c7c9d9",
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.35)",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 20,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #F5C542, #FF6A00)",
  color: "#050B2E",
  fontWeight: "bold",
};

const linkStyle: React.CSSProperties = {
  marginTop: 18,
  color: "#F5C542",
  textDecoration: "none",
  fontWeight: 700,
  textAlign: "center",
  display: "block",
};