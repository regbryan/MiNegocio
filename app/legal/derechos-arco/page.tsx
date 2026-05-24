import type { Metadata } from "next";
import { DsarForm } from "./_components/dsar-form";

export const metadata: Metadata = {
  title: "Derechos ARCO",
  description:
    "Solicite el acceso, rectificación, cancelación, oposición, supresión o portabilidad de sus datos personales.",
};

export default function DerechosArcoPage() {
  return (
    <>
      <h1>Ejercicio de Derechos ARCO / DSAR</h1>

      <p>
        Conforme a los artículos 28 a 35 de la LFPDPPP y, cuando aplique, al
        GDPR, usted puede solicitar:
      </p>
      <ul>
        <li><strong>Acceso:</strong> conocer qué datos tenemos sobre usted.</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
        <li><strong>Cancelación / Supresión:</strong> eliminar sus datos cuando ya no sean necesarios.</li>
        <li><strong>Oposición:</strong> negarse al tratamiento para fines específicos (p. ej. marketing).</li>
        <li><strong>Portabilidad</strong> (GDPR): recibir sus datos en formato estructurado.</li>
      </ul>

      <h2>Cómo solicitarlo</h2>
      <p>
        Use el formulario al final de esta página o escriba directamente a{" "}
        <a href="mailto:privacidad@minegocio.digital">privacidad@minegocio.digital</a>.
        Necesitamos verificar su identidad, por lo que le pediremos un
        documento que acredite la titularidad de los datos.
      </p>

      <h2>Plazos</h2>
      <p>
        Responderemos en un máximo de <strong>20 días hábiles</strong> a partir de la
        recepción de su solicitud completa. Si necesitamos más tiempo por la
        complejidad del caso, se lo notificaremos con la justificación
        correspondiente.
      </p>

      <h2>Sin costo</h2>
      <p>
        El ejercicio de estos derechos es gratuito. Solo podríamos cobrar la
        reproducción en medios no electrónicos cuando la información sea
        muy voluminosa, y solo al costo justificable.
      </p>

      <h2>Si su solicitud es rechazada</h2>
      <p>
        Le explicaremos los motivos y, si no está conforme, puede acudir al
        INAI en{" "}
        <a href="https://home.inai.org.mx" target="_blank" rel="noreferrer">
          home.inai.org.mx
        </a>{" "}
        dentro de los 15 días hábiles siguientes a nuestra respuesta.
      </p>

      <h2>Formulario</h2>
      <div className="not-prose">
        <DsarForm />
      </div>
    </>
  );
}
