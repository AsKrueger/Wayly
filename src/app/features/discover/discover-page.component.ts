import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PlaceCatalog } from '../../core/application/ports/place-catalog';
import { AvailableTime, BudgetRange, DiscoverPreferences } from '../../core/domain/models/discover-preferences';
import { Place } from '../../core/domain/models/place';
import { PLACE_CATEGORY_LABELS, PlaceCategory } from '../../core/domain/models/place-category';
import { PlaceCardComponent } from '../../shared/components/place-card.component';

interface PreferenceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
}

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [PlaceCardComponent],
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
          <span><strong>Ideas para inspirarte</strong><small>Los lugares son ejemplos locales, no resultados en tiempo real.</small></span>
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
                <label class="activity-option" [class.activity-option--selected]="preferences().activityType === option.value">
                  <input
                    type="radio"
                    name="activityType"
                    [value]="option.value"
                    [checked]="preferences().activityType === option.value"
                    (change)="setActivityType(option.value)"
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
                <label class="choice-option" [class.choice-option--selected]="preferences().availableTime === option.value">
                  <input
                    type="radio"
                    name="availableTime"
                    [value]="option.value"
                    [checked]="preferences().availableTime === option.value"
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
                <label class="choice-option choice-option--budget" [class.choice-option--selected]="preferences().budget === option.value">
                  <input
                    type="radio"
                    name="budget"
                    [value]="option.value"
                    [checked]="preferences().budget === option.value"
                    (change)="setBudget(option.value)"
                  />
                  <span><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
                </label>
              }
            </div>
          </fieldset>

          <div class="preferences-summary" aria-label="Preferencias seleccionadas">
            <span class="preferences-summary__check" aria-hidden="true">✓</span>
            <span>{{ selectedPreferencesSummary() }}</span>
          </div>

          <button class="button preferences-panel__action" type="button" (click)="continueWithPreferences()">
            Explorar con estas preferencias
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <p class="action-status" role="status" aria-live="polite">
            @if (hasContinued()) {
              Tus preferencias están listas. Las recomendaciones personalizadas aún no están disponibles; los lugares mostrados son solo ejemplos.
            }
          </p>
        </section>

        <section class="places-section" aria-labelledby="places-title">
          <div class="places-heading">
            <div>
              <span class="step-label">UNA PRIMERA INSPIRACIÓN</span>
              <h2 id="places-title">Algunas ideas para empezar</h2>
              <p>Una pequeña muestra para explorar posibilidades, no recomendaciones personalizadas.</p>
            </div>
            <span class="places-heading__count">{{ filteredPlaces().length }} ejemplos</span>
          </div>

          @if (placesError()) {
            <p class="empty-message" role="alert">{{ placesError() }}</p>
          } @else if (isLoadingPlaces()) {
            <p class="empty-message" role="status">Cargando lugares de ejemplo…</p>
          } @else {
            <div class="place-grid">
              @for (place of filteredPlaces(); track place.id) {
                <app-place-card [place]="place" />
              } @empty {
                <p class="empty-message">No hay lugares de ejemplo para esta categoría todavía.</p>
              }
            </div>
          }
          <p class="sample-note">
            <span aria-hidden="true">i</span>
            Los lugares son ficticios. Presupuesto y duración, cuando aparecen, son datos ilustrativos; horarios y ubicación exacta no están disponibles.
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
  private readonly placeCatalog = inject(PlaceCatalog);
  private readonly places = signal<readonly Place[]>([]);

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

  readonly preferences = signal<DiscoverPreferences>({
    activityType: 'culture',
    availableTime: 'two-hours',
    budget: 'economical',
  });
  readonly hasContinued = signal(false);
  readonly isLoadingPlaces = signal(true);
  readonly placesError = signal<string | null>(null);
  readonly filteredPlaces = computed(() =>
    this.places().filter((place) => place.category === this.preferences().activityType),
  );
  readonly selectedPreferencesSummary = computed(() => {
    const current = this.preferences();
    const activity = this.activityOptions.find((option) => option.value === current.activityType)?.label;
    const time = this.timeOptions.find((option) => option.value === current.availableTime)?.label;
    const budget = this.budgetOptions.find((option) => option.value === current.budget)?.label;

    return `${activity} · ${time} · Presupuesto ${budget}`;
  });

  constructor() {
    void this.loadPlaces();
  }

  private async loadPlaces(): Promise<void> {
    this.isLoadingPlaces.set(true);
    this.placesError.set(null);

    try {
      this.places.set(await this.placeCatalog.getAll());
    } catch (error: unknown) {
      console.error('Unable to load places for Discover.', error);
      this.placesError.set('No se pudieron cargar los lugares de ejemplo. Inténtalo de nuevo más tarde.');
    } finally {
      this.isLoadingPlaces.set(false);
    }
  }

  setActivityType(activityType: PlaceCategory): void {
    this.preferences.update((current) => ({ ...current, activityType }));
    this.hasContinued.set(false);
  }

  setAvailableTime(availableTime: AvailableTime): void {
    this.preferences.update((current) => ({ ...current, availableTime }));
    this.hasContinued.set(false);
  }

  setBudget(budget: BudgetRange): void {
    this.preferences.update((current) => ({ ...current, budget }));
    this.hasContinued.set(false);
  }

  continueWithPreferences(): void {
    this.hasContinued.set(true);
  }
}
