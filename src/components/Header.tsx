import { NavLink } from "react-router-dom";
import { Home, Dumbbell, ListChecks, History, User } from "lucide-react";
import { useProfileStore } from "../store/profileStore";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/planes", label: "Planes", icon: ListChecks },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function Header() {
  const name = useProfileStore((s) => s.name);
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-lg border-b border-bubble-100">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-bubble-600" size={22} />
          <span className="font-heading text-bubble-700 text-lg">AppGym</span>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-heading transition ${
                  isActive
                    ? "bg-bubble-100 text-bubble-700"
                    : "text-bubble-400 hover:bg-bubble-50"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        {name && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-heading text-bubble-600">
            {name}
          </div>
        )}
      </div>
    </header>
  );
}
