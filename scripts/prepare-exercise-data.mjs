// Transforma el dataset original de https://github.com/hasaneyldrm/exercises-dataset
// en una version ligera (solo instrucciones en espanol) y copia las imagenes/gifs
// que usa la app. Se ejecuta una sola vez (o cuando se quiera refrescar el dataset).
//
// Uso: node scripts/prepare-exercise-data.mjs --source "C:/ruta/a/exercises-dataset"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const sourceArgIndex = args.indexOf("--source");
const sourceDir =
  sourceArgIndex !== -1 && args[sourceArgIndex + 1]
    ? path.resolve(args[sourceArgIndex + 1])
    : path.resolve(root, "..", "exercises-dataset");

const sourceJsonPath = path.join(sourceDir, "data", "exercises.json");
if (!fs.existsSync(sourceJsonPath)) {
  console.error(`No encuentro el dataset en: ${sourceJsonPath}`);
  console.error(
    'Clona https://github.com/hasaneyldrm/exercises-dataset y pasa la ruta con --source "ruta"'
  );
  process.exit(1);
}

console.log(`Leyendo dataset desde: ${sourceJsonPath}`);
const raw = JSON.parse(fs.readFileSync(sourceJsonPath, "utf8"));
console.log(`Ejercicios encontrados: ${raw.length}`);

const outDir = path.join(root, "public", "data");
const imagesOutDir = path.join(root, "public", "exercise-media", "images");
const videosOutDir = path.join(root, "public", "exercise-media", "videos");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(imagesOutDir, { recursive: true });
fs.mkdirSync(videosOutDir, { recursive: true });

let copiedImages = 0;
let copiedVideos = 0;

const slim = raw.map((ex) => {
  const imageFile = ex.image ? path.basename(ex.image) : null;
  const videoFile = ex.gif_url ? path.basename(ex.gif_url) : null;

  if (imageFile) {
    const srcImg = path.join(sourceDir, "images", imageFile);
    const destImg = path.join(imagesOutDir, imageFile);
    if (fs.existsSync(srcImg)) {
      fs.copyFileSync(srcImg, destImg);
      copiedImages++;
    }
  }
  if (videoFile) {
    const srcVid = path.join(sourceDir, "videos", videoFile);
    const destVid = path.join(videosOutDir, videoFile);
    if (fs.existsSync(srcVid)) {
      fs.copyFileSync(srcVid, destVid);
      copiedVideos++;
    }
  }

  return {
    id: ex.id,
    name: ex.name,
    category: ex.category,
    body_part: ex.body_part,
    equipment: ex.equipment,
    muscle_group: ex.muscle_group,
    secondary_muscles: ex.secondary_muscles ?? [],
    target: ex.target,
    instructions_es: ex.instructions?.es ?? ex.instructions?.en ?? "",
    steps_es: ex.instruction_steps?.es ?? ex.instruction_steps?.en ?? [],
    image: imageFile ? `exercise-media/images/${imageFile}` : null,
    gif: videoFile ? `exercise-media/videos/${videoFile}` : null,
    attribution: ex.attribution ?? "",
  };
});

fs.writeFileSync(
  path.join(outDir, "exercises.json"),
  JSON.stringify(slim),
  "utf8"
);

console.log(`Listo! Ejercicios procesados: ${slim.length}`);
console.log(`Imagenes copiadas: ${copiedImages}`);
console.log(`Gifs copiados: ${copiedVideos}`);
console.log(`JSON final: public/data/exercises.json`);
