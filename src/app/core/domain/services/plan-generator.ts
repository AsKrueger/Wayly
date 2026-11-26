import { distanceMeters, walkingMeters, walkingMinutes } from '../models/geo';
import { CostLevel, Place, PlaceCoordinates } from '../models/place';
import { PLACE_CATEGORIES, PlaceCategory } from '../models/place-category';
import {
  BudgetPreference,
  DURATION_OPTIONS,
  DurationMinutes,
  Plan,
  PlanContext,
  PlanPreferences,
  PlanStop,
  PlanStrategy,
  PLAN_STRATEGIES,
  StopReason,
} from '../models/plan';
import { isBadWeatherForOutdoors } from '../models/weather';
import { openStatusDuring, parseOpeningHours, WeeklySchedule } from './opening-hours';

/** Search radius by available time: longer plans can walk further. */
export const RADIUS_BY_DURATION: Record<DurationMinutes, number> = {
  60: 1000,
  120: 1600,
  180: 2200,
  240: 2800,
  480: 4000,
};

export const MAX_STOPS_BY_DURATION: Record<DurationMinutes, number> = {
  60: 2,
  120: 3,
  180: 4,
  240: 5,
  480: 7,
};

const COST_RANK: Record<CostLevel, number> = { free: 0, low: 1, medium: 2, high: 3 };
const BUDGET_LIMIT: Record<BudgetPreference, number> = { free: 0, low: 1, medium: 2, any: 3 };

interface StrategyWeights {
  readonly notability: number;
  /** Points lost per walking minute. */
  readonly walkPenalty: number;
  /** Share of the available time the plan may fill. */
  readonly fill: number;
  readonly stopFactor: number;
}

const STRATEGY: Record<PlanStrategy, StrategyWeights> = {
  balanced: { notability: 30, walkPenalty: 1.2, fill: 1, stopFactor: 1 },
  nearby: { notability: 15, walkPenalty: 3.5, fill: 0.85, stopFactor: 0.75 },
  highlights: { notability: 65, walkPenalty: 0.7, fill: 1, stopFactor: 1 },
};

const MINIMUM_STOP_SCORE = 8;
const REUSE_PENALTY = 35;

interface Candidate {
  readonly place: Place & { readonly coordinates: PlaceCoordinates };
  readonly schedule: WeeklySchedule | null;
  readonly visitMinutes: number;
}

/** Mulberry32: tiny seeded generator, so "regenerate" is reproducible. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function isMealTime(date: Date): boolean {
  const minute = date.getHours() * 60 + date.getMinutes();
  return (minute >= 13 * 60 && minute <= 15 * 60) || (minute >= 20 * 60 && minute <= 22 * 60);
}

export function costOf(place: Place): CostLevel {
  return place.costLevel ?? 'low';
}

/** Places that may appear in a plan, before time and order are considered. */
export function eligibleCandidates(context: PlanContext): Candidate[] {
  const { preferences, origin } = context;
  const radius = RADIUS_BY_DURATION[preferences.durationMinutes] * 1.15;
  const categories = preferences.categories.length > 0 ? preferences.categories : PLACE_CATEGORIES;
  const budgetLimit = BUDGET_LIMIT[preferences.budget];

  const candidates: Candidate[] = [];
  for (const place of context.places) {
    if (!place.coordinates || !categories.includes(place.category)) {
      continue;
    }
    if (COST_RANK[costOf(place)] > budgetLimit) {
      continue;
    }
    if (distanceMeters(origin, place.coordinates) > radius) {
      continue;
    }
    const visitMinutes = Math.max(10, place.estimatedVisitMinutes ?? 30);
    if (visitMinutes > preferences.durationMinutes) {
      continue;
    }
    candidates.push({
      place: place as Candidate['place'],
      schedule: parseOpeningHours(place.openingHoursText),
      visitMinutes,
    });
  }
  return candidates;
}

interface Evaluation {
  readonly score: number;
  readonly reasons: StopReason[];
  readonly openStatus: 'open' | 'unknown';
}

