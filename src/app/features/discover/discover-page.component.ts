import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AvailableTime, BudgetRange } from '../../core/domain/models/discover-preferences';
import { PLACE_CATEGORY_LABELS, PlaceCategory } from '../../core/domain/models/place-category';
import {
  PlaceRecommendation,
  RecommendationReason,
  RecommendationScoreCriterion,
} from '../../core/domain/services/recommendation-engine';
import { PlaceCardComponent } from '../../shared/components/place-card.component';
import { DiscoverStore } from './state/discover-store.service';

interface PreferenceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
}

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [PlaceCardComponent],
  providers: [DiscoverStore],
  template: `
    <header class="discover-header">
      <div class="page-container discover-header__inner">
        <a class="brand" href="#inicio" aria-label="Wayly, ir al inicio">
          <span class="brand__mark" aria-hidden="true">w</span>
          <span>wayly</span>
        </a>
        <span class="badge discover-header__badge">
          <span class="discover-header__dot" aria-hidden="true"></span>
          Tu próxima idea empieza aquí
        </span>
      </div>
    </header>

    <main id="inicio" class="discover-page">
      <section class="discover-intro page-container" aria-labelledby="discover-title">
        <div class="discover-intro__copy">
          <p class="eyebrow"><span aria-hidden="true"></span> DESCUBRE A TU MANERA</p>
          <h1 id="discover-title">¿Qué te apetece <span>hacer hoy?</span></h1>
          <p>
            Elige el tipo de plan, el tiempo que tienes y tu presupuesto.
            Empezamos con ideas sencillas, pensadas para ti.
          </p>
        </div>
        <aside class="discover-intro__aside" aria-label="Sobre los lugares mostrados">
          <span class="discover-intro__aside-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3.5 14.6 9l5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </span>
          <span><strong>Recomendaciones explicables</strong><small>Coincidencias locales según tus preferencias, no resultados en tiempo real.</small></span>
        </aside>
      </section>

      <section class="discover-content page-container" aria-label="Preferencias y lugares">
        <section class="preferences-panel surface-card" aria-labelledby="preferences-title">
          <div class="preferences-panel__heading">
            <div>
              <span class="step-label">TU PLAN, A TU RITMO</span>
              <h2 id="preferences-title">Cuéntanos qué buscas</h2>
            </div>
            <span class="preferences-panel__step" aria-label="Paso 1">01</span>
          </div>

          <fieldset class="preference-group preference-group--activity">
            <legend>¿Qué tipo de actividad te apetece?</legend>
            <div class="activity-options">
              @for (option of activityOptions; track option.value) {
                <label class="activity-option" [class.activity-option--selected]="store.preferences().activityTypes.includes(option.value)">
                  <input
                    type="checkbox"
                    name="activityType"
                    [value]="option.value"
                    [checked]="store.preferences().activityTypes.includes(option.value)"
                    (change)="toggleActivityType(option.value)"
                  />
                  <span class="activity-option__icon" aria-hidden="true">{{ option.icon }}</span>
                  <span class="activity-option__label">{{ option.label }}</span>
                </label>
              }
            </div>
          </fieldset>

          <fieldset class="preference-group">
            <legend>¿Cuánto tiempo tienes?</legend>
            <div class="choice-options">
              @for (option of timeOptions; track option.value) {
                <label class="choice-option" [class.choice-option--selected]="store.preferences().availableTime === option.value">
                  <input
                    type="radio"
                    name="availableTime"
                    [value]="option.value"
                    [checked]="store.preferences().availableTime === option.value"
                    (change)="setAvailableTime(option.value)"
                  />
                  <span>{{ option.label }}</span>
                </label>
              }
            </div>
          </fieldset>

          <fieldset class="preference-group">
            <legend>¿Qué presupuesto prefieres?</legend>
            <div class="choice-options choice-options--budget">
              @for (option of budgetOptions; track option.value) {
                <label class="choice-option choice-option--budget" [class.choice-option--selected]="store.preferences().budget === option.value">
                  <input
                    type="radio"
                    name="budget"
                    [value]="option.value"
                    [checked]="store.preferences().budget === option.value"
                    (change)="setBudget(option.value)"
                  />
                  <span><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
                </label>
              }
            </div>
          </fieldset>

          <div class="preferences-summary" aria-label="Preferencias seleccionadas">
            <span class="preferences-summary__check" aria-hidden="true">✓</span>
            <span>{{ store.selectedPreferencesSummary() }}</span>
          </div>

          <button class="button preferences-panel__action" type="button" (click)="continueWithPreferences()">
            Confirmar preferencias
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <p class="action-status" role="status" aria-live="polite">
            @if (hasContinued()) {
              Estas recomendaciones corresponden a tus preferencias actuales. Cada lugar explica sus coincidencias y señala los datos que faltan.
            }
          </p>
        </section>

        <section class="places-section" aria-labelledby="places-title">
          <div class="places-heading">
            <div>
              <span class="step-label">COINCIDENCIAS EXPLICABLES</span>
              <h2 id="places-title">Recomendaciones para ti</h2>
              <p>Se excluyen las incompatibilidades conocidas; los datos ausentes se conservan y se indican.</p>
            </div>
            @if (store.catalogState().kind === 'success') {
              <span class="places-heading__count">Resultados: {{ store.resultCount() }}</span>
            }
          </div>

          @if (store.catalogState().kind === 'loading') {
            <p class="empty-message" role="status">Cargando lugares de ejemplo…</p>
          } @else if (store.catalogState().kind === 'error') {
            <div class="empty-message error-state" role="alert">
              <p>{{ store.catalogErrorMessage() }}</p>
              <button
                class="button button--secondary"
                type="button"
                (click)="retryLoading()"
                [disabled]="isRetrying()"
              >
                {{ isRetrying() ? 'Reintentando…' : 'Reintentar' }}
              </button>
            </div>
          } @else if (store.isCatalogEmpty()) {
            <p class="empty-message">Todavía no hay lugares disponibles.</p>
          } @else if (store.hasNoVisiblePlaces()) {
            <p class="empty-message">No hay lugares compatibles con estas preferencias según los datos disponibles. Prueba con otra opción.</p>
          } @else {
            <div class="place-grid">
              @for (recommendation of store.recommendations(); track recommendation.place.id) {
                <article class="recommendation">
                  <p class="recommendation__score">
                    Afinidad orientativa: {{ scoreLabel(recommendation.score) }}/100
                  </p>
                  <p class="recommendation__score-breakdown">
                    Presupuesto: {{ scoreCriterionLabel(recommendation.scoreBreakdown.budget) }} ·
                    Tiempo: {{ scoreCriterionLabel(recommendation.scoreBreakdown.duration) }}
                  </p>
                  <div
                    class="recommendation__verification"
                    [class.recommendation__verification--partial]="recommendation.verification === 'partial'"
                  >
                    {{ verificationLabel(recommendation) }}
                  </div>
                  <app-place-card [place]="recommendation.place" />
                  <ul
                    class="recommendation__reasons"
                    [attr.aria-label]="'Motivos para ' + recommendation.place.name"
                  >
                    @for (reason of recommendation.reasons; track $index) {
                      <li>{{ recommendationReasonLabel(reason) }}</li>
                    }
                  </ul>
                </article>
              }
            </div>
          }
          <p class="sample-note">
            <span aria-hidden="true">i</span>
            Las recomendaciones usan lugares ficticios. Presupuestos y duraciones son ilustrativos; una coincidencia no confirma información real del lugar.
          </p>
        </section>
      </section>
    </main>

    <footer class="discover-footer">
      <div class="page-container discover-footer__inner">
        <a class="brand brand--footer" href="#inicio" aria-label="Wayly, volver al inicio">
          <span class="brand__mark" aria-hidden="true">w</span>
          <span>wayly</span>
        </a>
        <p>Tu tiempo. Tu lugar. Tu plan.</p>
      </div>
    </footer>
  `,
  styleUrl: './discover-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverPageComponent {
  readonly store = inject(DiscoverStore);

  readonly activityOptions: readonly (PreferenceOption<PlaceCategory> & { readonly icon: string })[] = [
    { value: 'culture', label: PLACE_CATEGORY_LABELS.culture, icon: '✳' },
    { value: 'nature', label: PLACE_CATEGORY_LABELS.nature, icon: '⌁' },
    { value: 'food', label: PLACE_CATEGORY_LABELS.food, icon: '◇' },
    { value: 'leisure', label: PLACE_CATEGORY_LABELS.leisure, icon: '☼' },
  ];

  readonly timeOptions: readonly PreferenceOption<AvailableTime>[] = [
    { value: 'one-hour', label: '1 hora' },
    { value: 'two-hours', label: '2 horas' },
    { value: 'half-day', label: 'Medio día' },
  ];

  readonly budgetOptions: readonly PreferenceOption<BudgetRange>[] = [
    { value: 'economical', label: 'Económico', description: 'Gastar poco' },
    { value: 'medium', label: 'Medio', description: 'Un punto intermedio' },
    { value: 'flexible', label: 'Flexible', description: 'Tengo margen' },
  ];

  readonly hasContinued = signal(false);
  readonly isRetrying = signal(false);

  toggleActivityType(activityType: PlaceCategory): void {
    this.store.toggleActivityType(activityType);
    this.hasContinued.set(false);
  }

  setAvailableTime(availableTime: AvailableTime): void {
    this.store.setAvailableTime(availableTime);
    this.hasContinued.set(false);
  }

  setBudget(budget: BudgetRange): void {
    this.store.setBudget(budget);
    this.hasContinued.set(false);
  }

  async retryLoading(): Promise<void> {
    this.isRetrying.set(true);
    this.hasContinued.set(false);
    try {
      await this.store.retryLoading();
    } finally {
      this.isRetrying.set(false);
    }
  }

  continueWithPreferences(): void {
    this.hasContinued.set(true);
  }

  verificationLabel(recommendation: PlaceRecommendation): string {
    return recommendation.verification === 'complete'
      ? 'Compatible según los datos disponibles'
      : 'Faltan datos para comprobar todo';
  }

  scoreLabel(score: number): number {
    return Math.round(score);
  }

  scoreCriterionLabel(criterion: RecommendationScoreCriterion): string {
    if (criterion.status === 'unknown') {
      return `sin datos (0/${criterion.maximumPoints} puntos)`;
    }

    return `${Number(criterion.points.toFixed(1))}/${criterion.maximumPoints} puntos`;
  }

  recommendationReasonLabel(reason: RecommendationReason): string {
    switch (reason.type) {
      case 'category-match':
        return `Coincide con la categoría ${PLACE_CATEGORY_LABELS[reason.category]}.`;
      case 'category-unfiltered':
        return 'No se aplicó un filtro de categoría.';
      case 'budget-compatible':
        return `Presupuesto ${this.budgetLabel(reason.placeLevel)} dentro de tu límite ${this.budgetLabel(reason.maximum)}.`;
      case 'budget-unknown':
        return 'No hay datos de presupuesto para comprobar esta preferencia.';
      case 'duration-compatible':
        return `Duración estimada de ${reason.estimatedMinutes} min dentro de tus ${reason.availableMinutes} min disponibles.`;
      case 'duration-unknown':
        return 'No hay datos de duración para comprobar esta preferencia.';
    }
  }

  private budgetLabel(budget: BudgetRange): string {
    return {
      economical: 'económico',
      medium: 'medio',
      flexible: 'flexible',
    }[budget];
  }
}
