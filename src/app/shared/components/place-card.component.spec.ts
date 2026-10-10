import { TestBed } from '@angular/core/testing';
import { Place } from '../../core/domain/models/place';
import { PlaceCardComponent } from './place-card.component';

describe('PlaceCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlaceCardComponent],
    });
  });

  it('renders available place details and optional hours', async () => {
    const place: Place = {
      id: 'complete-demo-place',
      name: 'Jardín de Ejemplo',
      description: 'Un lugar ficticio para comprobar los detalles opcionales.',
      category: 'nature',
      location: 'Zona de demostración',
      coordinates: { latitude: 40.1, longitude: -3.7 },
      budgetLevel: 'economical',
      estimatedVisitMinutes: 60,
      openingHours: [{ weekday: 'monday', opensAt: '09:00', closesAt: '17:00' }],
      source: 'fixture-test',
      dataStatus: 'fictional',
    };

    const fixture = TestBed.createComponent(PlaceCardComponent);
    fixture.componentRef.setInput('place', place);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Naturaleza');
    expect(fixture.nativeElement.textContent).toContain('Ejemplo ficticio');
    expect(fixture.nativeElement.textContent).toContain('Zona de demostración');
    expect(fixture.nativeElement.textContent).toContain('Económico');
    expect(fixture.nativeElement.textContent).toContain('aprox. 60 min');
    expect(fixture.nativeElement.textContent).toContain('Lunes: 09:00–17:00');
    expect(fixture.nativeElement.textContent).not.toContain('undefined');
  });

  it('renders partial places without fabricated or undefined fields', async () => {
    const place: Place = {
      id: 'partial-demo-place',
      name: 'Mirador de Ejemplo',
      description: 'Una ficha con información parcial.',
      category: 'nature',
      source: 'fixture-test',
      dataStatus: 'fictional',
    };

    const fixture = TestBed.createComponent(PlaceCardComponent);
    fixture.componentRef.setInput('place', place);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Mirador de Ejemplo');
    expect(fixture.nativeElement.textContent).toContain('Ejemplo ficticio');
    expect(fixture.nativeElement.querySelector('.place-card__location')).toBeNull();
    expect(fixture.nativeElement.querySelector('.place-card__details')).toBeNull();
    expect(fixture.nativeElement.querySelector('.place-card__hours')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('undefined');
  });

  it.each([
    ['unverified', 'Sin verificar'],
    ['verified', 'Verificado · trusted-source'],
  ] as const)('labels %s provenance explicitly', async (dataStatus, expectedLabel) => {
    const place: Place = {
      id: `place-${dataStatus}`,
      name: 'Lugar con procedencia',
      description: 'Ficha usada para comprobar la procedencia.',
      category: 'culture',
      source: dataStatus === 'verified' ? 'trusted-source' : 'unverified-source',
      dataStatus,
    };
    const fixture = TestBed.createComponent(PlaceCardComponent);
    fixture.componentRef.setInput('place', place);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(expectedLabel);
  });
});
