import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HomePageComponent } from './home-page.component';
import { routes } from './app.routes';

describe('initial route', () => {
  it('renders the provisional Wayly home page at /', async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/', HomePageComponent);
    const pageElement = harness.routeNativeElement;
    const heading = pageElement?.querySelector('h1');
    const action = pageElement?.querySelector('a.button');

    expect(page).toBeInstanceOf(HomePageComponent);
    expect(heading?.textContent).toContain('Haz que tu tiempo libre');
    expect(pageElement?.querySelectorAll('h1')).toHaveLength(1);
    expect(pageElement?.querySelector('main')).not.toBeNull();
    expect(action?.textContent).toContain('Descubre Wayly');
    expect(action?.getAttribute('href')).toBe('#como-funciona');
    expect(pageElement?.querySelector('#como-funciona')).not.toBeNull();
    expect(pageElement?.textContent).toContain('Tu tiempo. Tu lugar. Tu plan.');
  });
});
