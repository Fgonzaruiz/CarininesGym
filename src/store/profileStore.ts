import { create } from "zustand";

const STORAGE_KEY = "appgym_profile_name";

interface ProfileState {
  name: string | null;
  setName: (name: string) => void;
  clear: () => void;
}

function readStoredName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const useProfileStore = create<ProfileState>((set) => ({
  name: readStoredName(),

  setName: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // localStorage no disponible, seguimos solo con el estado en memoria
    }
    set({ name: trimmed });
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ name: null });
  },
}));
