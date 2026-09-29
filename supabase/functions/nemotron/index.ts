// Edge Function de Supabase que habla con la API de NVIDIA Nemotron.
// La API key de NVIDIA vive aquí (secreto de función), nunca en el navegador.
//
// Secrets (supabase secrets set ...):
//   NEMOTRON_API_KEY=nvapi-...          (obligatoria)
//   NEMOTRON_MODEL=<modelo>             (opcional; default abajo)
//
// Ver como funciona: supabase/functions/nemotron/README.md

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"

// Zonas que la app entiende (mismas que src/lib/injuries.ts)
const INJURY_IDS = [
  "muneca",
  "codo",
  "hombro",
  "rodilla",
  "espalda_baja",
  "cuello",
] as const

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const INJURIES_SYSTEM_PROMPT = `Eres el entrenador IA de una app de gimnasio (CariñinesGym).
El usuario describe una molestia o dolor en lenguaje natural (en español). Debes interpretar qué articulación o zona le duele y responder SOLO con JSON válido, sin texto fuera del JSON, con este esquema:
{ "injuries": ["..."], "explanation": "frase corta en español con lo que has entendido" }

Reglas:
- "injuries" solo puede contener estos ids exactos (minúsculas y guion bajo): muneca, codo, hombro, rodilla, espalda_baja, cuello.
- Si menciona varias zonas doloridas, inclúyelas todas.
- No inventes lesiones que el usuario no ha mencionado.
- Si el dolor no encaja en ninguna zona (p. ej. "me duele la cabeza"), devuelve "injuries": [] y explica brevemente que no puedes adaptar el entreno para eso.
- Si habla de que ya está recuperado o sin molestias, devuelve "injuries": [].`

const PICK_SYSTEM_PROMPT = `Eres el entrenador IA de una app de gimnasio (CariñinesGym).
El usuario tiene una molestia y hay que sustituir un ejercicio del entreno de hoy por una alternativa segura de su catálogo.
Te paso: el mensaje del usuario, el ejercicio que molesta, y una lista de candidatas (id y nombre). Elige la mejor candidata para alguien con esa molestia y responde SOLO con JSON válido, sin texto fuera del JSON:
{ "exerciseId": "<id de la candidata elegida>", "reason": "frase muy corta en español explicando el porqué" }

Reglas:
- "exerciseId" DEBE ser uno de los ids de la lista de candidatas. Nunca inventes un id.
- Prioriza máquinas, poleas, bandas y peso corporal sobre barras y mancuernas cuando la molestia lo pida.
- Si ninguna candidata es ideal, elige igualmente la menos mala y explícalo.`

interface ChatMessage {
  role: "system" | "user"
  content: string
}

interface ExerciseStub {
  name: string
  bodyPart: string
  equipment: string
  target: string
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

/** Retorna el primer objeto JSON que encuentre en la respuesta del modelo. */
function parseJson(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>
  } catch {
    // cae al regex
  }
  const match = content.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>
    } catch {
      // se devuelve vacío abajo
    }
  }
  return {}
}

