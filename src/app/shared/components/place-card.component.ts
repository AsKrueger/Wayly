import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Place, Weekday } from '../../core/domain/models/place';
import { PLACE_CATEGORY_LABELS } from '../../core/domain/models/place-category';

@Component({
  selector: 'app-place-card',
  standalone: true,
  template: `
    <article class="place-card surface-card">
      <div class="place-card__topline">
        <span class="badge">{{ categoryLabel }}</span>
        <span class="place-card__sample">{{ dataStatusLabel }}</span>
      </div>
      <h3>{{ place.name }}</h3>
      <p>{{ place.description }}</p>
      @if (place.location) {
        <p class="place-card__location">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <path d="M16 8.3c0 4.3-6 8.8-6 8.8S4 12.6 4 8.3a6 6 0 1 1 12 0Z" stroke="currentColor" stroke-width="1.5" />
            <circle cx="10" cy="8.2" r="1.8" stroke="currentColor" stroke-width="1.5" />
          </svg>
          {{ place.location }}
        </p>
      }
      @if (place.budgetLevel || place.estimatedVisitMinutes !== undefined) {
        <p class="place-card__details">
          <span>Dato ilustrativo:</span>
          @if (place.budgetLevel) {
            {{ budgetLabel }}
          }
          @if (place.budgetLevel && place.estimatedVisitMinutes !== undefined) {
            <span aria-hidden="true">·</span>
          }
          @if (place.estimatedVisitMinutes !== undefined) {
            aprox. {{ place.estimatedVisitMinutes }} min
          }
        </p>
      }
      @if (place.openingHours?.length) {
        <ul class="place-card__hours" aria-label="Horarios">
          @for (hours of place.openingHours; track hours.weekday) {
            <li>{{ weekdayLabels[hours.weekday] }}: {{ hours.opensAt }}–{{ hours.closesAt }}</li>
          }
        </ul>
      }
    </article>
  `,
  styles: `
    .place-card {
      display: flex;
      min-height: 13rem;
      flex-direction: column;
      align-items: flex-start;
      padding: var(--space-5);
    }

    .place-card__topline {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .place-card__sample {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    h3 {
      margin: var(--space-4) 0 0;
      font-size: var(--font-size-lg);
      letter-spacing: -0.025em;
      line-height: 1.3;
    }

    p {
      margin: var(--space-2) 0 0;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .place-card__location {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-top: auto;
      padding-top: var(--space-4);
      color: var(--color-text);
      font-size: var(--font-size-xs);
      font-weight: 700;
    }

    .place-card__location svg {
      width: 1rem;
      height: 1rem;
      flex: 0 0 auto;
      color: var(--color-brand);
    }

    .place-card__details {
      margin-top: var(--space-2);
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
    }

    .place-card__details > span:first-child {
      font-weight: 700;
    }

    .place-card__hours {
      margin: var(--space-2) 0 0;
      padding-left: var(--space-4);
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceCardComponent {
  @Input({ required: true }) place!: Place;

  readonly weekdayLabels: Record<Weekday, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  get categoryLabel(): string {
    return PLACE_CATEGORY_LABELS[this.place.category];
  }

  get dataStatusLabel(): string {
    if (this.place.dataStatus === 'fictional') {
      return 'Ejemplo ficticio';
    }

    if (this.place.dataStatus === 'unverified') {
      return 'Sin verificar';
    }

    return `Verificado · ${this.place.source}`;
  }

  get budgetLabel(): string {
    const labels = {
      economical: 'Económico',
      medium: 'Medio',
      flexible: 'Flexible',
    };

    return this.place.budgetLevel ? labels[this.place.budgetLevel] : '';
  }
}
