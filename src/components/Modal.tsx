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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bubble-700/40 backdrop-blur-sm px-3 pb-3 sm:p-4">
      <div className="pop-in w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-bubble-200 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-2 bg-white/95 backdrop-blur px-5 py-4 border-b border-bubble-100 rounded-t-3xl">
          <h2 className="font-heading text-lg text-bubble-700">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-bubble-50 text-bubble-500 hover:bg-bubble-100 active:scale-90 transition"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