async function callNim(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  useJsonMode: boolean,
  maxTokens: number
): Promise<string> {
  const res = await fetch(NIM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
      ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    const snippet = text.slice(0, 300)
    if (res.status === 401) {
      throw new Error(`NVIDIA rechazó la API key (401). Revisa NEMOTRON_API_KEY. ${snippet}`)
    }
    if (res.status === 403 || res.status === 400) {
      throw new Error(
        `NVIDIA rechazó el modelo (${res.status}). Revisa NEMOTRON_MODEL en los secrets de la función (default: ${DEFAULT_MODEL}). ${snippet}`
      )
    }
    throw new Error(`La API de NVIDIA falló (${res.status}). ${snippet}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>
  }
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("NVIDIA no devolvió respuesta.")
  }
  return content
}

async function chatJson(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<Record<string, unknown>> {
  try {
    return parseJson(await callNim(apiKey, model, messages, true, maxTokens))
  } catch (err) {
    // Algunos modelos no soportan response_format json_object: reintenta sin él.
    if (err instanceof Error && err.message.includes("(400)")) {
      return parseJson(await callNim(apiKey, model, messages, false, maxTokens))
    }
    throw err
  }
}

async function handleInjuries(
  apiKey: string,
  model: string,
  body: Record<string, unknown>
): Promise<Response> {
  const message = body.message
  if (typeof message !== "string" || !message.trim()) {
    return jsonResponse(400, { error: "Falta el campo message." })
  }

  const parsed = await chatJson(apiKey, model, [
    { role: "system", content: INJURIES_SYSTEM_PROMPT },
    {
      role: "user",
      content: `El usuario dice: "${message.trim().slice(0, 500)}"`,
    },
  ], 250)

  const rawInjuries = parsed.injuries
  const injuries = Array.isArray(rawInjuries)
    ? rawInjuries.filter(
        (id): id is string =>
          typeof id === "string" && (INJURY_IDS as readonly string[]).includes(id)
      )
    : []
  const explanation =
    typeof parsed.explanation === "string" ? parsed.explanation.slice(0, 300) : ""

  // Sin duplicados, solo ids conocidos
  return jsonResponse(200, { injuries: [...new Set(injuries)], explanation })
}

async function handlePick(
  apiKey: string,
  model: string,
  body: Record<string, unknown>
): Promise<Response> {
  const message = body.message
  const exercise = body.exercise
  const candidates = body.candidates

  if (typeof message !== "string" || !message.trim()) {
    return jsonResponse(400, { error: "Falta el campo message." })
  }
  if (!exercise || typeof exercise !== "object") {
    return jsonResponse(400, { error: "Falta el campo exercise." })
  }
  if (
    !Array.isArray(candidates) ||
    candidates.length === 0 ||
    !candidates.every(
      (c) =>
        c &&
        typeof c === "object" &&
        typeof (c as { id?: unknown }).id === "string" &&
        typeof (c as { name?: unknown }).name === "string"
    )
  ) {
    return jsonResponse(400, { error: "Falta el campo candidates." })
  }

  const allowedIds = new Set(
    (candidates as Array<{ id: string }>).map((c) => c.id)
  )

  const parsed = await chatJson(apiKey, model, [
    { role: "system", content: PICK_SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        mensajeDelUsuario: message.trim().slice(0, 500),
        ejercicioQueMolesta: exercise as ExerciseStub,
        candidatas: candidates,
      }),
    },
  ], 300)

  const chosenId = parsed.exerciseId
  const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 300) : ""

  // Nunca devolver un id que no venga del catálogo de la app
  if (typeof chosenId !== "string" || !allowedIds.has(chosenId)) {
    const fallback = (candidates as Array<{ id: string; name: string }>)[0]
    return jsonResponse(200, {
      exerciseId: fallback.id,
      reason: "Mejor opción segura disponible.",
    })
  }

  return jsonResponse(200, { exerciseId: chosenId, reason })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Método no permitido." })
  }

  // Puerta básica: exige la misma anon key que ya usa la app. (Para una
  // protección fuerte habría que añadir login de usuario; ver README.)
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const auth = req.headers.get("Authorization")
  if (!anonKey || auth !== `Bearer ${anonKey}`) {
    return jsonResponse(401, { error: "No autorizado." })
  }

  const apiKey = Deno.env.get("NEMOTRON_API_KEY")
  if (!apiKey) {
    return jsonResponse(500, {
      error:
        "Falta NEMOTRON_API_KEY en los secrets de la función. Mira supabase/functions/nemotron/README.md",
    })
  }
  const model = Deno.env.get("NEMOTRON_MODEL") || DEFAULT_MODEL

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: "JSON inválido." })
  }

  try {
    if (body.action === "injuries") return await handleInjuries(apiKey, model, body)
    if (body.action === "pick") return await handlePick(apiKey, model, body)
    return jsonResponse(400, {
      error: 'Acción desconocida. Usa action: "injuries" o action: "pick".',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido."
    return jsonResponse(502, { error: message })
  }
})