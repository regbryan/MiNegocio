import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subprocesadores",
  description:
    "Lista actualizada de subprocesadores que tratan datos personales en nombre de MiNegocio.",
};

const LAST_UPDATED = "2026-05-18";

type Subprocessor = {
  name: string;
  purpose: string;
  dataCategories: string;
  location: string;
  dpa: string;
};

const subprocessors: Subprocessor[] = [
  {
    name: "Vercel Inc.",
    purpose: "Hospedaje, CDN y ejecución de funciones serverless. AI Gateway intermediario hacia modelos de IA.",
    dataCategories: "Logs de petición, IP, cabeceras, payloads de chat en tránsito.",
    location: "EE. UU. (con réplicas globales)",
    dpa: "https://vercel.com/legal/dpa",
  },
  {
    name: "Supabase Inc.",
    purpose: "Base de datos PostgreSQL administrada y almacenamiento de archivos.",
    dataCategories: "Datos de cuenta, clientes, citas, transcripciones de conversación.",
    location: "EE. UU. / UE (región seleccionable por instancia)",
    dpa: "https://supabase.com/legal/dpa",
  },
  {
    name: "Anthropic, PBC",
    purpose: "Proveedor del modelo Claude usado por el asistente de IA, vía AI Gateway.",
    dataCategories: "Mensajes del Usuario Final y contexto del negocio enviados como prompt.",
    location: "EE. UU.",
    dpa: "https://www.anthropic.com/legal/dpa",
  },
];

export default function SubprocesadoresPage() {
  return (
    <>
      <h1>Subprocesadores</h1>
      <p className="text-muted-foreground">Última actualización: {LAST_UPDATED}</p>

      <p>
        MiNegocio contrata a los siguientes proveedores para operar el
        servicio. Todos están sujetos a un Acuerdo de Tratamiento de Datos
        (DPA) que les obliga a aplicar medidas de seguridad equivalentes a
        las descritas en nuestro <a href="/legal/privacidad">Aviso de Privacidad</a>.
      </p>

      <div className="not-prose my-6 overflow-x-auto rounded-md border border-border/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Proveedor</th>
              <th className="px-3 py-2 font-medium">Finalidad</th>
              <th className="px-3 py-2 font-medium">Datos tratados</th>
              <th className="px-3 py-2 font-medium">Ubicación</th>
              <th className="px-3 py-2 font-medium">DPA</th>
            </tr>
          </thead>
          <tbody>
            {subprocessors.map((s) => (
              <tr key={s.name} className="border-t border-border/40 align-top">
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{s.purpose}</td>
                <td className="px-3 py-2 text-muted-foreground">{s.dataCategories}</td>
                <td className="px-3 py-2 text-muted-foreground">{s.location}</td>
                <td className="px-3 py-2">
                  <a href={s.dpa} target="_blank" rel="noreferrer" className="underline">
                    Ver DPA
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Notificación de cambios</h2>
      <p>
        Antes de incorporar un nuevo subprocesador con acceso significativo a
        datos personales, MiNegocio notificará a sus Suscriptores con al menos
        30 días de anticipación. El Suscriptor puede oponerse por escrito; si
        no es posible mitigar la objeción, podrá rescindir su suscripción sin
        penalización.
      </p>
    </>
  );
}
