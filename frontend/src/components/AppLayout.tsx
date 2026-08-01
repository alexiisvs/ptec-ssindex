import { useQuery } from "@tanstack/react-query";
import { Cat, Compass, Heart, TrendingUp, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi";

const navigation = [
  { to: "/app/discover", label: "Descubrir", icon: Compass },
  { to: "/app/favorites", label: "Favoritos", icon: Heart },
  { to: "/app/popular", label: "Populares", icon: TrendingUp },
  { to: "/app/account", label: "Cuenta", icon: UserRound },
];

function navigationClass({ isActive }: { isActive: boolean }) {
  return [
    "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
    isActive
      ? "bg-brand-50 text-brand-800"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
  ].join(" ");
}

export function AppLayout() {
  const { user } = useAuth();
  const api = useAuthenticatedApi();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: ({ signal }) => api.getProfile(signal),
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-zinc-100 px-6">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-700 text-white">
            <Cat size={22} />
          </span>
          <div className="min-w-0">
            <strong className="block text-base">SSCatFacts</strong>
            <span className="block text-xs text-zinc-500">
              Colección felina
            </span>
          </div>
        </div>

        <nav className="grid gap-1 p-4" aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navigationClass}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-100 px-6 py-5">
          <p className="truncate text-sm font-semibold">
            {profileQuery.data?.username || "Tu cuenta"}
          </p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-zinc-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 text-brand-800">
          <Cat size={23} />
          <strong>SSCatFacts</strong>
        </div>
      </header>

      <main className="min-h-screen pb-24 lg:ml-64 lg:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid h-18 grid-cols-4 border-t border-zinc-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navegación principal"
      >
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                isActive ? "text-brand-700" : "text-zinc-500"
              }`
            }
          >
            <Icon size={21} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
