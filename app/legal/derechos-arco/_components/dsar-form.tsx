"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const REQUEST_TYPES = [
  { value: "access", label: "Acceso" },
  { value: "rectification", label: "Rectificación" },
  { value: "cancellation", label: "Cancelación" },
  { value: "opposition", label: "Oposición" },
  { value: "deletion", label: "Supresión (GDPR)" },
  { value: "portability", label: "Portabilidad (GDPR)" },
];

export function DsarForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const form = new FormData(e.currentTarget);
    const body = {
      request_type: String(form.get("request_type") || ""),
      subject_name: String(form.get("subject_name") || "").trim(),
      subject_email: String(form.get("subject_email") || "").trim(),
      subject_phone: String(form.get("subject_phone") || "").trim() || null,
      details: String(form.get("details") || "").trim() || null,
    };

    try {
      const res = await fetch("/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "No se pudo enviar la solicitud.");
        setStatus("error");
        return;
      }
      setReferenceId(json.id);
      setStatus("ok");
    } catch {
      setErrorMsg("Error de red. Inténtelo de nuevo o escriba a privacidad@minegocio.digital.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
        Solicitud recibida. Folio: <strong>{referenceId}</strong>. Responderemos
        en máximo 20 días hábiles al correo proporcionado.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-border/40 bg-card/30 p-4">
      <label className="grid gap-1 text-sm">
        <span>Tipo de solicitud</span>
        <select
          name="request_type"
          required
          defaultValue=""
          className="rounded-md border border-border/40 bg-background px-3 py-2"
        >
          <option value="" disabled>
            Seleccione…
          </option>
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span>Nombre completo</span>
        <input
          name="subject_name"
          required
          maxLength={200}
          className="rounded-md border border-border/40 bg-background px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Correo electrónico de contacto</span>
        <input
          name="subject_email"
          type="email"
          required
          maxLength={200}
          className="rounded-md border border-border/40 bg-background px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Teléfono (opcional)</span>
        <input
          name="subject_phone"
          maxLength={40}
          className="rounded-md border border-border/40 bg-background px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Detalle de la solicitud</span>
        <textarea
          name="details"
          rows={4}
          maxLength={2000}
          required
          className="rounded-md border border-border/40 bg-background px-3 py-2"
          placeholder="Describa qué datos desea acceder, rectificar, cancelar, etc."
        />
      </label>

      {errorMsg && (
        <p className="text-sm text-red-400" role="alert">
          {errorMsg}
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Enviando…" : "Enviar solicitud"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Verificaremos su identidad antes de procesar la solicitud. Podríamos
        contactarle por correo para solicitar documentación.
      </p>
    </form>
  );
}
