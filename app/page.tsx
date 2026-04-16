"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const logado = localStorage.getItem("sessaoAtiva");

    if (logado === "true") {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login";
    }
  }, []);

  return null;
}