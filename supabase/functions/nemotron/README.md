# Edge Function `nemotron` — Asistente de molestias (NVIDIA Nemotron)

Proxy entre la app y la API de NVIDIA NIM (`https://integrate.api.nvidia.com/v1`).
La API key de NVIDIA vive **solo aquí**, nunca en el navegador ni en el bundle
de GitHub Pages.

## Qué hace

- `action: "injuries"` — recibe un mensaje libre ("me duele el hombro al hacer
  press") y devuelve `{ injuries: [...], explanation }` con los ids de zona que
  entiende la app: `muneca, codo, hombro, rodilla, espalda_baja, cuello`.
- `action: "pick"` — dado un ejercicio que molesta y una lista de candidatas
  seguras del catálogo, elige la mejor y explica por qué. Nunca devuelve un id
  que no esté en la lista enviada.

La app combina ambos: primero detecta la molestia, después sustituye los
ejercicios del día que la cargan. Todo se muestra al usuario y se aplica solo
con su confirmación.

## Modelo

Por defecto usa `nvidia/nemotron-3.5-lightning-30b-a3b` (rápido y barato).
Si tu key no tiene acceso a ese modelo, configura otro con el secreto
`NEMOTRON_MODEL` (por ejemplo `nvidia/nemotron-4-340b-instruct`).
El ID exacto está en la página del modelo en build.nvidia.com.

## Desplegar (una vez, cuando tengas la key)

```bash
# 1. Vincula el proyecto (te pedirá el project ref de Supabase)
supabase link --project-ref TU_PROJECT_REF

# 2. Guarda los secrets (la key de NVIDIA empieza por nvapi-)
supabase secrets set NEMOTRON_API_KEY=nvapi-TU_CLAVE
supabase secrets set NEMOTRON_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b

# 3. Publica la función
supabase functions deploy nemotron
```

Probar localmente (`supabase functions serve` requiere tener deno instalado).

## Seguridad (lee esto)

- La puerta actual exige la anon key de Supabase en `Authorization`. Esa clave
  ya es pública en el bundle de la app, así que cualquiera que la conozca
  podría gastar tus créditos de NVIDIA llamando a la función. Para un uso
  personal es suficiente; si algún día lo compartes en público, añade login de
  usuario (Supabase Auth) y valida el JWT del usuario en la función.
- CORS está abierto (`*`) porque el sitio se sirve desde GitHub Pages.
- La función nunca guarda ni registra los mensajes del usuario.