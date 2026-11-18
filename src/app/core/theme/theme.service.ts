import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { LocalStore } from '../storage/local-store.service';

export type ThemeMode = 'auto' | 'light' | 'dark';

const MODES: readonly ThemeMode[] = ['auto', 'light', 'dark'];
const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(LocalStore);
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    effect(() => {
      const mode = this.mode();
      const root = this.document.documentElement;
      if (mode === 'auto') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', mode);
      }
    });
  }

  /** Cycles automatic → dark → light → automatic. */
  cycle(): void {
    const next: Record<ThemeMode, ThemeMode> = { auto: 'dark', dark: 'light', light: 'auto' };
    this.setMode(next[this.mode()]);
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.store.write(STORAGE_KEY, mode);
  }

  private initialMode(): ThemeMode {
    const saved = this.store.read<string>(STORAGE_KEY);
    return (MODES as readonly (string | null)[]).includes(saved) ? (saved as ThemeMode) : 'auto';
  }
}
