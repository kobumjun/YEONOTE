import { create } from "zustand";

type UiState = {
  /** Increment to request focus on the home dashboard prompt (Create new). */
  promptFocusNonce: number;
  requestPromptFocus: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  promptFocusNonce: 0,
  requestPromptFocus: () => set((s) => ({ promptFocusNonce: s.promptFocusNonce + 1 })),
}));
