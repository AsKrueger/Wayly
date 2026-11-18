import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { AboutPageComponent } from './about-page.component';

describe('AboutPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('explains steps, data, estimates and privacy in the selected language', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('es');
    const fixture = TestBed.createComponent(AboutPageComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toContain('Un plan que encaja contigo');
    expect(element.querySelectorAll('.about__steps li')).toHaveLength(3);
    expect(element.textContent).toContain('OpenStreetMap');
    expect(element.querySelectorAll('.about__list li')).toHaveLength(4);

    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(element.querySelector('h1')?.textContent).toContain('A plan that fits you');
    expect(element.querySelector('a.button')?.textContent).toContain('Create my plan');
  });
});
