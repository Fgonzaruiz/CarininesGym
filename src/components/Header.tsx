import { NavLink } from "react-router-dom";
import { Home, Dumbbell, ListChecks, User, TrendingUp } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { CARININES } from "../types/profile";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/planes", label: "Planes", icon: ListChecks },
  { to: "/progreso", label: "Progreso", icon: TrendingUp },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function Header() {
  const name = useProfileStore((s) => s.name);
  const profile = name ? CARININES[name] : null;

  return (
    <header
      className="sticky top-0 z-30 game-menu-bar border-b-4"
      style={{ borderBottomWidth: 4 }}
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-meadow-400 to-poke-blue-500 flex items-center justify-center border-2 border-white shadow-sm">
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
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-heading transition border-2 ${
                  isActive
                    ? "bg-meadow-100 text-meadow-700 border-meadow-300"
                    : "text-wood-500 border-transparent hover:bg-parchment hover:border-wood-200"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        {profile && (
          <span
            className={`hidden sm:block text-sm font-heading px-2 py-0.5 rounded-lg border-2 ${
              name === "Knifey"
                ? "bg-psychic-50 text-psychic-700 border-psychic-200"
                : "bg-meadow-50 text-meadow-700 border-meadow-200"
            }`}
          >
            {profile.label}
          </span>
        )}
      </div>
    </header>
  );
}
