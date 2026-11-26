import { Place } from '../models/place';
import { PlanContext, PlanPreferences } from '../models/plan';
import { WeatherSnapshot } from '../models/weather';
import {
  alternativesForStop,
  buildPlan,
  eligibleCandidates,
  generatePlans,
  rebuildPlan,
  removeStop,
  seededRandom,
  surprisePreferences,
} from './plan-generator';

const origin = { latitude: 40.4168, longitude: -3.7038 };

/** A point about `meters` north and `eastMeters` east of the origin. */
function near(meters: number, eastMeters = 0) {
  return {
    latitude: origin.latitude + meters / 111_320,
    longitude: origin.longitude + eastMeters / (111_320 * Math.cos((origin.latitude * Math.PI) / 180)),
  };
}

function place(id: string, overrides: Partial<Place>): Place {
  return {
    id,
    name: id,
    description: '',
    category: 'culture',
    source: 'test',
    dataStatus: 'unverified',
    coordinates: near(200),
    estimatedVisitMinutes: 30,
    costLevel: 'free',
    notability: 0,
    ...overrides,
  };
}

const PLACES: Place[] = [
  place('museum', { kind: 'museum', coordinates: near(300), estimatedVisitMinutes: 60, costLevel: 'medium', indoor: true, notability: 0.8, openingHoursText: 'Mo-Su 10:00-20:00' }),
  place('gallery', { kind: 'gallery', coordinates: near(250, 150), estimatedVisitMinutes: 40, costLevel: 'low', indoor: true, openingHoursText: 'Mo-Su 10:00-20:00' }),
  place('cathedral', { category: 'sights', kind: 'place_of_worship', coordinates: near(500, -200), estimatedVisitMinutes: 20, indoor: true, notability: 0.95 }),
  place('viewpoint', { category: 'sights', kind: 'viewpoint', coordinates: near(900, 300), estimatedVisitMinutes: 20, notability: 0.2 }),
  place('park', { category: 'nature', kind: 'park', coordinates: near(150, -100), estimatedVisitMinutes: 40 }),
  place('garden', { category: 'nature', kind: 'garden', coordinates: near(700, 500), estimatedVisitMinutes: 35, notability: 0.6 }),
  place('cafe', { category: 'drinks', kind: 'cafe', coordinates: near(100), estimatedVisitMinutes: 35, costLevel: 'low', indoor: true, openingHoursText: 'Mo-Su 08:00-21:00' }),
  place('restaurant', { category: 'food', kind: 'restaurant', coordinates: near(350, 100), estimatedVisitMinutes: 75, costLevel: 'medium', indoor: true, openingHoursText: 'Mo-Su 13:00-16:00,20:00-23:30' }),
  place('closed-museum', { kind: 'museum', coordinates: near(120), estimatedVisitMinutes: 60, indoor: true, notability: 1, openingHoursText: 'Mo off; Tu-Su 10:00-14:00' }),
  place('far-castle', { category: 'sights', kind: 'castle', coordinates: near(9000), notability: 1 }),
  place('no-coordinates', { coordinates: undefined }),
  place('theme-park', { category: 'family', kind: 'theme_park', coordinates: near(400), estimatedVisitMinutes: 240, costLevel: 'high' }),
];

// Monday 2026-11-16 at 16:30.
const MONDAY_AFTERNOON = new Date(2026, 10, 16, 16, 30);

function context(preferences: Partial<PlanPreferences> = {}, extra: Partial<PlanContext> = {}): PlanContext {
  return {
    places: PLACES,
    origin,
    start: MONDAY_AFTERNOON,
    weather: null,
    preferences: { categories: [], durationMinutes: 120, budget: 'any', ...preferences },
    ...extra,
  };
}

const ids = (plan: { stops: readonly { place: Place }[] }) => plan.stops.map((stop) => stop.place.id);

describe('eligibleCandidates', () => {
  it('applies categories, budget, radius, coordinates and duration', () => {
    const all = eligibleCandidates(context()).map((candidate) => candidate.place.id);
    expect(all).not.toContain('far-castle');
    expect(all).not.toContain('no-coordinates');
    expect(all).not.toContain('theme-park');

    const freeNature = eligibleCandidates(context({ categories: ['nature'], budget: 'free' })).map((c) => c.place.id);
    expect(freeNature.sort()).toEqual(['garden', 'park']);

    const lowBudget = eligibleCandidates(context({ budget: 'low' })).map((c) => c.place.id);
    expect(lowBudget).not.toContain('museum');
    expect(lowBudget).toContain('gallery');

    const allDay = eligibleCandidates(context({ durationMinutes: 480 })).map((c) => c.place.id);
    expect(allDay).toContain('theme-park');
  });
});

