"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Campeonato = {
  id: string;
  titulo: string;
  imagem: string;
  numeroParticipantes: number;
  formato:
    | "eliminatorias"
    | "pontos-corridos"
    | "pontos-corridos-eliminatorias";
  criadoPor: string;
  dataCriacao: string;
  timeIds?: string[];
  gruposData?: { nome: string; timeIds: string[] }[];
  partidas?: any[];
};

type JogadorLogado = {
  id: string;
  nome: string;
  email?: string;
  isAdmin?: boolean;
};

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

function gerarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizarTexto(texto?: string) {
  return String(texto || "").trim().toLowerCase();
}

function reduzirImagem(
  file: File,
  maxWidth = 700,
  quality = 0.72
): Promise<string> {
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
  const router = useRouter();

  const [jogadorLogado, setJogadorLogado] = useState<JogadorLogado | null>(null);
  const [titulo, setTitulo] = useState("");
  const [imagem, setImagem] = useState("");
  const [numeroParticipantes, setNumeroParticipantes] = useState("");
  const [formato, setFormato] = useState<
    "eliminatorias" | "pontos-corridos" | "pontos-corridos-eliminatorias"
  >("eliminatorias");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function validarAcesso() {
      try {
        setCarregando(true);

        const supabase = createClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error(error);
          router.push("/login");
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const jogadorAtual: JogadorLogado = {
          id: user.id,
          nome: user.user_metadata?.nome || user.email || "Usuário",
          email: user.email || "",
          isAdmin:
            normalizarTexto(user.email || "") === normalizarTexto(ADMIN_EMAIL),
        };

        setJogadorLogado(jogadorAtual);

        if (!jogadorAtual.isAdmin) {
          alert("Apenas o administrador pode criar campeonatos.");
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error(error);
        router.push("/login");
      } finally {
        setCarregando(false);
      }
    }

    validarAcesso();
  }, [router]);

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

  async function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setMensagem("");
      setSalvando(true);

      const supabase = createClient();

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

      if (participantesFinal > 32) {
        setMensagem("O máximo permitido é 32 participantes.");
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
        setMensagem("Erro ao validar login.");
        return;
      }

      if (!user) {
        setMensagem("Faça login novamente.");
        return;
      }

      const { data: existentes, error: erroBusca } = await supabase
        .from("campeonatos")
        .select("id, titulo");

      if (erroBusca) {
        console.error(erroBusca);
        setMensagem(`Erro ao validar campeonatos existentes: ${erroBusca.message}`);
        return;
      }

      const tituloDuplicado = (existentes || []).some(
        (item: any) =>
          normalizarTexto(item.titulo) === normalizarTexto(tituloFinal)
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
        criadoPor: user.id,
        dataCriacao: new Date().toISOString(),
        timeIds: [],
        gruposData: [],
        partidas: [],
      };

      const payload = {
        id: novoCampeonato.id,
        titulo: novoCampeonato.titulo,
        imagem: novoCampeonato.imagem,
        numeroparticipantes: novoCampeonato.numeroParticipantes,
        formato: novoCampeonato.formato,
        criadopor: novoCampeonato.criadoPor,
        datacriacao: novoCampeonato.dataCriacao,
        timeids: novoCampeonato.timeIds || [],
        gruposdata: novoCampeonato.gruposData || [],
        partidas: novoCampeonato.partidas || [],
      };

      const { error: erroInsert } = await supabase
        .from("campeonatos")
        .insert(payload);

      if (erroInsert) {
        console.error("Erro ao salvar campeonato:", erroInsert);
        setMensagem(`Erro ao salvar campeonato no banco: ${erroInsert.message}`);
        return;
      }

      alert("Campeonato criado com sucesso!");
      router.push(`/campeonatos/${novoCampeonato.id}`);
    } catch (error) {
      console.error(error);
      setMensagem("Erro inesperado ao criar campeonato.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Carregando...
      </main>
    );
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
        href="/dashboard"
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
              max="32"
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
            disabled={salvando}
            style={{
              background: "#ff4fd8",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px 18px",
              fontWeight: 700,
              cursor: salvando ? "not-allowed" : "pointer",
              fontSize: 16,
              opacity: salvando ? 0.7 : 1,
            }}
          >
            {salvando ? "Salvando..." : "Salvar campeonato"}
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