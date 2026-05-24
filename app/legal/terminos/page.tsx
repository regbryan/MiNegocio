import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos de servicio que regulan el uso de la plataforma MiNegocio por parte de negocios suscriptores y usuarios finales.",
};

const LAST_UPDATED = "2026-05-18";
const CONTACT_EMAIL = "legal@minegocio.digital";

export default function TerminosPage() {
  return (
    <>
      <h1>Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground">Última actualización: {LAST_UPDATED}</p>

      <h2>1. Aceptación</h2>
      <p>
        Al registrar un negocio en MiNegocio o utilizar el asistente
        embebible, usted acepta estos Términos. Si no está de acuerdo, no
        utilice el servicio.
      </p>

      <h2>2. Definiciones</h2>
      <ul>
        <li><strong>Plataforma:</strong> el conjunto de sitios web, APIs y widgets operados por MiNegocio.</li>
        <li><strong>Suscriptor:</strong> el negocio que crea una cuenta en MiNegocio.</li>
        <li><strong>Usuario Final:</strong> la persona que interactúa con el asistente embebido en los canales del Suscriptor.</li>
        <li><strong>Contenido del Suscriptor:</strong> servicios, precios, horarios, FAQ y datos de clientes que el Suscriptor cargue en la Plataforma.</li>
      </ul>

      <h2>3. Cuenta y responsabilidad</h2>
      <p>
        El Suscriptor es el único responsable de la veracidad de su Contenido
        y del cumplimiento de las leyes aplicables a su giro (sanitarias,
        fiscales, de publicidad, etc.). MiNegocio no audita el Contenido del
        Suscriptor.
      </p>

      <h2>4. Rol respecto a datos personales</h2>
      <p>
        MiNegocio actúa como <strong>responsable</strong> respecto a los datos del
        Suscriptor, y como <strong>encargado del tratamiento</strong> respecto a los
        datos de Usuarios Finales recabados por el asistente para fines del
        Suscriptor. El detalle se encuentra en el{" "}
        <a href="/legal/privacidad">Aviso de Privacidad</a>.
      </p>

      <h2>5. Uso aceptable</h2>
      <ul>
        <li>Prohibido usar la Plataforma para actividades ilícitas, spam, suplantación o engaño al consumidor.</li>
        <li>Prohibido intentar extraer mensajes de sistema, abusar del modelo de IA, o sobrepasar los límites de uso.</li>
        <li>Prohibido cargar datos sensibles (salud, datos financieros completos, credenciales) en campos de texto libre.</li>
      </ul>

      <h2>6. Disponibilidad del servicio</h2>
      <p>
        MiNegocio se ofrece &ldquo;tal cual&rdquo;. No garantizamos disponibilidad
        ininterrumpida ni que el asistente de IA produzca respuestas perfectas.
        El Suscriptor debe revisar reservas y comunicaciones críticas.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, MiNegocio no será responsable por
        daños indirectos, lucro cesante, pérdida de datos o reclamaciones de
        terceros derivadas del Contenido del Suscriptor. La responsabilidad
        máxima agregada se limita a lo pagado por el Suscriptor en los 12 meses
        previos al hecho que origina la reclamación.
      </p>

      <h2>8. Suspensión y terminación</h2>
      <p>
        MiNegocio puede suspender o cancelar cuentas que violen estos
        Términos. El Suscriptor puede cancelar en cualquier momento; sus datos
        se eliminan o anonimizan conforme al Aviso de Privacidad.
      </p>

      <h2>9. Modificaciones</h2>
      <p>
        Estos Términos pueden actualizarse. Los cambios materiales se
        notificarán con 15 días de anticipación al correo del Suscriptor.
      </p>

      <h2>10. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos.
        Cualquier controversia se someterá a los tribunales competentes de la
        Ciudad de México, renunciando las partes a cualquier otro fuero.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para asuntos legales o contractuales: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
