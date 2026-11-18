import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('starts in automatic mode without forcing a theme', () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.mode()).toBe('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('cycles automatic → dark → light → automatic and persists the choice', () => {
    const theme = TestBed.inject(ThemeService);
    theme.cycle();
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    theme.cycle();
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('wayly.theme')).toBe('"light"');
    theme.cycle();
    TestBed.tick();
    expect(theme.mode()).toBe('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('restores a saved mode and ignores invalid ones', () => {
    localStorage.setItem('wayly.theme', '"dark"');
    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
  });

  it('ignores an invalid saved mode', () => {
    localStorage.setItem('wayly.theme', '"purple"');
    expect(TestBed.inject(ThemeService).mode()).toBe('auto');
  });
});
