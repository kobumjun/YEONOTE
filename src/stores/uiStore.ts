import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  generateOpen: boolean;
  toggleSidebar: () => void;
  setGenerateOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  generateOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setGenerateOpen: (generateOpen) => set({ generateOpen }),
}));
