import { NavLink } from "react-router-dom";
import { Home, Dumbbell, ListChecks, User, TrendingUp } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { CARININES } from "../types/profile";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/planes", label: "Planes", icon: ListChecks },
  { to: "/progreso", label: "Evolucion", icon: TrendingUp },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function Header() {
  const name = useProfileStore((s) => s.name);
  const profile = name ? CARININES[name] : null;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b-3 border-wood-200" style={{ borderBottomWidth: 3 }}>
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-meadow-400 to-psychic-500 flex items-center justify-center">
            <Dumbbell size={16} className="text-white" />
          </div>
          <span className="font-heading text-lg game-title">CariñinesGym</span>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-heading transition ${
                  isActive ? "bg-meadow-100 text-meadow-700" : "text-gray-500 hover:bg-wood-50"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        {profile && (
          <span className={`hidden sm:block text-sm font-heading ${name === "Knifey" ? "text-psychic-600" : "text-meadow-600"}`}>
            {profile.label}
          </span>
        )}
      </div>
    </header>
  );
}
