import Link from "next/link";

export function Navbar() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        padding: "20px 40px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <h1 style={{ color: "#ff4fd8", fontWeight: "900" }}>
        Older Federation
      </h1>

      <nav style={{ display: "flex", gap: "20px" }}>
        <Link href="/" style={{ color: "white" }}>Home</Link>
        <Link href="/clubs" style={{ color: "white" }}>Clubes</Link>
        <Link href="/championships" style={{ color: "white" }}>Campeonatos</Link>
        <Link href="/login" style={{ color: "#ff4fd8" }}>Login</Link>
      </nav>
    </header>
  );
}