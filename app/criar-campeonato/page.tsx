"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Campeonato = {
  id: string;
  titulo: string;
  imagem: string;
  numeroParticipantes: number;
  formato: "eliminatorias" | "pontos-corridos" | "pontos-corridos-eliminatorias";
  criadoPor: string;
  dataCriacao: string;
};

type JogadorLogado = {
  id: string;
  nome: string;
  email?: string;
  isAdmin?: boolean;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function gerarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizarTexto(texto?: string) {
  return String(texto || "").trim().toLowerCase();
}

function reduzirImagem(file: File, maxWidth = 700, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error("Imagem inválida."));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function tamanhoAproximadoEmMB(texto: string) {
  return new Blob([texto]).size / (1024 * 1024);
}

export default function CriarCampeonatoPage() {
  const [jogadorLogado, setJogadorLogado] = useState<JogadorLogado | null>(null);
  const [titulo, setTitulo] = useState("");
  const [imagem, setImagem] = useState("");
  const [numeroParticipantes, setNumeroParticipantes] = useState("");
  const [formato, setFormato] = useState<
    "eliminatorias" | "pontos-corridos" | "pontos-corridos-eliminatorias"
  >("eliminatorias");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const jogador = localStorage.getItem("jogadorLogado");

    if (!jogador) {
      window.location.href = "/login";
      return;
    }

    try {
      const jogadorParseado = JSON.parse(jogador) as JogadorLogado;
      setJogadorLogado(jogadorParseado);

      if (!jogadorParseado.isAdmin) {
        alert("Apenas o administrador pode criar campeonatos.");
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/login";
    }
  }, []);

  async function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imagemReduzida = await reduzirImagem(file, 700, 0.72);

      if (tamanhoAproximadoEmMB(imagemReduzida) > 0.9) {
        setMensagem("A imagem ainda ficou grande demais. Use uma imagem menor.");
        return;
      }

      setImagem(imagemReduzida);
      setMensagem("");
    } catch (error) {
      console.error(error);
      setMensagem("Não foi possível processar a imagem do campeonato.");
    }
  }

  function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const tituloFinal = titulo.trim();
    const participantesFinal = Number(numeroParticipantes) || 0;

    if (!jogadorLogado?.isAdmin) {
      setMensagem("Apenas o administrador pode criar campeonatos.");
      return;
    }

    if (!tituloFinal) {
      setMensagem("Informe o título do campeonato.");
      return;
    }

    if (participantesFinal < 2) {
      setMensagem("Informe pelo menos 2 participantes.");
      return;
    }

    const campeonatosSalvos = readJson<Campeonato[]>("campeonatos", []);

    const tituloDuplicado = campeonatosSalvos.some(
      (item) => normalizarTexto(item.titulo) === normalizarTexto(tituloFinal)
    );

    if (tituloDuplicado) {
      setMensagem("Já existe um campeonato com esse título.");
      return;
    }

    const novoCampeonato: Campeonato = {
      id: gerarId(),
      titulo: tituloFinal,
      imagem,
      numeroParticipantes: participantesFinal,
      formato,
      criadoPor: jogadorLogado.id || jogadorLogado.email || jogadorLogado.nome || "",
      dataCriacao: new Date().toISOString(),
    };

    try {
      const atualizados = [...campeonatosSalvos, novoCampeonato];
      localStorage.setItem("campeonatos", JSON.stringify(atualizados));

      alert("Campeonato criado com sucesso!");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setMensagem(
        "Não foi possível salvar o campeonato. A imagem está muito grande para o armazenamento local."
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <Link
        href="/"
        style={{
          color: "#ff4fd8",
          textDecoration: "none",
          fontWeight: 700,
          display: "inline-block",
          marginBottom: 24,
        }}
      >
        ← Voltar para dashboard
      </Link>

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#0b0b0b",
          border: "1px solid #1c1c1c",
          borderRadius: 20,
          padding: 24,
        }}
      >
        <h1 style={{ marginTop: 0, color: "#ff4fd8" }}>Criar campeonato</h1>

        {mensagem && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              background: "rgba(255,79,216,0.08)",
              border: "1px solid rgba(255,79,216,0.22)",
              borderRadius: 12,
              color: "#fff",
            }}
          >
            {mensagem}
          </div>
        )}

        <form onSubmit={handleSalvar} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Título do campeonato
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Champions League OF"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Número de participantes
            </label>
            <input
              type="number"
              min="2"
              value={numeroParticipantes}
              onChange={(e) => setNumeroParticipantes(e.target.value)}
              placeholder="Ex: 16"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Formato do campeonato
            </label>
            <select
              value={formato}
              onChange={(e) =>
                setFormato(
                  e.target.value as
                    | "eliminatorias"
                    | "pontos-corridos"
                    | "pontos-corridos-eliminatorias"
                )
              }
              style={inputStyle}
            >
              <option value="eliminatorias">Eliminatórias</option>
              <option value="pontos-corridos">Pontos corridos</option>
              <option value="pontos-corridos-eliminatorias">
                Pontos corridos + eliminatórias
              </option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Upload da imagem
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagemChange}
              style={{ ...inputStyle, padding: 10 }}
            />
          </div>

          {imagem && (
            <div>
              <p style={{ marginBottom: 8 }}>Pré-visualização:</p>
              <img
                src={imagem}
                alt="Prévia do campeonato"
                style={{
                  width: 220,
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "1px solid #2a2a2a",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "#ff4fd8",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px 18px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Salvar campeonato
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  color: "#fff",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
  fontSize: 15,
};