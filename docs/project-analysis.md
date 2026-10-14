# Análisis del proyecto — Slave of the Code

> Snapshot: 2026-10-14 · Rama `docs/003-project-analysis`
> Propósito de este documento: que cualquier persona (humano o agente) que entre
> al repo entienda en 5 minutos de qué va, con qué está hecho y qué conviene mejorar.

---

## 1. De qué va el repo

Repo **triple propósito** (no confundir las caras):

| Cara | Dónde vive | Qué es |
|---|---|---|
| **Portfolio / CV web** | `src/` | Sitio estático Astro desplegado en https://slaveofthecode.vercel.app/ |
| **README de perfil GitHub** | `README.md` (raíz) | Se reescribe solo cada día con un GIF aleatorio vía GitHub Actions |
| **Repo especial GitHub** | el repo en sí | `slaveofthecode/slaveofthecode` (perfil + repositorio único) |

Todo el contenido del CV es **data-driven**: vive en `src/data/resume.json` y los
componentes solo renderizan. Cambiar el CV no requiere tocar HTML.

---

## 2. Stack tech

### Sitio web (la app)

| Capa | Tecnología | Versión actual | Última estable |
|---|---|---|---|
| Framework | **Astro** | 4.3.6 | 7.3.8 |
| Estilos | **Tailwind CSS** | 3.4.1 | 4.3.3 |
| Integración Tailwind | `@astrojs/tailwind` | 5.1.0 | 6.0.2 (o migrar a `@tailwindcss/vite`) |
| Type-check | `@astrojs/check` + **TypeScript** | 0.5.4 / 5.3.3 | 0.9.10 / 5.9.3 |
| CSS preprocesador | **Sass** | 1.70.0 | 1.105.1 |
| Fuentes | `@fontsource/*` | 5.0.x | 5.3.x |
| Telemetría | `@vercel/speed-insights` | 1.0.10 | 2.0.0 |
| Command palette | `hotkeypad` | 0.1.0 | 1.0.2 |
| Deploy | **Vercel** (estático) | — | — |

- **Sin framework JS cliente** (ni React ni Vue): componentes `.astro` puros +
  islands mínimas (theme toggle, hotkeypad). HTML-first, cero JS en el bundle salvo lo estricto.
- **Build**: `astro check && astro build` (tipos + estático). No hay SSR.
- **API route**: `src/pages/api/random-gif.ts` — funciona en Vercel serverless (302).

### Automatización / CI

- `.github/workflows/update-readme.yml` — cron diario a medianoche → `node update-readme.js`
  → commit directo a la rama por defecto.
- Sin CI de build/verificación en PRs (solo se verifica localmente con `npm run build`).

---

## 3. Estructura de carpetas

```
slaveofthecode/
│
├── AGENTS.md                      ⭐ FUENTE ÚNICA DE VERDAD para agentes IA
│                                   (reglas, arquitectura, permisos, flujos)
├── README.md                      📛 README de PERFIL de GitHub (no del sitio)
│                                   → se reescribe solo con GIF diario
├── update-readme.js               🎲 Script Node puro: elige GIF aleatorio
│                                   y lo inserta en README.md
│
├── .github/workflows/
│   └── update-readme.yml          ⏰ GitHub Actions: cron diario del GIF
│
├── .harness/                      🤖 HARNESS IA (contenido compartido)
│   ├── agents/                    👥 4 sub-agentes especializados:
│   │   ├── feature-builder.md     → implementa features en src/
│   │   ├── data-curator.md        → edita resume.json con seguridad de schema
│   │   ├── readme-maintainer.md   → dueño del README + workflow del GIF
│   │   └── site-reviewer.md       → revisor independiente (solo lee, no edita)
│   ├── skills/                    🧠 Procedimientos reutilizables:
│   │   ├── add-resume-entry/      → receta para añadir entradas al CV
│   │   ├── update-readme-gif/     → mantener sincronizadas las 3 listas de GIFs
│   │   ├── verify-build/          → gate de verificación (npm run build)
│   │   └── memory-update/         → protocolo de aprendizaje tras cada tarea
│   └── memory/                    💾 Memoria autorreflexiva (Markdown plano)
│       ├── project-state.md       → snapshot veraz: rama actual, issues, siguiente tarea
│       ├── lessons.md             → lecciones/gotchas acumuladas
│       └── decisions.md           → registro de decisiones arquitectónicas
│
├── .opencode/ , .claude/ , .cursor/   🔌 Adaptadores por herramienta
│   └── solo reenvían a AGENTS.md (thin stubs) — la política no se duplica
│
├── astro.config.mjs               ⚙️ Config Astro (solo integración: Tailwind)
├── tailwind.config.mjs            🎨 Config Tailwind 3 (darkMode por clase/data-attr)
├── tsconfig.json                  📐 Aliases: @/* → src/, @cv/* → src/data/
├── package.json                   📦 Scripts: dev / build / preview
│
└── src/                           🌐 EL SITIO WEB
    ├── pages/
    │   ├── index.astro            📄 Página única (SPA estática): monta todas las secciones
    │   └── api/random-gif.ts      🔀 Endpoint → 302 a GIF aleatorio (para GitHub)
    │
    ├── layouts/
    │   └── Layout.astro           🏗️ <html>: OG tags, fuentes, JSON-LD schema.org, body
    │
    ├── components/
    │   ├── sections/              📑 Una sección del CV por archivo:
    │   │   ├── Header.astro           → cabecera con nombre/foto/perfiles
    │   │   ├── AboutMe.astro          → bio
    │   │   ├── Experience.astro       → experiencia laboral
    │   │   ├── Educations.astro       → formación
    │   │   ├── Skills.astro           → skills
    │   │   ├── Projects.astro         → proyectos (iconos Github/Demo)
    │   │   └── Certifications.astro   → certificados
    │   ├── DarkWhite.astro        🌓 Toggle dark/white (inyecta dark: en <html>)
    │   ├── MainDataMinimalist.astro → barra de contacto (email/teléfono/redes)
    │   ├── KeyboardManager.astro  ⌨️ Command palette Cmd/Ctrl+K (hotkeypad) — HOY SIN USAR
    │   ├── MultilanguageSelect.astro → selector i18n — COMENTADO/INACTIVO
    │   └── InProgress.astro       🚧 Badge "...in progress..." — HOY SIN USAR
    │
    ├── data/
    │   └── resume.json            🗄️ TODOS los datos del CV (402 líneas)
    │                               shapes: basics, experience[], education[],
    │                               skills[], projects[], certificates[], + reservados
    │
    ├── icons/                     🎯 8 iconos SVG inline (Email, Github, LinkedIn…)
    ├── utils/index.ts             🔧 getJsonCV() → import tipado de resume.json
    ├── styles/reset.css           🎨 Reset CSS global
    ├── types.d.ts / env.d.ts      📝 Tipos compartidos
    │
```

