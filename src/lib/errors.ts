/**
 * Convierte un error desconocido (Supabase, fetch, etc.) en un mensaje
 * legible para mostrar al usuario.
 */
export function describeError(err: unknown): string {
  let message: string;
  if (err instanceof Error && err.message) {
    message = err.message;
  } else if (typeof err === "string") {
    message = err;
  } else {
    message = "Error desconocido.";
  }

  // Si la base de datos está desactualizada (faltan columnas de migraciones
  // nuevas), da la pista para arreglarla de una vez.
  if (/does not exist|no existe la columna|undefined column/i.test(message)) {
    return `${message} Parece que la base de datos está desactualizada: abre Supabase → SQL Editor y vuelve a ejecutar supabase/schema.sql.`;
  }

  return message;
}