/** Explainable score of a place at a given arrival time, or null if it is closed. */
function evaluate(
  candidate: Candidate,
  arrival: Date,
  walkMinutes: number,
  context: PlanContext,
  weights: StrategyWeights,
): Evaluation | null {
  const { place } = candidate;
  const status = openStatusDuring(candidate.schedule, arrival, candidate.visitMinutes);
  if (status === 'closed') {
    return null;
  }

  const reasons: StopReason[] = [];
  let score = 0;

  if (context.preferences.categories.length > 0) {
    score += 30;
    reasons.push({ type: 'category', category: place.category });
  } else {
    score += 20;
  }

  const notability = place.notability ?? 0;
  score += notability * weights.notability;
  if (notability >= 0.5) {
    reasons.push({ type: 'notable' });
  }

  if (status === 'open') {
    score += 10;
    reasons.push({ type: 'open' });
  } else {
    reasons.push({ type: 'hours-unknown' });
  }

  const badWeather = isBadWeatherForOutdoors(context.weather);
  if (badWeather) {
    if (place.indoor) {
      score += 15;
      reasons.push({ type: 'indoor-bad-weather' });
    } else {
      score -= 25;
    }
  } else if (context.weather && context.weather.isDay && !place.indoor && (place.category === 'nature' || place.category === 'sights')) {
    score += 6;
    reasons.push({ type: 'outdoor-good-weather' });
  }

  const cost = costOf(place);
  if (cost === 'free') {
    score += 5;
    reasons.push({ type: 'free' });
  } else if (cost === 'low') {
    score += 2;
  }

  if (place.category === 'food' && isMealTime(arrival)) {
    score += 18;
    reasons.push({ type: 'meal-time' });
  }

  if (place.website) {
    score += 2;
  }

  if (walkMinutes <= 6) {
    reasons.push({ type: 'close', minutes: walkMinutes });
  }

  return { score: Math.max(0, score), reasons, openStatus: status };
}

function diversityPenalty(candidate: Candidate, chosen: readonly Candidate[]): number {
  if (chosen.length === 0) {
    return 0;
  }
  const last = chosen[chosen.length - 1];
  let penalty = 0;
  if (last.place.category === candidate.place.category) {
    penalty += 15;
  }
  if (chosen.some((existing) => existing.place.kind !== undefined && existing.place.kind === candidate.place.kind)) {
    penalty += 25;
  }
  if (chosen.filter((existing) => existing.place.category === candidate.place.category).length >= 2) {
    penalty += 20;
  }
  return penalty;
}

/**
 * One meal per plan is enough. A penalty is not enough to guarantee it: a
 * second restaurant at meal time can still outscore the remaining places once
 * another stop sits between both meals.
 */
function isSecondMeal(candidate: Candidate, chosen: readonly Candidate[]): boolean {
  return candidate.place.category === 'food' && chosen.some((existing) => existing.place.category === 'food');
}

function totalsFor(stops: readonly PlanStop[]): Plan['totals'] {
  const walkMinutes = stops.reduce((sum, stop) => sum + stop.walkMinutes, 0);
  const minutes = stops.reduce((sum, stop) => sum + stop.walkMinutes + stop.visitMinutes, 0);
  const walkMeters = stops.reduce((sum, stop) => sum + stop.walkMeters, 0);
  const costPoints = stops.reduce((sum, stop) => sum + COST_RANK[costOf(stop.place)], 0);
  const cost: CostLevel = costPoints === 0 ? 'free' : costPoints <= 2 ? 'low' : costPoints <= 4 ? 'medium' : 'high';
  const affinity =
    stops.length === 0 ? 0 : Math.round(Math.min(100, stops.reduce((sum, stop) => sum + stop.score, 0) / stops.length));
  return { minutes, walkMinutes, walkMeters: Math.round(walkMeters), cost, affinity };
}

function planId(strategy: PlanStrategy, stops: readonly PlanStop[]): string {
  return `${strategy}:${stops.map((stop) => stop.place.id).join(',')}`;
}

