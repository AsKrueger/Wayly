import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { AppComponent } from './app.component';
import { I18nService } from './core/i18n/i18n.service';
import { TranslatedTitleStrategy } from './core/i18n/translated-title.strategy';
import { ThemeService } from './core/theme/theme.service';

@Component({ template: '<p>page</p>' })
class StubPageComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: '', component: StubPageComponent, title: 'titles.home' },
          { path: 'about', component: StubPageComponent, title: 'titles.about' },
        ]),
        { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('es');
  });

  it('renders the shell with skip link, navigation, outlet and attribution', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.skip-link')?.textContent).toContain('Saltar al contenido');
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('nav')?.textContent).toContain('Cómo funciona');
    expect(element.querySelector('footer')?.textContent).toContain('OpenStreetMap');
  });

  it('switches the whole shell to English', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const english = [...fixture.nativeElement.querySelectorAll('.lang-switch button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'EN',
    ) as HTMLButtonElement;

    english.click();
    fixture.detectChanges();

    expect(english.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('nav').textContent).toContain('How it works');
    expect(fixture.nativeElement.querySelector('.skip-link').textContent).toContain('Skip to content');
  });

  it('cycles the theme from the header button', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.icon-button');

    expect(button.getAttribute('aria-label')).toBe('Tema: automático. Cambiar');
    button.click();
    fixture.detectChanges();

    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Tema: oscuro. Cambiar');
  });

  it('translates the document title with the route and the language', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await TestBed.inject(Router).navigateByUrl('/about');
    fixture.detectChanges();
    TestBed.tick();
    const title = TestBed.inject(Title);

    expect(title.getTitle()).toBe('Cómo funciona · Wayly');
    TestBed.inject(I18nService).setLanguage('en');
    TestBed.tick();
    expect(title.getTitle()).toBe('How it works · Wayly');
  });
});
