"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Jogador = {
  idOnline: string;
  email: string;
  nome: string;
  sobrenome: string;
  dataNascimento: string;
  whatsapp: string;
  pais: string;
  idioma: string;
  foto?: string | null;
  valor?: number;
};

export default function EditarJogadorPage() {
  const [form, setForm] = useState<Jogador>({
    idOnline: "",
    email: "",
    nome: "",
    sobrenome: "",
    dataNascimento: "",
    whatsapp: "",
    pais: "Brasil",
    idioma: "Português",
    foto: null,
    valor: 0,
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const jogadores = JSON.parse(localStorage.getItem("jogadores") || "[]");
    if (jogadores.length > 0) {
      setForm(jogadores[0]);
      setFotoPreview(jogadores[0].foto || null);
    }
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();

    const jogadorAtualizado = {
      ...form,
      foto: fotoPreview,
      valor: 0,
    };

    localStorage.setItem("jogadores", JSON.stringify([jogadorAtualizado]));

    const usuarioLogado = localStorage.getItem("usuarioLogado");
    if (usuarioLogado) {
      const usuario = JSON.parse(usuarioLogado);
      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify({
          ...usuario,
          nome: jogadorAtualizado.nome || usuario.nome,
          foto: fotoPreview,
        })
      );
    }

    alert("Jogador atualizado com sucesso!");
  }

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
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/dashboard"
          style={{ color: "#ff4fd8", textDecoration: "none", fontSize: "14px" }}
        >
          ← Voltar para dashboard
        </Link>
      </div>

      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f1f1f",
            borderRadius: "18px",
            padding: "14px",
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr",
                gap: "18px",
                alignItems: "start",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "#111",
                  border: "1px solid #2a2a2a",
                  borderRadius: "10px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ff4fd8",
                  fontWeight: 700,
                }}
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Foto do jogador"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "Foto"
                )}
              </div>

              <div>
                <h1
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "32px",
                    color: "#ff4fd8",
                  }}
                >
                  Foto do jogador
                </h1>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFoto}
                  style={{ color: "white" }}
                />
              </div>
            </div>

            <h2
              style={{
                marginTop: "10px",
                marginBottom: "18px",
                fontSize: "22px",
                color: "#ffffff",
              }}
            >
              Dados Básicos
            </h2>

            <form onSubmit={handleSalvar}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "18px",
                }}
              >
                <Campo label="ID online" name="idOnline" value={form.idOnline} onChange={handleChange} />
                <Campo label="Data de Nascimento" name="dataNascimento" type="date" value={form.dataNascimento} onChange={handleChange} />
                <Campo label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} />
                <Campo label="Whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} />
                <Campo label="Nome" name="nome" value={form.nome} onChange={handleChange} />
                <SelectCampo
                  label="País"
                  name="pais"
                  value={form.pais}
                  onChange={handleChange}
                  options={["Brasil", "Argentina", "Portugal", "Espanha", "França"]}
                />
                <Campo label="Sobrenome" name="sobrenome" value={form.sobrenome} onChange={handleChange} />
                <SelectCampo
                  label="Idioma"
                  name="idioma"
                  value={form.idioma}
                  onChange={handleChange}
                  options={["Português", "English", "Español"]}
                />
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <button
                  type="submit"
                  style={{
                    background: "#ff4fd8",
                    color: "white",
                    border: "none",
                    borderRadius: "999px",
                    padding: "10px 18px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✓ Salvar
                </button>

                <Link href="/dashboard" style={{ color: "white", textDecoration: "none" }}>
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f1f1f",
            borderRadius: "18px",
            padding: "14px",
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <h2
              style={{
                margin: "0 0 18px 0",
                fontSize: "24px",
                color: "#ffffff",
              }}
            >
              Minha Equipe
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "18px",
                alignItems: "center",
                marginBottom: "26px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#111",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ff4fd8",
                  fontWeight: 700,
                }}
              >
                Foto
              </div>

              <div>
                <div
                  style={{
                    fontSize: "22px",
                    marginBottom: "8px",
                  }}
                >
                  Sem Equipe
                </div>

                <div style={{ color: "#d0d0d0" }}>
                  Gerenciar Propostas ✉️
                </div>
              </div>
            </div>

            <div style={{ fontSize: "18px", marginBottom: "18px" }}>
              Total Partidas - 0
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 40px",
                maxWidth: "650px",
                fontSize: "18px",
              }}
            >
              <div>Gols - 0</div>
              <div>Faltas - 0</div>
              <div>assistências - 0</div>
              <div>Cartão Vermelho - 0</div>
              <div>Desarmes - 0</div>
              <div>Cartão Amarelo - 0</div>
              <div>Defesas - 0</div>
              <div>Faltas Recebidas - 0</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Campo({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "#d5d5d5" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "999px",
          border: "1px solid #2b2b2b",
          background: "#111",
          color: "white",
          outline: "none",
        }}
      />
    </div>
  );
}

function SelectCampo({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  options: string[];
}) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "#d5d5d5" }}>
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "999px",
          border: "1px solid #2b2b2b",
          background: "#111",
          color: "white",
          outline: "none",
        }}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}