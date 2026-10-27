"use client";

import { useState } from "react";

/** Copia o HTML da campanha. Com pendência, avisa antes: o HTML sai com [A CONFIRMAR]. */
export default function CopiarHtml({ html, bloqueado }: { html: string; bloqueado: boolean }) {
  const [msg, setMsg] = useState("");
  const copiar = async () => {
    if (bloqueado && !window.confirm("Este e-mail ainda tem [A CONFIRMAR] no texto. Copiar mesmo assim?")) return;
    await navigator.clipboard.writeText(html);
    setMsg("HTML copiado.");
    window.setTimeout(() => setMsg(""), 2500);
  };
  return (
    <div style={{ marginTop: 18 }}>
      <button
        type="button"
        onClick={copiar}
        style={{ background: "#0e0e0e", color: "#fff", border: 0, borderRadius: 999, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}
      >
        Copiar HTML para a gestão
      </button>
      <span role="status" style={{ marginLeft: 10, color: "#1f8a4c", fontWeight: 600 }}>{msg}</span>
    </div>
  );
}
