import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad",
  description:
    "Aviso de Privacidad Integral conforme a la LFPDPPP para clientes y usuarios de MiNegocio.",
};

const LAST_UPDATED = "2026-05-18";
const CONTACT_EMAIL = "privacidad@minegocio.digital";

export default function PrivacidadPage() {
  return (
    <>
      <h1>Aviso de Privacidad Integral</h1>
      <p className="text-muted-foreground">Última actualización: {LAST_UPDATED}</p>

      <p>
        MiNegocio Digital (&ldquo;<strong>MiNegocio</strong>&rdquo;, &ldquo;nosotros&rdquo;) es responsable del
        tratamiento de los datos personales que recabe a través de este sitio,
        de sus formularios de registro y del asistente de inteligencia
        artificial que ofrece a sus negocios suscriptores. Este Aviso de
        Privacidad se emite conforme a los artículos 15, 16 y 17 de la Ley
        Federal de Protección de Datos Personales en Posesión de los Particulares
        (LFPDPPP) y, cuando aplique, al Reglamento (UE) 2016/679 (GDPR).
      </p>

      <h2>1. ¿Quién es el responsable?</h2>
      <p>
        MiNegocio Digital, con domicilio para oír y recibir notificaciones en
        México. Contacto del responsable y de la persona encargada de la
        protección de datos: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. ¿Qué datos personales recabamos?</h2>
      <ul>
        <li><strong>De negocios suscriptores:</strong> nombre del negocio, giro, dirección, teléfono, WhatsApp, redes sociales, métodos de pago, horarios y políticas operativas.</li>
        <li><strong>De clientes finales que interactúan con el asistente:</strong> nombre completo, teléfono, correo electrónico (cuando lo proporcionan), historial de la conversación con el asistente, citas reservadas y preferencias declaradas (servicio o personal favorito).</li>
        <li><strong>De navegación:</strong> dirección IP, identificador de sesión, agente de usuario y datos técnicos necesarios para operar el servicio. No utilizamos cookies de marketing ni de terceros.</li>
      </ul>
      <p>
        <strong>No recabamos datos personales sensibles</strong> (salud, origen racial,
        creencias, orientación sexual, datos financieros). Si un cliente final
        los proporciona voluntariamente dentro del chat, se eliminan dentro del
        plazo de retención señalado más abajo.
      </p>

      <h2>3. ¿Para qué fines tratamos sus datos?</h2>
      <p>Fines primarios (necesarios para el servicio):</p>
      <ul>
        <li>Crear y administrar la cuenta del negocio suscriptor.</li>
        <li>Operar el asistente de IA: identificar al cliente, agendar y modificar citas, responder preguntas frecuentes y escalar a un humano cuando proceda.</li>
        <li>Mantener un registro de la conversación para auditoría, mejora del servicio y resolución de disputas.</li>
        <li>Cumplir obligaciones legales, fiscales y contractuales.</li>
      </ul>
      <p>Fines secundarios (requieren consentimiento expreso):</p>
      <ul>
        <li>Envío de comunicaciones promocionales sobre MiNegocio.</li>
        <li>Análisis estadístico agregado para mejorar el producto.</li>
      </ul>
      <p>
        Usted puede oponerse en cualquier momento al tratamiento para fines
        secundarios sin que ello afecte el servicio principal, escribiendo a
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o desactivando la
        casilla correspondiente en el flujo de registro.
      </p>

      <h2>4. Origen de los datos del cliente final (Art. 14 GDPR)</h2>
      <p>
        Cuando un cliente final escribe al asistente, sus datos se obtienen
        directamente de esa conversación. Cuando un negocio suscriptor importa
        manualmente clientes existentes a MiNegocio, esos datos provienen del
        propio negocio, quien declara contar con base de legitimación válida
        para compartirlos. MiNegocio actúa como <strong>encargado del tratamiento</strong>
        respecto de esos clientes, y el negocio suscriptor como responsable.
      </p>

      <h2>5. Transferencias y subprocesadores</h2>
      <p>
        Para operar el servicio nos apoyamos en proveedores tecnológicos que
        actúan como subprocesadores bajo acuerdos de tratamiento de datos. La
        lista actualizada está publicada en{" "}
        <a href="/legal/subprocesadores">/legal/subprocesadores</a> e incluye, entre
        otros, infraestructura en la nube, base de datos y modelos de
        inteligencia artificial. Algunas de estas transferencias implican
        envío de datos fuera de México (principalmente Estados Unidos y Unión
        Europea) bajo Cláusulas Contractuales Tipo equivalentes.
      </p>
      <p>
        No vendemos ni alquilamos datos personales a terceros bajo ninguna
        circunstancia.
      </p>

      <h2>6. Plazos de conservación</h2>
      <ul>
        <li>Datos de cuenta del negocio: mientras la cuenta esté activa más 24 meses.</li>
        <li>Conversaciones con el asistente: 18 meses desde el último mensaje.</li>
        <li>Datos de clientes finales sin actividad: 24 meses desde la última interacción, luego se anonimizan.</li>
        <li>Solicitudes de ejercicio de derechos ARCO: 5 años por obligación legal.</li>
      </ul>

      <h2>7. Derechos ARCO y derechos GDPR</h2>
      <p>
        Usted tiene derecho de Acceso, Rectificación, Cancelación y Oposición
        (ARCO), así como, en el ámbito GDPR, derecho a la portabilidad y a la
        supresión. El procedimiento para ejercerlos está descrito en{" "}
        <a href="/legal/derechos-arco">/legal/derechos-arco</a>. Responderemos en un
        plazo máximo de 20 días hábiles.
      </p>

      <h2>8. Medidas de seguridad</h2>
      <p>
        Aplicamos controles físicos, técnicos y administrativos razonables para
        proteger los datos: cifrado en tránsito (TLS), control de acceso por
        rol, aislamiento por inquilino mediante Row Level Security, registros
        de auditoría y pruebas periódicas de seguridad.
      </p>

      <h2>9. Cambios al Aviso</h2>
      <p>
        Cualquier cambio sustancial se publicará en esta página y, cuando sea
        razonable, se notificará por correo electrónico al titular. La fecha de
        última actualización aparece al inicio del documento.
      </p>

      <h2>10. Autoridad de control</h2>
      <p>
        Si considera vulnerado su derecho a la protección de datos personales,
        puede acudir al Instituto Nacional de Transparencia, Acceso a la
        Información y Protección de Datos Personales (INAI) en{" "}
        <a href="https://home.inai.org.mx" target="_blank" rel="noreferrer">home.inai.org.mx</a>.
      </p>
    </>
  );
}
