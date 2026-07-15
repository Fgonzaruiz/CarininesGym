# CariñinesGym

Una app personal de entrenamiento, kawaii y girlie, hecha para dos. Planes de
entrenamiento detallados, más de 1300 ejercicios con gif e instrucciones en
español, sustitución de ejercicios cuando algo duele, y todo guardado en la
nube con Supabase. Pensada para usarse sobre todo desde el móvil. Sin
registro ni contraseñas: cada persona simplemente escribe su nombre una vez
en su dispositivo.

## Qué incluye

- **Sin login**: al abrir la app por primera vez eliges tu nombre (se guarda
  en el propio dispositivo) y con eso ya puedes entrenar.
- **Plan por defecto "Fase Mewtwo"** — se crea solo la primera vez que
  alguien entra: 4 días (cinta, abdomen, gemelos y piernas en general)
  pensado para entrenar piernas mientras el codo está tocado.
- **Planes de entrenamiento propios**: crea planes, añade días, añade
  ejercicios desde el catálogo completo, edita series/reps/descanso/notas.
- **Sustituir un ejercicio** si te duele o no te gusta — se guarda
  permanentemente en ese hueco del plan (y puedes restaurar el original
  cuando quieras).
- **Catálogo de +1300 ejercicios** con imagen, gif animado, músculos e
  instrucciones paso a paso en español.
- **Modo entrenamiento**: marca series, apunta reps/peso, termina el entreno
  y queda en tu historial.
- **Historial** de entrenos completados.
- Diseño **mobile-first**, azul + morado, tema girlie ("yaaaas queen" y
  compañía, sin emojis) y pensado para instalarse en el móvil como app
  (Add to Home Screen).

## Stack

- [Vite](https://vite.dev) + React 19 + TypeScript
- Tailwind CSS v4
- React Router (HashRouter, para que funcione en GitHub Pages sin backend)
- Zustand para estado global
- [Supabase](https://supabase.com) (solo Postgres, sin Auth) como backend
- Dataset de ejercicios de [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
  (imágenes y gifs © [Gym visual](https://gymvisual.com/))

## Cómo funciona sin login

No hay usuarios ni contraseñas de verdad: la primera vez que se abre la app
en un dispositivo se pide un nombre, que queda guardado en el navegador
(`localStorage`) y se usa como identificador (`owner`) de los planes y
entrenos de esa persona en Supabase. Si tú y tu novia usáis dispositivos
distintos, cada una/o ve solo lo suyo de forma natural. Si compartís el
mismo dispositivo, desde **Perfil → Cambiar de persona** se puede cambiar de
nombre en cualquier momento.

Importante: como no hay autenticación real, las tablas de Supabase quedan
accesibles con la clave pública (`anon`/`publishable key`). Es un
compromiso consciente para poder usar la app sin registrarse — no compartas
la URL de tu despliegue ni tu clave pública fuera de quienes deban usarla.

## Empezar en local

```bash
npm install
cp env.example .env.local   # y pon tus claves de Supabase (ver abajo)
npm run dev
```

Abre `http://localhost:5173`.

Si no configuras Supabase todavía, la app arranca igual y te avisa en
pantalla — pero no podrá guardar nada hasta conectarlo.

## Configurar Supabase (una sola vez)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y pega/ejecuta todo el contenido de
   [`supabase/schema.sql`](supabase/schema.sql). Esto crea las tablas
   (`plans`, `plan_days`, `plan_exercises`, `workout_sessions`,
   `workout_set_logs`) con políticas abiertas (no hay Auth, así que no se
   filtra por usuario a nivel de base de datos).
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - la clave pública (`anon` / `publishable`) → `VITE_SUPABASE_ANON_KEY`

   **Nunca** uses la `service_role` / `secret key` en este proyecto: es una
   app estática que corre en el navegador, así que cualquier clave que le
   pongas queda visible para quien abra la página. Solo la clave pública
   (`anon`/`publishable`) es segura de usar aquí.
4. Pégalas en tu `.env.local` (o en los *secrets* de GitHub Actions, ver
   abajo).

## Actualizar el dataset de ejercicios

El catálogo ya viene incluido en `public/data/exercises.json` (versión
recortada solo en español, ~1.8 MB) y las imágenes/gifs en
`public/exercise-media/`. Si algún día quieres refrescarlo desde el
repositorio original:

```bash
git clone https://github.com/hasaneyldrm/exercises-dataset ../exercises-dataset
npm run prepare-data -- --source "../exercises-dataset"
```

## Desplegar en GitHub Pages

### Opción A - GitHub Actions (recomendada, automática)

1. Sube este proyecto a un repositorio de GitHub.
2. En **Settings → Pages**, en "Build and deployment" elige **Source:
   GitHub Actions**.
3. En **Settings → Secrets and variables → Actions**, añade dos *secrets*:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz push a `main`. El workflow en
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila y
   publica automáticamente. Tu app quedará en
   `https://fgonzaruiz.github.io/CarininesGym/`.

### Opción B - manual con `gh-pages`

```bash
npm run deploy
```

Esto compila y publica la carpeta `dist` en la rama `gh-pages` (necesitas
tener configurado el remoto `origin` de tu repo y Pages apuntando a esa
rama). Recuerda tener `.env.local` con tus claves antes de compilar.

La app usa una base relativa (`base: "./"`) y `HashRouter`, así que
funciona igual sin importar el nombre de tu repositorio ni si está en la
raíz o en un subpath.

## Instalarla en el móvil

Abre la URL de GitHub Pages desde el navegador del móvil y usa "Añadir a
pantalla de inicio" (iOS Safari) o "Instalar app" (Android Chrome) — tiene
manifest y iconos listos para eso.

## Estructura

```
src/
  components/   componentes reutilizables (modales, cards, nav...)
  pages/        pantallas (Home, Planes, Ejercicios, Entreno, Historial...)
  lib/          cliente Supabase + funciones de acceso a datos
  store/        estado global (perfil local, planes) con Zustand
  data/         plan semilla "Fase Mewtwo"
  types/        tipos TypeScript
public/
  data/exercises.json          catálogo de ejercicios (recortado a ES)
  exercise-media/images|videos thumbnails y gifs de cada ejercicio
supabase/
  schema.sql    esquema completo listo para pegar en Supabase
scripts/
  prepare-exercise-data.mjs    regenera el dataset desde el repo original
```

## Créditos

Datos e imágenes de ejercicios de
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
(MIT + media © [Gym visual](https://gymvisual.com/), usada con permiso).
Mantén la atribución si compartes o modificas este proyecto.

Hecho para entrenar en pareja. Yaaaas queen, a por esas piernotas.
