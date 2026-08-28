import { create } from "zustand";
import type { CarinineId } from "../types/profile";
import { isCarinineId } from "../types/profile";
import type { InjuryId } from "../lib/injuries";
import { INJURY_IDS } from "../lib/injuries";

const STORAGE_KEY = "carininesgym_profile";

interface ProfileState {
  name: CarinineId | null;
  injuries: InjuryId[];
  setProfile: (id: CarinineId) => void;
  clear: () => void;
  toggleInjury: (id: InjuryId) => void;
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

function injuriesKey(id: CarinineId): string {
  return `carininesgym_injuries_${id}`;
}

function readStoredInjuries(id: CarinineId): InjuryId[] {
  try {
    const raw = localStorage.getItem(injuriesKey(id));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InjuryId[];
    return parsed.filter((i): i is InjuryId => INJURY_IDS.includes(i));
  } catch {
    return [];
  }
}

function writeInjuries(id: CarinineId, injuries: InjuryId[]): void {
  try {
    localStorage.setItem(injuriesKey(id), JSON.stringify(injuries));
  } catch {
    // ignore
  }
}

const initialProfile = readStoredProfile();

export const useProfileStore = create<ProfileState>((set, get) => ({
  name: initialProfile,
  injuries: initialProfile ? readStoredInjuries(initialProfile) : [],

  setProfile: (id: CarinineId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    set({ name: id, injuries: readStoredInjuries(id) });
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("appgym_profile_name");
    } catch {
      // ignore
    }
    set({ name: null, injuries: [] });
  },

  toggleInjury: (id: InjuryId) => {
    const name = get().name;
    if (!name) return;
    const current = get().injuries;
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    writeInjuries(name, next);
    set({ injuries: next });
  },
}));