### Flujo de datos (cómo se renderiza el sitio)

```
src/data/resume.json
        │
        ├── getJsonCV() / import { basics } from "@cv/resume.json"
        ▼
components/sections/*.astro  ──▶  pages/index.astro  ──▶  layouts/Layout.astro
        (7 secciones)              (los ensambla)           (HTML shell + SEO)
                                                              │
                                                              ▼
                                                     astro build → dist/ → Vercel
```

### Flujo de la IA (cómo trabajan los agentes)

```
                     AGENTS.md  (canonical, gana en conflictos)
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
.opencode/            .cursor/rules/          .claude/
(adaptador con         (regla que              (adaptador)
 permisos+comandos)     reenvía a AGENTS.md)
      │
      ├── carga .harness/skills/  (procedimientos)
      ├── carga .harness/agents/  (4 sub-agentes)
      └── carga .harness/memory/  (project-state, lessons, decisions)

Ciclo por tarea: leer estado → cargar skill → rama feature/* →
cambiar → npm run build → memory-update → staging (NO commit) →
humano revisa/commitea/pushea → agente crea PR (base main) → asigna al humano
```

---

## 4. Estado actual

- **Rama por defecto**: `main` (renombrada desde `master` el 2026-10-14, PR #4 y #5).
  Ruleset `rs-validation-pr`: **push directo a main rechazado (GH013)** — todo por PR.
- **Working tree limpio**, sin trabajo en curso.
- **Issues conocidos** (ver `.harness/memory/project-state.md`):
  1. El workflow del GIF hace `git push` directo a la rama por defecto → será rechazado
     por el ruleset salvo bypass de Actions/GITHUB_TOKEN.
  2. El workflow usa `node-version: '16'` (EOL) + `npm install` innecesario
     (el script solo usa built-ins de Node).
  3. Código huérfano: `KeyboardManager.astro`, `InProgress.astro` no se importan en
     ningún lado; `MultilanguageSelect.astro` está comentado.
- **Branches fusionados sin limpiar**: `docs/001-add-pr-flow`, `feat/001-add-ai-harness`,
  `feat/fixes-by-metaexplorer-extension`.

---

## 5. Mejoras propuestas (priorizadas)

### 🔴 P0 — Rápidas, bajo riesgo, alto valor

| # | Mejora | Detalle |
|---|---|---|
| 1 | **Arreglar el workflow del GIF** | `node-version: '16'` → `'22'` (o quitar setup-node y usar el runner default), quitar `npm install` (script usa solo `fs`), y resolver el push bloqueado: dar bypass al `GITHUB_TOKEN` en el ruleset para Actions, o cambiar a modo PR. **Verificar tras el siguiente run diario.** |
| 2 | **CI de verificación en PRs** | Workflow nuevo: en PR a `main` correr `npm ci` + `npm run build`. Hoy nada verifica los PRs — el `site-reviewer` corre solo localmente. Bajo esfuerzo, protege la rama principal. |
| 3 | **Limpiar código huérfano** | Decidir: eliminar `KeyboardManager.astro` + `InProgress.astro` (sin imports) **o** cablearlos (el command palette es un feature real). `MultilanguageSelect`: decidir si se activa i18n o se retira. Regla de AGENTS.md: no dejar código comentado en trabajo nuevo. |
| 4 | **Limpieza de branches fusionados** | Borrar las 3 ramas ya mergeadas (remoto + local). |
| 5 | **Fijar versiones de dependencias con wanted** | Actualizar dentro de la misma major: `sass` 1.70→1.105, `@astrojs/check` →0.5.10, `tailwindcss` 3.4.1→3.4.19, `@fontsource/*` →5.3.x, `typescript` →5.9.3. Cero breaking changes. |

### 🟡 P1 — Upgrade mayor (requiere su propia rama + revisión)

| # | Mejora | Detalle |
|---|---|---|
| 6 | **Astro 4 → 5 → 6 → 7 (por pasos)** | 4.3.6 está a **3 majors** de la última (7.3.8). No saltes de una: sube 4.16.19 primero (cierre de major), luego 5, luego 6, luego 7. Cada salto: `npm run build` + revisión visual. Astro 5 trae Content Layer API y `astro:env`; Astro 6/7 cambian el mínimo de Node (**≥22.12**). Requiere actualizar también `@astrojs/tailwind`, `@astrojs/check`, `@vercel/speed-insights` 1→2. |
| 7 | **TypeScript 5.3 → 5.9** | Solo dentro de major 5 (5.9.3 es lo "wanted"). TypeScript 7 es el compilador nativo (tsgo) — saltarlo hasta que Astro lo soporte oficialmente. |
| 8 | **`@vercel/speed-insights` 1 → 2** | Mayor 2, revisar changelog de Vercel (cambio de API del componente Astro). |

### 🟢 P2 — Estratégicas (decidir con calma)

| # | Mejora | Detalle |
|---|---|---|
| 9 | **Tailwind 3 → 4** | Tailwind 4 es **CSS-first**: se configura en CSS (`@theme`, `@custom-variant`) no en `tailwind.config.mjs`; se integra vía `@tailwindcss/vite` en vez de `@astrojs/tailwind` (deprecado). El `darkMode: ["class", '[data-skin-mode="dark"]']` actual necesita reescritura como `@custom-variant dark`. Hacer **después** del upgrade de Astro, en su propia rama, con revisión visual del sitio (dark/light mode es lo más delicado). |
| 10 | **Validación del schema de `resume.json`** | Hoy la estructura solo se respeta por convención (los agentes la leen de AGENTS.md §4). Añadir un JSON Schema o validación con zod en `npx astro check`/script previo al build. Evita que un entry mal editado rompa el render en silencio. |
| 11 | **i18n: decidir sí/no** | El `MultilanguageSelect` lleva comentado mucho tiempo. Dos caminos: (a) implementarlo con `astro:i18n` o rutas `/es` `/en`, o (b) eliminarlo y declarar el sitio EN con copy ES puntual (estado actual real). Dejar de arrastrar la duda. |
| 12 | **Lint/format unificado** | No hay prettier/eslint/biome ni `.editorconfig`. AGENTS.md pide tabs y sin comentarios, pero nada lo verifica. Un `biome` (rápido, un binario) o prettier con config resuelve consistencia entre agentes humanos y IA. |
| 13 | **SEO/OG real** | `og:image` apunta a la `photo` del CV (probablemente no ideal para OG: debería ser 1200×630). Añadir sitemap (`@astrojs/sitemap`) y revisar meta description (hoy hardcodeada en `Layout.astro`, duplica info de `resume.json`). |
| 14 | **Accesibilidad y perf** | Auditoría: contraste dark mode, `alt` en imágenes, focus states. Speed Insights ya da datos — usarlos tras el upgrade. |

### Sugerencia de secuencia

```
ahora ──▶ P0 (1 y 2 primero: CI + workflow roto)
      ──▶ P0 5 (bumps seguros) 
      ──▶ P1 6 (Astro 4→7 por pasos)   ← mayor esfuerzo
      ──▶ P2 9 (Tailwind 4)            ← después de Astro, revisión visual
      ──▶ P2 10-14 (calidad)
```

---

## 6. Reglas duras (resumen — detalle en AGENTS.md)

- **Nunca** commit/push/PR directo a `main` — todo por rama `type/###-slug`.
- El **humano** hace commit y push; el **agente** crea el PR (`gh pr create`) tras el push.
- Verificación obligatoria antes de cerrar cualquier tarea: `npm run build`.
- Tras cada tarea: `memory-update` (lessons / decisions / project-state).
- Las 3 listas de GIFs (`update-readme.js`, `src/pages/api/random-gif.ts`, `README.md`)
  **deben mantenerse sincronizadas** — nunca cambiar solo una.
- No renombrar keys de `resume.json` sin cambiar el renderer en la misma rama.
