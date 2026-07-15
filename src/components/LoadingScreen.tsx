import { Loader2 } from "lucide-react";

export default function LoadingScreen({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="game-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="poke-panel p-6 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-poke-blue-500" size={36} />
        <p className="font-heading text-wood-600">{label}</p>
      </div>
    </div>
  );
}
