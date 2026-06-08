import { useEffect } from 'react'
import {
  clearedComparisonSearch,
  clearedDateSearch,
  DashboardState
} from './dashboard-state'
import { PlausibleSite } from './site-context'
import {
  formatDateRange,
  formatDay,
  formatISO,
  formatMonthYYYY,
  formatYear,
  isSameDate,
  isSameMonth,
  isThisMonth,
  isThisYear,
  isToday,
  isTodayOrYesterday,
  lastMonth,
  now,
  parseNaiveDate,
  yesterday
} from './util/date'
import { AppNavigationTarget } from './navigation/use-app-navigate'
import { getDomainScopedStorageKey, getItem, setItem } from './util/storage'

export enum DashboardPeriod {
  'realtime' = 'realtime',
  'realtime_30m' = 'realtime_30m',
  'day' = 'day',
  'month' = 'month',
  '7d' = '7d',
  '24h' = '24h',
  '28d' = '28d',
  '30d' = '30d',
  '91d' = '91d',
  '6mo' = '6mo',
  '12mo' = '12mo',
  'year' = 'year',
  'all' = 'all',
  'custom' = 'custom'
}

export enum ComparisonMode {
  off = 'off',
  previous_period = 'previous_period',
  year_over_year = 'year_over_year',
  custom = 'custom'
}

export type DashboardTimeSettings = {
  siteTimezoneOffset: PlausibleSite['offset']
  siteStatsBegin: PlausibleSite['statsBegin']
  date: DashboardState['date']
  period: DashboardState['period']
  from: DashboardState['from']
  to: DashboardState['to']
  comparison: DashboardState['comparison']
  compare_from: DashboardState['compare_from']
  compare_to: DashboardState['compare_to']
}

export const COMPARISON_MODES = {
  [ComparisonMode.off]: 'Desativar comparação',
  [ComparisonMode.previous_period]: 'Período anterior',
  [ComparisonMode.year_over_year]: 'Ano a ano',
  [ComparisonMode.custom]: 'Período personalizado'
}

export enum ComparisonMatchMode {
  MatchExactDate = 0,
  MatchDayOfWeek = 1
}

export const COMPARISON_MATCH_MODE_LABELS = {
  [ComparisonMatchMode.MatchDayOfWeek]: 'Corresponder dia da semana',
  [ComparisonMatchMode.MatchExactDate]: 'Corresponder data exata'
}

export const DEFAULT_COMPARISON_MODE = ComparisonMode.previous_period

const COMPARISON_DISABLED_PERIODS = [
  DashboardPeriod.realtime,
  DashboardPeriod.all
]

const PERIODS_EXCLUDING_NOW = [
  DashboardPeriod['7d'],
  DashboardPeriod['28d'],
  DashboardPeriod['30d'],
  DashboardPeriod['91d'],
  DashboardPeriod['6mo'],
  DashboardPeriod['12mo']
]

export function isHistoricalPeriod({
  siteTimezoneOffset,
  date,
  period,
  from,
  to,
  comparison,
  compare_from,
  compare_to
}: DashboardTimeSettings) {
  const startOfDay = now(siteTimezoneOffset).startOf('day')

  const mainPeriodIncludesToday =
    period === DashboardPeriod.custom && to && from
      ? !to.isBefore(startOfDay)
      : !(date?.isBefore(startOfDay) || PERIODS_EXCLUDING_NOW.includes(period))

  const comparisonPeriodIncludesToday =
    comparison === ComparisonMode.custom &&
    compare_to &&
    compare_from &&
    !compare_to.isBefore(startOfDay)

  return !(mainPeriodIncludesToday || comparisonPeriodIncludesToday)
}

export const isComparisonForbidden = ({
  period,
  segmentIsExpanded
}: {
  period: DashboardPeriod
  segmentIsExpanded: boolean
}) => COMPARISON_DISABLED_PERIODS.includes(period) || segmentIsExpanded

export const DEFAULT_COMPARISON_MATCH_MODE = ComparisonMatchMode.MatchDayOfWeek

export function getPeriodStorageKey(domain: string): string {
  return getDomainScopedStorageKey('period', domain)
}

export function isValidPeriod(period: unknown): period is DashboardPeriod {
  return Object.values<unknown>(DashboardPeriod).includes(period)
}

export function getStoredPeriod(
  domain: string,
  fallbackValue: DashboardPeriod | null
) {
  const item = getItem(getPeriodStorageKey(domain))
  return isValidPeriod(item) ? item : fallbackValue
}

