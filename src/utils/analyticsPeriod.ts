export const ANALYTICS_PERIODS = [
  'this_week',
  'this_month',
  'last_three_month',
  'last_six_month',
  'last_year',
  'last_two_year',
] as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface AnalyticsDateRange {
  fromDate: Date;
  toDate: Date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - diff);
  return day;
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function subtractUtcMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() - months);
  return startOfUtcDay(d);
}

export function resolveAnalyticsPeriod(period: AnalyticsPeriod, reference = new Date()): AnalyticsDateRange {
  const toDate = endOfUtcDay(reference);

  switch (period) {
    case 'this_week':
      return { fromDate: startOfUtcWeek(reference), toDate };
    case 'this_month':
      return { fromDate: startOfUtcMonth(reference), toDate };
    case 'last_three_month':
      return { fromDate: subtractUtcMonths(reference, 3), toDate };
    case 'last_six_month':
      return { fromDate: subtractUtcMonths(reference, 6), toDate };
    case 'last_year':
      return { fromDate: subtractUtcMonths(reference, 12), toDate };
    case 'last_two_year':
      return { fromDate: subtractUtcMonths(reference, 24), toDate };
    default:
      return { fromDate: startOfUtcMonth(reference), toDate };
  }
}

export function resolveAnalyticsDateRange(input: {
  period?: AnalyticsPeriod;
  fromDate?: Date;
  toDate?: Date;
}): AnalyticsDateRange {
  if (input.period) {
    return resolveAnalyticsPeriod(input.period);
  }
  if (input.fromDate && input.toDate) {
    return { fromDate: input.fromDate, toDate: input.toDate };
  }
  return resolveAnalyticsPeriod('this_month');
}
