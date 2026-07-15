import { create } from "zustand";
import type { CarinineId } from "../types/profile";
import { isCarinineId } from "../types/profile";

const STORAGE_KEY = "carininesgym_profile";

interface ProfileState {
  name: CarinineId | null;
  setProfile: (id: CarinineId) => void;
  clear: () => void;
}

function readStoredProfile(): CarinineId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("appgym_profile_name");
    if (isCarinineId(raw)) return raw;
    if (raw?.toLowerCase() === "knifey") return "Knifey";
    if (raw?.toLowerCase() === "forky") return "Forky";
    return null;
  } catch {
    return null;
  }
}

export const useProfileStore = create<ProfileState>((set) => ({
  name: readStoredProfile(),

  setProfile: (id: CarinineId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    set({ name: id });
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("appgym_profile_name");
    } catch {
      // ignore
    }
    set({ name: null });
  },
}));