function storePeriod(domain: string, value: DashboardPeriod) {
  return setItem(getPeriodStorageKey(domain), value)
}

export const isValidComparison = (
  comparison: unknown
): comparison is ComparisonMode =>
  Object.values<unknown>(ComparisonMode).includes(comparison)

export const getMatchDayOfWeekStorageKey = (domain: string) =>
  getDomainScopedStorageKey('comparison_match_day_of_week', domain)

export const isValidMatchDayOfWeek = (
  matchDayOfWeek: unknown
): matchDayOfWeek is boolean =>
  [true, false].includes(matchDayOfWeek as boolean)

export const storeMatchDayOfWeek = (domain: string, matchDayOfWeek: boolean) =>
  setItem(getMatchDayOfWeekStorageKey(domain), matchDayOfWeek.toString())

export const getStoredMatchDayOfWeek = function (
  domain: string,
  fallbackValue: boolean | null
) {
  const storedValue = getItem(getMatchDayOfWeekStorageKey(domain))
  if (storedValue === 'true') {
    return true
  }
  if (storedValue === 'false') {
    return false
  }
  return fallbackValue
}

export const getComparisonModeStorageKey = (domain: string) =>
  getDomainScopedStorageKey('comparison_mode', domain)

export const getStoredComparisonMode = function (
  domain: string,
  fallbackValue: ComparisonMode | null
): ComparisonMode | null {
  const storedValue = getItem(getComparisonModeStorageKey(domain))
  if (Object.values(ComparisonMode).includes(storedValue)) {
    return storedValue
  }

  return fallbackValue
}

export const storeComparisonMode = function (
  domain: string,
  mode: ComparisonMode
) {
  setItem(getComparisonModeStorageKey(domain), mode)
}

export const isComparisonEnabled = function (
  mode?: ComparisonMode | null
): mode is Exclude<ComparisonMode, ComparisonMode.off> {
  if (
    [
      ComparisonMode.custom,
      ComparisonMode.previous_period,
      ComparisonMode.year_over_year
    ].includes(mode as ComparisonMode)
  ) {
    return true
  }
  return false
}

export const getSearchToToggleComparison = ({
  site,
  dashboardState
}: {
  site: PlausibleSite
  dashboardState: DashboardState
}): Required<AppNavigationTarget>['search'] => {
  return (search) => {
    if (isComparisonEnabled(dashboardState.comparison)) {
      return {
        ...search,
        ...clearedComparisonSearch,
        comparison: ComparisonMode.off,
        keybindHint: 'X'
      }
    }
    const storedMode = getStoredComparisonMode(site.domain, null)
    const newMode = isComparisonEnabled(storedMode)
      ? storedMode
      : DEFAULT_COMPARISON_MODE
    return {
      ...search,
      ...clearedComparisonSearch,
      comparison: newMode,
      keybindHint: 'X'
    }
  }
}

export const getSearchToApplyCustomDates = ([selectionStart, selectionEnd]: [
  Date,
  Date
]): AppNavigationTarget['search'] => {
  const [from, to] = [
    parseNaiveDate(selectionStart),
    parseNaiveDate(selectionEnd)
  ]
  const singleDaySelected = from.isSame(to, 'day')

  if (singleDaySelected) {
    return (search) => ({
      ...search,
      ...clearedDateSearch,
      period: DashboardPeriod.day,
      date: formatISO(from),
      keybindHint: 'C'
    })
  }

  return (search) => ({
    ...search,
    ...clearedDateSearch,
    period: DashboardPeriod.custom,
    from: formatISO(from),
    to: formatISO(to),
    keybindHint: 'C'
  })
}

export const getSearchToApplyCustomComparisonDates = ([
  selectionStart,
  selectionEnd
]: [Date, Date]): AppNavigationTarget['search'] => {
  const [from, to] = [
    parseNaiveDate(selectionStart),
    parseNaiveDate(selectionEnd)
  ]

  return (search) => ({
    ...search,
    comparison: ComparisonMode.custom,
    compare_from: formatISO(from),
    compare_to: formatISO(to),
    keybindHint: null
  })
}

export type LinkItem = [
  string[],
  {
    search: AppNavigationTarget['search']
    isActive: (options: {
      site: PlausibleSite
      dashboardState: DashboardState
    }) => boolean
    onEvent?: (event: Pick<Event, 'preventDefault' | 'stopPropagation'>) => void
    hidden?: boolean
  }
]

/**
 * This function gets menu items with their respective navigation logic.
 * Used to render both menu items and keybind listeners.
 * `onEvent` is passed to all default items, but not extra items.
 */
