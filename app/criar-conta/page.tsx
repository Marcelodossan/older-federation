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
        console.error("SignUp error:", error);
        alert(error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        alert("Account created. Please check your email to confirm.");
        window.location.href = "/login";
        return;
      }

      const newUser = {
        id: user.id,
        nome: cleanName,
        email: user.email || cleanEmail,
      };

      const { error: profileError } = await supabase.from("usuarios").upsert(
        {
          id: newUser.id,
          nome: newUser.nome,
          email: newUser.email,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile save error:", profileError);
        alert(`Account created, but failed to save profile: ${profileError.message}`);
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
      console.error("Unexpected error:", err);
      alert("Error creating account.");
    } finally {
      setLoading(false);
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
          Create <span style={{ color: "#ff4fd8" }}>account</span>
        </h1>

        <p style={{ color: "#aaa", marginBottom: 24 }}>
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
          I already have an account
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