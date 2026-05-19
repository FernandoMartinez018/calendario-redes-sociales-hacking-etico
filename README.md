# MotoSocial — Gestor de contenido para tiendas de motos

App de marketing para **tiendas y concesionarios de motos**: genera ideas y
publicaciones con IA, las organiza en un calendario, y mide qué funciona para
tomar mejores decisiones de contenido.

> Proyecto académico. La publicación a redes y la importación de métricas son
> **manuales/simuladas** a propósito (ver "Alcance" más abajo).

## Funcionalidades

- **Asistente IA**: pregunta tus redes y contexto → genera N ideas
  (pilar, red, formato, día/hora sugeridos) → conviertes cada idea en una
  publicación completa, la editas/regeneras/apruebas una por una → al calendario.
- **Post rápido**: una publicación completa al instante (moto / promo / evento /
  general) con copy, hashtags, fecha y selección de imagen.
- **Perfil de Tienda**: marcas, público, ciudad, tono, promos… alimenta toda la IA.
- **Slogans & SEO**: slogans, hashtags clasificados (grandes/medianos/nicho/
  locales) y SEO local (Google Business, meta, keywords).
- **Variantes A/B** del copy con ángulos distintos.
- **Calendario** (mes/semana/lista) y **Publicaciones** (filtros por estado/red,
  orden, exportar CSV, editar/eliminar; las publicadas quedan bloqueadas).
- **Multimedia**: subida a Cloudinary y galería reutilizable.
- **Métricas**: registro manual de likes/vistas → analítica real por
  red/formato/pilar/mejor día; el calendario aprende los mejores horarios.
- **Dashboard** operativo: pendientes, próximas a publicar, semana y
  seguimiento por red.

## Stack

React 19 + Vite · Express · Drizzle ORM + PostgreSQL · JWT · **Groq**
(IA, SDK `openai` compatible) · Cloudinary + Multer · Tailwind v4.

## Configuración

Crea un archivo **`.env`** en la raíz (ver `.env.example`):

```
GROQ_API_KEY="tu_clave_groq"        # https://console.groq.com/keys
GROQ_MODEL=""                        # opcional (def: llama-3.3-70b-versatile)
CLOUDINARY_CLOUD_NAME="..."          # opcional (para subir multimedia)
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

La URL de la base de datos está en `drizzle.config.ts` y, como respaldo, en
`src/db/index.ts` (no requiere variable de entorno).

## Cómo correr

```bash
npm install
npm run dev        # http://localhost:3000  (frontend + API)
```

> El backend **no recarga solo**: si cambias código del servidor, reinicia
> `npm run dev`.

Otros scripts:

```bash
npm run lint       # tsc --noEmit
npm run build      # build de producción
npm run db:push    # aplicar el schema a la BD
npm run db:seed    # datos de ejemplo
```

Scripts de utilidad en `scripts/` (ejecutar con `npx tsx scripts/<archivo>`):
`simulate-month.ts` (simula 1 mes de uso) y `upload-images.ts` (sube imágenes
demo a Cloudinary). **Son aditivos**: re-ejecutarlos duplica datos.

## Alcance (honesto)

- **No publica automáticamente** en Instagram/TikTok/etc.: las APIs oficiales
  exigen aprobación de negocio / planes de pago, inviable para el alcance. El
  `scheduler.ts` solo **marca** las publicaciones como publicadas (simulado).
- **Métricas manuales**: se registran a mano (scraping es frágil y contra ToS).
- Login con Google (Supabase) es opcional; sin configurarlo, el login por
  email/contraseña funciona igual.

Ver `ROADMAP.md` para el detalle de fases.