export const getDatePeriodGroups = ({
  site,
  onEvent,
  extraItemsInLastGroup = [],
  extraGroups = []
}: {
  site: PlausibleSite
  onEvent?: LinkItem[1]['onEvent']
  extraItemsInLastGroup?: LinkItem[]
  extraGroups?: LinkItem[][]
}): LinkItem[][] => {
  const groups: LinkItem[][] = [
    [
      [
        ['Hoje', 'D'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod.day,
            date: formatISO(now(site.offset)),
            keybindHint: 'D'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod.day &&
            isSameDate(dashboardState.date, now(site.offset)),
          onEvent
        }
      ],
      [
        ['Ontem', 'E'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod.day,
            date: formatISO(yesterday(site.offset)),
            keybindHint: 'E'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod.day &&
            isSameDate(dashboardState.date, yesterday(site.offset)),
          onEvent
        }
      ],
      [
        ['Tempo real', 'R'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod.realtime,
            keybindHint: 'R'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod.realtime,
          onEvent
        }
      ]
    ],
    [
      [
        ['Últimas 24 Horas', 'H'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['24h'],
            keybindHint: 'H'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['24h'],
          onEvent
        }
      ],
      [
        ['Últimos 7 Dias', 'W'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['7d'],
            keybindHint: 'W'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['7d'],
          onEvent
        }
      ],
      [
        ['Últimos 28 Dias', 'F'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['28d'],
            keybindHint: 'F'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['28d'],
          onEvent
        }
      ],
      [
        ['Últimos 30 Dias', 'T'],
        {
          hidden: true,
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['30d'],
            keybindHint: 'T'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['30d'],
          onEvent
        }
      ],
      [
        ['Últimos 91 Dias', 'N'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['91d'],
            keybindHint: 'N'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['91d'],
          onEvent
        }
      ]
    ],
    [
      [
        ['Mês até hoje', 'M'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod.month,
            keybindHint: 'M'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod.month &&
            isSameMonth(dashboardState.date, now(site.offset)),
          onEvent
        }
      ],
      [
        ['Mês passado', 'P'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod.month,
            date: formatISO(lastMonth(site)),
            keybindHint: 'P'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod.month &&
            isSameMonth(dashboardState.date, lastMonth(site)),
          onEvent
        }
      ]
    ],
    [
      [
        ['Ano até hoje', 'Y'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod.year,
            keybindHint: 'Y'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod.year &&
            isThisYear(site, dashboardState.date),
          onEvent
        }
      ],
      [
        ['Últimos 6 meses', 'S'],
        {
          hidden: true,
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['6mo'],
            keybindHint: 'S'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['6mo']
        }
      ],
      [
        ['Últimos 12 Meses', 'L'],
        {
          search: (s) => ({
            ...s,
            ...clearedDateSearch,
            period: DashboardPeriod['12mo'],
            keybindHint: 'L'
          }),
          isActive: ({ dashboardState }) =>
            dashboardState.period === DashboardPeriod['12mo'],
          onEvent
        }
      ]
    ]
  ]

  const lastGroup: LinkItem[] = [
    [
      ['Todo o período', 'A'],
      {
        search: (s) => ({
          ...s,
          ...clearedDateSearch,
          period: DashboardPeriod.all,
          keybindHint: 'A'
        }),
        isActive: ({ dashboardState }) =>
          dashboardState.period === DashboardPeriod.all,
        onEvent
      }
    ]
  ]

  return groups
    .concat([lastGroup.concat(extraItemsInLastGroup)])
    .concat(extraGroups)
}

export const getCompareLinkItem = ({
  dashboardState,
  site,
  onEvent
}: {
  dashboardState: DashboardState
  site: PlausibleSite
  onEvent: () => void
}): LinkItem => [
  [
    isComparisonEnabled(dashboardState.comparison)
      ? 'Desativar comparação'
      : 'Comparar',
    'X'
  ],
  {
    onEvent,
    search: getSearchToToggleComparison({ site, dashboardState }),
    isActive: () => false
  }
]

export function useSaveTimePreferencesToStorage({
  site,
  period,
  comparison,
  match_day_of_week
}: {
  site: PlausibleSite
  period: unknown
  comparison: unknown
  match_day_of_week: unknown
}) {
  useEffect(() => {
    if (
      isValidPeriod(period) &&
      ![DashboardPeriod.custom, DashboardPeriod.realtime].includes(period)
    ) {
      storePeriod(site.domain, period)
    }
    if (isValidComparison(comparison) && comparison !== ComparisonMode.custom) {
      storeComparisonMode(site.domain, comparison)
    }
    if (isValidMatchDayOfWeek(match_day_of_week)) {
      storeMatchDayOfWeek(site.domain, match_day_of_week)
    }
  }, [period, comparison, match_day_of_week, site.domain])
}