/** Builds one plan greedily: the best next stop that still fits in the time left. */
export function buildPlan(
  context: PlanContext,
  strategy: PlanStrategy,
  avoidIds: ReadonlySet<string> = new Set(),
  candidates: readonly Candidate[] = eligibleCandidates(context),
): Plan {
  const weights = STRATEGY[strategy];
  const random = context.seed ? seededRandom(context.seed + PLAN_STRATEGIES.indexOf(strategy) * 7919) : () => 0;
  const jitter = new Map(candidates.map((candidate) => [candidate.place.id, random() * 6]));
  const available = context.preferences.durationMinutes * weights.fill;
  const maxStops = Math.max(1, Math.round(MAX_STOPS_BY_DURATION[context.preferences.durationMinutes] * weights.stopFactor));

  const chosen: Candidate[] = [];
  const stops: PlanStop[] = [];
  let position = context.origin;
  let clock = context.start;
  let used = 0;

  while (stops.length < maxStops) {
    let best: { candidate: Candidate; stop: PlanStop; value: number } | null = null;

    for (const candidate of candidates) {
      if (chosen.includes(candidate) || isSecondMeal(candidate, chosen)) {
        continue;
      }
      const meters = walkingMeters(position, candidate.place.coordinates);
      const walk = walkingMinutes(meters);
      if (used + walk + candidate.visitMinutes > available) {
        continue;
      }
      const arrival = addMinutes(clock, walk);
      const evaluation = evaluate(candidate, arrival, walk, context, weights);
      if (!evaluation) {
        continue;
      }
      const value =
        evaluation.score -
        walk * weights.walkPenalty -
        diversityPenalty(candidate, chosen) -
        (avoidIds.has(candidate.place.id) ? REUSE_PENALTY : 0) +
        (jitter.get(candidate.place.id) ?? 0);
      if (value < MINIMUM_STOP_SCORE || (best && value <= best.value)) {
        continue;
      }
      best = {
        candidate,
        value,
        stop: {
          place: candidate.place,
          arrival,
          departure: addMinutes(arrival, candidate.visitMinutes),
          walkMinutes: walk,
          walkMeters: Math.round(meters),
          visitMinutes: candidate.visitMinutes,
          openStatus: evaluation.openStatus,
          reasons: evaluation.reasons,
          score: Math.round(Math.min(100, evaluation.score)),
        },
      };
    }

    if (!best) {
      break;
    }
    chosen.push(best.candidate);
    stops.push(best.stop);
    used += best.stop.walkMinutes + best.stop.visitMinutes;
    clock = best.stop.departure;
    position = best.candidate.place.coordinates;
  }

  return {
    id: planId(strategy, stops),
    strategy,
    origin: context.origin,
    start: context.start,
    stops,
    totals: totalsFor(stops),
  };
}

/**
 * Up to three different plans (balanced, nearby, highlights). Later plans
 * avoid repeating earlier stops; a plan with the same stops as a previous
 * one is dropped.
 */
export function generatePlans(context: PlanContext): Plan[] {
  const candidates = eligibleCandidates(context);
  const used = new Set<string>();
  const signatures = new Set<string>();
  const plans: Plan[] = [];

  for (const strategy of PLAN_STRATEGIES) {
    const plan = buildPlan(context, strategy, used, candidates);
    const signature = plan.stops.map((stop) => stop.place.id).sort().join(',');
    if (plan.stops.length === 0 || signatures.has(signature)) {
      continue;
    }
    signatures.add(signature);
    plan.stops.forEach((stop) => used.add(stop.place.id));
    plans.push(plan);
  }
  return plans;
}

/**
 * Recomputes times and walks for a given order of places. Returns `null`
 * when the result no longer fits the available time or a place is closed.
 */
