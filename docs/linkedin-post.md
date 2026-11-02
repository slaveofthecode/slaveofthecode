# LinkedIn post + technical Q&A

Draft for the "new portfolio site" announcement.
Repo is **public** — this file is uncommitted on purpose; delete it or keep it local once the post is live.

---

## Post (English, copy & paste)

🎨 I gave my portfolio a complete makeover — and added an AI that knows my CV.

What's new on [slaveofthecode.vercel.app](https://slaveofthecode.vercel.app):

🎨 **New look & feel** — clean grayscale UI, new typography, dark & light theme 🌗
🤖 **AI chat** — ask it anything about my experience; it answers in English or Spanish, grounded strictly in my CV
📄 **Download CV** — one click to grab the PDF
✨ **"Now" section** — what I'm actively working on right now
📱 **Fully responsive** — from mobile to desktop

The fun part for me was the chat: a RAG pipeline (retrieval-augmented generation) over my own CV, with rate limits and cost caps so nobody burns my Gemini bill. Happy to talk details in the comments.

Have a look — and ask the AI anything 😉

🔗 https://slaveofthecode.vercel.app

#OpenToWork #WebDevelopment #AI #Portfolio #RAG

---

## Q&A técnico (por si me preguntan)

### Arquitectura general
- Monorepo (Bun workspaces): `apps/web` (Astro, **static output**) + `apps/api` (Node serverless, web-standard `Request`/`Response`). Dos proyectos separados en Vercel desde el mismo repo.
- El CV es **single source of truth**: `packages/content` (schemas Zod + JSON en `en`/`es`). Web y API solo se comunican por HTTP; ninguno importa al otro.
- El sitio es mayormente estático; solo el chat necesita backend.

### ¿Cómo funciona el chat? (RAG, no fine-tuning)
1. **Build time**: trozo el CV en chunks deterministas (uno por perfil, cada rol de experiencia, grupo de skills, idioma, educación, certificación y item de "Now") → ~56 chunks (28 por idioma). Los embejo con `gemini-embedding-001` y los guardo en un SQLite (vía sql.js WASM, sin base de datos externa) commiteado como snapshot.
2. **Runtime**: el front manda los últimos 12 mensajes + locale a `POST /chat`. El backend embebe la pregunta, recupera los **top-6 chunks** por similitud coseno (brute force, el corpus es chico) y **siempre ancla el chunk de perfil** (nombre, email, links) — sin eso, las preguntas de contacto respondían "no tengo el email en el contexto".
3. El system prompt le dice que responda **en primera persona como yo**, solo desde los extractos, que rechace off-topic y que resista prompt injection. Modelo: `gemini-flash-latest` (REST directo, sin SDK).

### Consumo y tokens
- **Lo caro (embeddings del CV) ocurre una vez, en build** — no por consulta. Regenero el snapshot solo cuando cambia el CV (`bun run build:rag`).
- Por consulta: 1 embedding de la pregunta (~pocos tokens) + prompt con ~6 chunks chicos + perfil (orden de magnitud: ~1–2k tokens de input) + salida **topeada en 800 tokens**.
- `thinkingBudget: 0` (modelo de razonamiento desactivado — antes los tokens de thinking se comían el presupuesto de salida y truncaba respuestas a media frase).
- Temperatura 0.3 (respuestas más deterministas, menos ruido).
- Orden de magnitud del costo por pregunta: **fracción de centavo** (Gemini Flash es de los modelos más baratos; el presupuesto real es el techo, no el promedio).

### Controles de costo (todo ANTES de llamar a Gemini = USD 0 si bloquea)
- Body > 16 KB → 413
- Schema: máx 12 mensajes × 2000 chars → 400
- Origen no permitido (CORS) → 403
- **Rate limit por IP: 10 req/min** (en memoria) → 429 con `Retry-After`
- **Tope global diario: 200 req/día UTC** (en memoria) → 429 `daily_limit_reached`. El chequeo de IP va primero para que una IP abusiva no se coma el presupuesto de todos.
- Clamp duro de `maxOutputTokens` a 800 en el provider (nadie puede pedir más).
- **Techo real**: presupuesto de Google Cloud configurado en USD 5 con alertas. Los limitadores in-memory son best-effort en serverless (cada instancia tiene su propio contador); el presupuesto es la red dura.

### Seguridad / abuso
- System prompt con defensa contra prompt injection ("ignore previous instructions" no cambia el contrato: solo responde desde los extractos del CV).
- El markdown de la respuesta se **escapa antes de renderizar** en el front (sin dependencias) → sin XSS desde output del modelo.
- La API key nunca llega al browser; solo existe como env var del server.
- El CV es información que ya es pública (el PDF está en el sitio) — el chat no expone nada nuevo, solo lo hace consultable.

### Decisiones y trade-offs honestos (por qué NO otras cosas)
- **No fine-tuning**: un CV cambia seguido; reentrenar por cada actualización es caro y lento. RAG se actualiza re-generando el snapshot.
- **No meter el CV entero en el prompt**: ~14 trabajos + skills + certs sería contexto al pedo en cada pregunta; retrieval manda solo lo relevante (más barato y más preciso).
- **No Pinecone/pgvector**: el corpus tiene 56 chunks. SQLite + coseno brute-force es reproducible, gratis, sin cuenta extra, y corre en el serverless tal cual.
- **No sesiones server-side**: el front manda el historial reciente (stateless). Sin cookies, sin base de datos de sesiones, sin estado que pierder en cold starts.
- **No streaming en v1**: respuesta JSON completa. Si lo escale, iría por SSE.
- **Por qué Gemini**: REST simple sin SDK, tier gratuito/generoso para empezar, embeddings y chat en el mismo proveedor. La API está aislada tras un adaptador (`GeminiProvider`) — cambiarla por otro LLM es un archivo.
- **CORS con allowlist**: solo mi dominio de producción + localhost. Cualquier otro origen recibe 403.

### Posibles follow-ups (backlog)
- Regla WAF en Vercel sobre `/api/chat` y/o Turnstile (CAPTCHA) — defensa adicional en el edge, antes del function.
- Evals de calidad de respuestas (hay un script `eval:chat` básico).
- Rate limits externos (Upstash) si el in-memory no alcanza.

### Datos del deploy (si preguntan de infra)
- Web: `https://slaveofthecode.vercel.app/` (proyecto Vercel "web", build desde la raíz del repo).
- API: `https://slaveofthecode-api.vercel.app/` (proyecto Vercel "api", Root Directory `apps/api`).
- Env API: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-flash-latest`, `GEMINI_EMBED_MODEL=gemini-embedding-001`, `ALLOWED_ORIGINS`.
- Env Web: `PUBLIC_API_URL` (solo el host).
- Docs internas del proyecto: `docs/architecture.md` (sección "Chat cost caps") y `docs/decisions/ADR-0006-chat-backend.md`.
