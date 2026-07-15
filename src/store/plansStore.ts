import { create } from "zustand";
import type { Plan } from "../types/plan";
import * as api from "../lib/plansApi";

interface PlansState {
  plans: Plan[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (owner: string) => Promise<void>;
  refresh: (owner: string) => Promise<void>;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  loading: false,
  loaded: false,
  error: null,

  fetch: async (owner: string) => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      await api.seedDefaultPlanIfNeeded(owner);
      const plans = await api.fetchPlans(owner);
      set({ plans, loading: false, loaded: true });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "No pude cargar tus planes",
      });
    }
  },

  refresh: async (owner: string) => {
    set({ loading: true, error: null });
    try {
      const plans = await api.fetchPlans(owner);
      set({ plans, loading: false, loaded: true });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "No pude cargar tus planes",
      });
    }
  },
}));
