import { db } from '../../db/index.js';
import { storeProfiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Construye un bloque de contexto de marketing a partir del perfil de la tienda.
 * Se antepone a los prompts de IA para que el contenido sea específico de esa tienda.
 * Devuelve '' si el usuario aún no tiene perfil.
 */
export async function getStoreContext(userId: string): Promise<string> {
  const [p] = await db
    .select()
    .from(storeProfiles)
    .where(eq(storeProfiles.userId, userId))
    .limit(1);

  if (!p) return '';

  const parts: string[] = [];
  if (p.brands) parts.push(`Marcas que vende la tienda: ${p.brands}.`);
  if (p.motoTypes) parts.push(`Tipos de moto: ${p.motoTypes}.`);
  if (p.targetAudience) parts.push(`Público objetivo: ${p.targetAudience}.`);
  if (p.city) parts.push(`Ciudad/zona (para SEO local): ${p.city}.`);
  if (p.brandTone) parts.push(`Tono de marca: ${p.brandTone}.`);
  if (p.valueProposition) parts.push(`Propuesta de valor: ${p.valueProposition}.`);
  if (p.activePromotions) parts.push(`Promociones vigentes: ${p.activePromotions}.`);
  if (p.season) parts.push(`Temporada/contexto actual: ${p.season}.`);

  if (parts.length === 0) return '';

  return `Contexto de la tienda (úsalo para personalizar el contenido):\n${parts.join('\n')}`;
}