describe('buildPlan', () => {
  it('never exceeds the available time and keeps a consistent timeline', () => {
    for (const durationMinutes of [60, 120, 180, 240, 480] as const) {
      for (const strategy of ['balanced', 'nearby', 'highlights'] as const) {
        const plan = buildPlan(context({ durationMinutes }), strategy);
        expect(plan.totals.minutes).toBeLessThanOrEqual(durationMinutes);
        let clock = MONDAY_AFTERNOON.getTime();
        for (const stop of plan.stops) {
          expect(stop.arrival.getTime()).toBe(clock + stop.walkMinutes * 60_000);
          expect(stop.departure.getTime()).toBe(stop.arrival.getTime() + stop.visitMinutes * 60_000);
          clock = stop.departure.getTime();
        }
      }
    }
  });

  it('never includes a place that is closed during the visit', () => {
    const plan = buildPlan(context({ categories: ['culture'] }), 'highlights');
    expect(ids(plan)).not.toContain('closed-museum');
    expect(ids(plan)).toContain('museum');
    expect(plan.stops.find((stop) => stop.place.id === 'museum')?.openStatus).toBe('open');
  });

  it('explains every stop', () => {
    const plan = buildPlan(context({ categories: ['culture', 'sights'] }), 'balanced');
    const museum = plan.stops.find((stop) => stop.place.id === 'museum');
    expect(museum?.reasons).toEqual(
      expect.arrayContaining([{ type: 'category', category: 'culture' }, { type: 'open' }, { type: 'notable' }]),
    );
    const cathedral = plan.stops.find((stop) => stop.place.id === 'cathedral');
    expect(cathedral?.reasons).toEqual(expect.arrayContaining([{ type: 'hours-unknown' }, { type: 'free' }]));
  });

  it('prefers indoor places when it rains', () => {
    const rain: WeatherSnapshot = { temperatureCelsius: 12, condition: 'rain', isDay: true, rainChanceNextHours: 90 };
    const plan = buildPlan(context({}, { weather: rain }), 'balanced');
    expect(plan.stops.every((stop) => stop.place.indoor)).toBe(true);
    expect(plan.stops[0].reasons).toContainEqual({ type: 'indoor-bad-weather' });
  });

  it('rewards outdoor sights and nature on a sunny day', () => {
    const sun: WeatherSnapshot = { temperatureCelsius: 24, condition: 'clear', isDay: true, rainChanceNextHours: 0 };
    const plan = buildPlan(context({ categories: ['nature'] }, { weather: sun }), 'balanced');
    expect(plan.stops[0].reasons).toContainEqual({ type: 'outdoor-good-weather' });
  });

  it('suggests food at meal time and only one meal per plan', () => {
    const lunch = new Date(2026, 10, 16, 13, 15);
    const plan = buildPlan(context({ categories: ['food', 'drinks', 'culture'], durationMinutes: 240 }, { start: lunch }), 'balanced');
    const meals = plan.stops.filter((stop) => stop.place.category === 'food');
    expect(meals).toHaveLength(1);
    expect(meals[0].reasons).toContainEqual({ type: 'meal-time' });
  });

  it('walks less in the nearby strategy than in highlights', () => {
    const nearby = buildPlan(context({ durationMinutes: 240 }), 'nearby');
    const highlights = buildPlan(context({ durationMinutes: 240 }), 'highlights');
    expect(nearby.totals.walkMeters).toBeLessThan(highlights.totals.walkMeters);
    expect(ids(highlights)).toContain('cathedral');
  });

  it('summarises cost, walking and affinity', () => {
    const plan = buildPlan(context({ categories: ['nature'], budget: 'free' }), 'balanced');
    expect(plan.totals.cost).toBe('free');
    expect(plan.totals.walkMeters).toBeGreaterThan(0);
    expect(plan.totals.affinity).toBeGreaterThan(0);
    expect(plan.totals.affinity).toBeLessThanOrEqual(100);
    expect(plan.id.startsWith('balanced:')).toBe(true);
  });

  it('returns an empty plan when nothing fits', () => {
    const plan = buildPlan(context({ categories: ['family'], durationMinutes: 60 }), 'balanced');
    expect(plan.stops).toEqual([]);
    expect(plan.totals).toEqual({ minutes: 0, walkMinutes: 0, walkMeters: 0, cost: 'free', affinity: 0 });
  });

  it('varies reproducibly with a seed', () => {
    const a = buildPlan(context({ durationMinutes: 240 }, { seed: 7 }), 'balanced');
    const b = buildPlan(context({ durationMinutes: 240 }, { seed: 7 }), 'balanced');
    expect(ids(a)).toEqual(ids(b));
  });
});

describe('generatePlans', () => {
  it('returns up to three different plans', () => {
    const plans = generatePlans(context({ durationMinutes: 180 }));
    expect(plans.length).toBeGreaterThanOrEqual(2);
    expect(plans.length).toBeLessThanOrEqual(3);
    const signatures = plans.map((plan) => ids(plan).sort().join());
    expect(new Set(signatures).size).toBe(plans.length);
    expect(plans.map((plan) => plan.strategy)[0]).toBe('balanced');
  });

  it('returns no plans when there are no places', () => {
    expect(generatePlans(context({}, { places: [] }))).toEqual([]);
  });
});

