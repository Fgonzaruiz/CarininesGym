import { NavLink } from "react-router-dom";
import { Home, Dumbbell, ListChecks, TrendingUp, User } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/planes", label: "Planes", icon: ListChecks },
  { to: "/progreso", label: "Evolucion", icon: TrendingUp },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t-3 border-wood-200 px-1 sm:hidden"
      style={{ borderTopWidth: 3, paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
    >
      <ul className="flex items-stretch justify-between">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-heading transition ${
                  isActive ? "text-meadow-600" : "text-gray-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1 rounded-xl transition ${isActive ? "bg-meadow-100" : ""}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