export function getSavedTimePreferencesFromStorage({
  site
}: {
  site: PlausibleSite
}): {
  period: null | DashboardPeriod
  comparison: null | ComparisonMode
  match_day_of_week: boolean | null
} {
  const stored = {
    period: getStoredPeriod(site.domain, null),
    comparison: getStoredComparisonMode(site.domain, null),
    match_day_of_week: getStoredMatchDayOfWeek(site.domain, true)
  }
  return stored
}

export function getDashboardTimeSettings({
  site,
  searchValues,
  storedValues,
  defaultValues,
  segmentIsExpanded
}: {
  site: PlausibleSite
  searchValues: Record<'period' | 'comparison' | 'match_day_of_week', unknown>
  storedValues: ReturnType<typeof getSavedTimePreferencesFromStorage>
  defaultValues: Pick<
    DashboardState,
    'period' | 'comparison' | 'match_day_of_week'
  >
  segmentIsExpanded: boolean
}): Pick<DashboardState, 'period' | 'comparison' | 'match_day_of_week'> {
  let period: DashboardPeriod
  if (isValidPeriod(searchValues.period)) {
    period = searchValues.period
  } else if (isValidPeriod(storedValues.period)) {
    period = storedValues.period
  } else if (isTodayOrYesterday(site.nativeStatsBegin)) {
    period = DashboardPeriod.day
  } else {
    period = defaultValues.period
  }

  let comparison: ComparisonMode | null

  if (isComparisonForbidden({ period, segmentIsExpanded })) {
    comparison = null
  } else {
    comparison = isValidComparison(searchValues.comparison)
      ? searchValues.comparison
      : storedValues.comparison

    if (!isComparisonEnabled(comparison)) {
      comparison = null
    }
  }

  const match_day_of_week = isValidMatchDayOfWeek(
    searchValues.match_day_of_week
  )
    ? (searchValues.match_day_of_week as boolean)
    : isValidMatchDayOfWeek(storedValues.match_day_of_week)
      ? (storedValues.match_day_of_week as boolean)
      : defaultValues.match_day_of_week

  return {
    period,
    comparison,
    match_day_of_week
  }
}

export function getCurrentPeriodDisplayName({
  dashboardState,
  site
}: {
  dashboardState: DashboardState
  site: PlausibleSite
}) {
  if (dashboardState.period === 'day') {
    if (isToday(site, dashboardState.date)) {
      return 'Hoje'
    }
    return formatDay(
      dashboardState.date,
      !isThisYear(site, dashboardState.date)
    )
  }

  if (dashboardState.period === '24h') {
    return 'Últimas 24 Horas'
  }
  if (dashboardState.period === '7d') {
    return 'Últimos 7 dias'
  }
  if (dashboardState.period === '28d') {
    return 'Últimos 28 dias'
  }
  if (dashboardState.period === '30d') {
    return 'Últimos 30 dias'
  }
  if (dashboardState.period === '91d') {
    return 'Últimos 91 dias'
  }
  if (dashboardState.period === 'month') {
    if (isThisMonth(site, dashboardState.date)) {
      return 'Mês até hoje'
    }
    return formatMonthYYYY(dashboardState.date)
  }
  if (dashboardState.period === '6mo') {
    return 'Últimos 6 meses'
  }
  if (dashboardState.period === '12mo') {
    return 'Últimos 12 meses'
  }
  if (dashboardState.period === 'year') {
    if (isThisYear(site, dashboardState.date)) {
      return 'Ano até hoje'
    }
    return formatYear(dashboardState.date)
  }
  if (dashboardState.period === 'all') {
    return 'Todo o período'
  }
  if (dashboardState.period === 'custom') {
    return formatDateRange(site, dashboardState.from, dashboardState.to)
  }
  return 'Tempo real'
}

export function getCurrentComparisonPeriodDisplayName({
  dashboardState,
  site
}: {
  dashboardState: DashboardState
  site: PlausibleSite
}) {
  if (!dashboardState.comparison) {
    return null
  }
  return dashboardState.comparison === ComparisonMode.custom &&
    dashboardState.compare_from &&
    dashboardState.compare_to
    ? formatDateRange(
        site,
        dashboardState.compare_from,
        dashboardState.compare_to
      )
    : COMPARISON_MODES[dashboardState.comparison]
}