describe('editing a plan', () => {
  const ctx = context({ durationMinutes: 180 });
  const plan = buildPlan(ctx, 'balanced');

  it('removes a stop and recomputes the timeline', () => {
    const shorter = removeStop(plan, 0, ctx);
    expect(shorter?.stops).toHaveLength(plan.stops.length - 1);
    expect(shorter?.stops[0].place.id).toBe(plan.stops[1].place.id);
    expect(shorter?.totals.minutes).toBeLessThan(plan.totals.minutes);
  });

  it('offers alternatives for a stop that keep the plan valid', () => {
    const options = alternativesForStop(plan, 0, ctx);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.stops[0].place.id).not.toBe(plan.stops[0].place.id);
      expect(option.totals.minutes).toBeLessThanOrEqual(180);
      expect(ids(option).slice(1)).toEqual(ids(plan).slice(1));
    }
    expect(alternativesForStop(plan, 99, ctx)).toEqual([]);
  });

  it('rejects rebuilds that no longer fit or use unknown places', () => {
    const tooLong = PLACES.filter((candidate) => ['museum', 'restaurant', 'garden', 'viewpoint'].includes(candidate.id));
    expect(rebuildPlan(plan, tooLong, context({ durationMinutes: 120 }))).toBeNull();
    expect(rebuildPlan(plan, [place('ghost', { coordinates: near(20_000) })], ctx)).toBeNull();
  });

  it('rejects a rebuild that would visit a closed place', () => {
    const closed = PLACES.filter((candidate) => candidate.id === 'closed-museum');
    expect(rebuildPlan(plan, closed, ctx)).toBeNull();
  });
});

describe('variety and scoring details', () => {
  // Every place sits at the same spot, so walks never decide between them.
  const at = (preferences: Partial<PlanPreferences>, places: Place[]) => context(preferences, { places });

  it('does not repeat a kind of place while there are alternatives', () => {
    const places = [
      place('museum-a', { kind: 'museum', notability: 0.5 }),
      place('museum-b', { kind: 'museum', notability: 0.5 }),
      place('gallery', { kind: 'gallery', notability: 0.2 }),
    ];
    expect(ids(buildPlan(at({}, places), 'balanced'))).toEqual(['museum-a', 'gallery']);
  });

  it('prefers a less notable place of another category over a third one of the same category', () => {
    const places = [
      place('culture-1', { kind: 'museum', notability: 1 }),
      place('culture-2', { kind: 'gallery', notability: 1 }),
      place('culture-3', { kind: 'arts_centre', notability: 1 }),
      place('sight', { category: 'sights', kind: 'monument', notability: 0.4 }),
    ];
    expect(ids(buildPlan(at({}, places), 'balanced'))).toEqual(['culture-1', 'culture-2', 'sight']);
  });

  it('gives a small bonus to places with a website', () => {
    const scoreOf = (candidate: Place) => buildPlan(at({}, [candidate]), 'balanced').stops[0].score;
    expect(scoreOf(place('with-web', { website: 'https://example.org' }))).toBe(scoreOf(place('plain', {})) + 2);
  });
});

describe('plan edits that no longer fit', () => {
  it('rejects a rebuild whose open places exceed the available time', () => {
    const plan = buildPlan(context({ durationMinutes: 180 }), 'balanced');
    // 60 + 40 + 20 minutes of visits plus the walks between them.
    const places = PLACES.filter((candidate) => ['museum', 'gallery', 'cathedral'].includes(candidate.id));
    expect(rebuildPlan(plan, places, context({ durationMinutes: 180 }))).not.toBeNull();
    expect(rebuildPlan(plan, places, context({ durationMinutes: 120 }))).toBeNull();
  });

  it('offers no alternatives when another stop is no longer available', () => {
    const ctx = context({ durationMinutes: 180 });
    const plan = buildPlan(ctx, 'balanced');
    expect(plan.stops.length).toBeGreaterThan(1);
    const gone = plan.stops[1].place.id;
    const withoutIt = { ...ctx, places: PLACES.filter((candidate) => candidate.id !== gone) };
    expect(alternativesForStop(plan, 0, withoutIt)).toEqual([]);
    expect(alternativesForStop(plan, 0, ctx).length).toBeGreaterThan(0);
  });
});

describe('surprise', () => {
  it('produces valid, reproducible preferences', () => {
    const first = surprisePreferences(42);
    expect(surprisePreferences(42)).toEqual(first);
    expect(first.categories.length).toBeGreaterThanOrEqual(2);
    expect(new Set(first.categories).size).toBe(first.categories.length);
    expect([60, 120, 180]).toContain(first.durationMinutes);
    expect(['low', 'any']).toContain(first.budget);
  });

  it('seeded random numbers stay in [0, 1)', () => {
    const random = seededRandom(1);
    for (let i = 0; i < 100; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
