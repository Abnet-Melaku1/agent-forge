import { create } from "zustand";

/** Chrome/UI state shared across the shell (kept separate from canvas + run state). */
interface UiState {
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  /** Show the engineering grid on the editor canvas (design identity, §11). */
  showGrid: boolean;
  toggleGrid: () => void;
  /** Honor reduced-motion: gates chrome transitions/animations site-wide. */
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  reducedMotion: false,
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
}));
