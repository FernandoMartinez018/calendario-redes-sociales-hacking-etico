// Envío de correos vía EmailJS (REST, sin dependencias). Solo navegador.
const ENV = (import.meta as any).env;

async function send(templateId: string | undefined, params: Record<string, any>): Promise<boolean> {
  const service = ENV.VITE_EMAILJS_SERVICE_ID;
  const key = ENV.VITE_EMAILJS_PUBLIC_KEY;
  if (!service || !key || !templateId) return false;
  try {
    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: service,
        template_id: templateId,
        user_id: key,
        template_params: params,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Reset de contraseña
export function sendResetEmailJS(toEmail: string, link: string): Promise<boolean> {
  return send(ENV.VITE_EMAILJS_TEMPLATE_ID, {
    to_email: toEmail,
    email: toEmail,
    subject: 'Restablece tu contraseña — MotoSocial',
    link,
    message: `Solicitaste restablecer tu contraseña en MotoSocial. Abre este enlace (expira en 1 hora): ${link}`,
  });
}

// Bienvenida al registrarse
export function sendWelcomeEmailJS(toEmail: string, name: string): Promise<boolean> {
  return send(ENV.VITE_EMAILJS_WELCOME_TEMPLATE_ID, {
    to_email: toEmail,
    email: toEmail,
    name: name || 'Bienvenido',
    subject: '¡Bienvenido a MotoSocial! 🏍️',
    message: `Hola ${name || ''}, tu cuenta en MotoSocial fue creada con éxito. Ya puedes generar contenido con IA y planificar tu calendario.`,
  });
}
