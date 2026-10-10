import { computed, inject, Injectable, signal } from '@angular/core';
import { PlaceCatalog } from '../../../core/application/ports/place-catalog';
import { AvailableTime, BudgetRange, DiscoverPreferences } from '../../../core/domain/models/discover-preferences';
import { Place } from '../../../core/domain/models/place';
import { PLACE_CATEGORY_LABELS, PlaceCategory } from '../../../core/domain/models/place-category';
import { PlaceRecommendation, recommendPlaces } from '../../../core/domain/services/recommendation-engine';

export type PlaceCatalogState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'success'; readonly places: readonly Place[] }
  | { readonly kind: 'error'; readonly message: string };

const INITIAL_PREFERENCES: DiscoverPreferences = {
  activityTypes: ['culture'],
  availableTime: 'two-hours',
  budget: 'economical',
};

@Injectable()
export class DiscoverStore {
  private readonly placeCatalog = inject(PlaceCatalog);
  private readonly catalogStateSource = signal<PlaceCatalogState>({ kind: 'loading' });
  private readonly preferencesSource = signal<DiscoverPreferences>(INITIAL_PREFERENCES);

  readonly catalogState = this.catalogStateSource.asReadonly();
  readonly preferences = this.preferencesSource.asReadonly();
  readonly recommendations = computed<readonly PlaceRecommendation[]>(() => {
    const state = this.catalogState();

    return state.kind === 'success'
      ? recommendPlaces({ places: state.places, preferences: this.preferences() })
      : [];
  });
  readonly catalogErrorMessage = computed(() => {
    const state = this.catalogState();

    return state.kind === 'error' ? state.message : null;
  });
  readonly visiblePlaces = computed(() =>
    this.recommendations().map((recommendation) => recommendation.place),
  );
  readonly resultCount = computed(() => this.recommendations().length);
  readonly isCatalogEmpty = computed(() => {
    const state = this.catalogState();

    return state.kind === 'success' && state.places.length === 0;
  });
  readonly hasNoVisiblePlaces = computed(() => {
    const state = this.catalogState();

    return state.kind === 'success'
      && state.places.length > 0
      && this.recommendations().length === 0;
  });
  readonly selectedPreferencesSummary = computed(() => {
    const current = this.preferences();
    const activity = current.activityTypes.length === 0
      ? 'Todas las categorías'
      : current.activityTypes.map((category) => PLACE_CATEGORY_LABELS[category]).join(', ');
    const time = {
      'one-hour': '1 hora',
      'two-hours': '2 horas',
      'half-day': 'Medio día',
    }[current.availableTime];
    const budget = {
      economical: 'Económico',
      medium: 'Medio',
      flexible: 'Flexible',
    }[current.budget];

    return `${activity} · ${time} · Presupuesto ${budget}`;
  });

  constructor() {
    void this.loadPlaces();
  }

  toggleActivityType(activityType: PlaceCategory): void {
    this.preferencesSource.update((current) => {
      const isSelected = current.activityTypes.includes(activityType);
      const activityTypes = isSelected
        ? current.activityTypes.filter((category) => category !== activityType)
        : [...current.activityTypes, activityType];

      return { ...current, activityTypes };
    });
  }

  setAvailableTime(availableTime: AvailableTime): void {
    this.preferencesSource.update((current) => ({ ...current, availableTime }));
  }

  setBudget(budget: BudgetRange): void {
    this.preferencesSource.update((current) => ({ ...current, budget }));
  }

  async retryLoading(): Promise<void> {
    if (this.catalogState().kind !== 'error') {
      return;
    }

    await this.loadPlaces();
  }

  private async loadPlaces(): Promise<void> {
    this.catalogStateSource.set({ kind: 'loading' });

    try {
      const places = await this.placeCatalog.getAll();
      this.catalogStateSource.set({ kind: 'success', places });
    } catch (error: unknown) {
      console.error('Unable to load places for Discover.', error);
      this.catalogStateSource.set({
        kind: 'error',
        message: 'No se pudieron cargar los lugares. Comprueba tu conexión e inténtalo de nuevo.',
      });
    }
  }
}