export function rebuildPlan(plan: Plan, places: readonly Place[], context: PlanContext): Plan | null {
  const candidates = eligibleCandidates({ ...context, places });
  const byId = new Map(candidates.map((candidate) => [candidate.place.id, candidate]));
  const ordered: Candidate[] = [];
  for (const place of places) {
    const candidate = byId.get(place.id);
    if (!candidate) {
      return null;
    }
    ordered.push(candidate);
  }
  return rebuildFromCandidates(plan, ordered, context);
}

function rebuildFromCandidates(plan: Plan, ordered: readonly Candidate[], context: PlanContext): Plan | null {
  const weights = STRATEGY[plan.strategy];
  const stops: PlanStop[] = [];
  let position = plan.origin;
  let clock = plan.start;
  let used = 0;

  for (const candidate of ordered) {
    const meters = walkingMeters(position, candidate.place.coordinates);
    const walk = walkingMinutes(meters);
    const arrival = addMinutes(clock, walk);
    const evaluation = evaluate(candidate, arrival, walk, context, weights);
    if (!evaluation) {
      return null;
    }
    used += walk + candidate.visitMinutes;
    stops.push({
      place: candidate.place,
      arrival,
      departure: addMinutes(arrival, candidate.visitMinutes),
      walkMinutes: walk,
      walkMeters: Math.round(meters),
      visitMinutes: candidate.visitMinutes,
      openStatus: evaluation.openStatus,
      reasons: evaluation.reasons,
      score: Math.round(Math.min(100, evaluation.score)),
    });
    clock = stops[stops.length - 1].departure;
    position = candidate.place.coordinates;
  }

  if (used > context.preferences.durationMinutes) {
    return null;
  }
  return { ...plan, id: planId(plan.strategy, stops), stops, totals: totalsFor(stops) };
}

export function removeStop(plan: Plan, index: number, context: PlanContext): Plan | null {
  const places = plan.stops.filter((_, position) => position !== index).map((stop) => stop.place);
  return rebuildPlan(plan, places, context);
}

/**
 * Alternatives for one stop: other eligible places that keep the plan within
 * time and open, best first.
 */
export function alternativesForStop(plan: Plan, index: number, context: PlanContext, limit = 3): Plan[] {
  const inPlan = new Set(plan.stops.map((stop) => stop.place.id));
  const current = plan.stops[index];
  if (!current) {
    return [];
  }
  const candidates = eligibleCandidates(context);
  const byId = new Map(candidates.map((candidate) => [candidate.place.id, candidate]));
  const fixed = plan.stops.map((stop) => byId.get(stop.place.id));
  if (fixed.some((candidate, position) => position !== index && candidate === undefined)) {
    return [];
  }
  const options: Plan[] = [];
  for (const candidate of candidates) {
    if (inPlan.has(candidate.place.id)) {
      continue;
    }
    const ordered = fixed.map((existing, position) => (position === index ? candidate : (existing as Candidate)));
    const rebuilt = rebuildFromCandidates(plan, ordered, context);
    if (rebuilt) {
      options.push(rebuilt);
    }
  }
  const sameCategoryFirst = (option: Plan) => (option.stops[index].place.category === current.place.category ? 1 : 0);
  return options
    .sort(
      (a, b) =>
        sameCategoryFirst(b) - sameCategoryFirst(a) ||
        b.totals.affinity - a.totals.affinity ||
        a.totals.walkMinutes - b.totals.walkMinutes,
    )
    .slice(0, limit);
}

/** "Surprise me": random but reproducible preferences. */
export function surprisePreferences(seed: number): PlanPreferences {
  const random = seededRandom(seed);
  const pool = [...PLACE_CATEGORIES];
  const categories: PlaceCategory[] = [];
  const count = 2 + Math.floor(random() * 2);
  while (categories.length < count) {
    const [category] = pool.splice(Math.floor(random() * pool.length), 1);
    categories.push(category);
  }
  const durations: readonly DurationMinutes[] = DURATION_OPTIONS.filter((minutes) => minutes <= 180);
  return {
    categories,
    durationMinutes: durations[Math.floor(random() * durations.length)],
    budget: random() < 0.5 ? 'low' : 'any',
  };
}
