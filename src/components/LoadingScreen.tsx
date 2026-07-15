import { Loader2 } from "lucide-react";

export default function LoadingScreen({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-bubble-500" size={40} />
      <p className="font-heading text-bubble-600">{label}</p>
    </div>
  );
}
