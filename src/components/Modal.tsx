import { type ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-poke-blue-700/50 backdrop-blur-sm px-3 pb-3 sm:p-4">
      <div className="pop-in w-full sm:max-w-lg max-h-[85vh] overflow-y-auto poke-panel">
        <div className="sticky top-0 flex items-center justify-between gap-2 bg-gradient-to-r from-poke-blue-500 to-poke-blue-600 px-5 py-3 border-b-4 border-poke-blue-700 rounded-t-[0.6rem]">
          <h2 className="font-heading text-lg text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 active:scale-90 transition"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 bg-parchment">{children}</div>
      </div>
    </div>
  );
}
