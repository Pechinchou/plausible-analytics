import { Metric as PublicApiMetric } from '../../types/query-api'

export type Metric = PublicApiMetric | 'total_visitors' | 'exit_rate'

const SORTABLE = [
  'visitors',
  'visits',
  'pageviews',
  'views_per_visit',
  'bounce_rate',
  'visit_duration',
  'events',
  'percentage',
  'conversion_rate',
  'group_conversion_rate',
  'time_on_page',
  'total_revenue',
  'average_revenue',
  'scroll_depth',
  'exit_rate'
]

export const isSortable = (metric: Metric): boolean => {
  return SORTABLE.includes(metric)
}

export const getMetricLabel = (
  metric: Metric,
  { hasConversionGoalFilter }: { hasConversionGoalFilter: boolean }
): string => {
  switch (metric) {
    case 'visitors':
      return hasConversionGoalFilter ? 'Conversões únicas' : 'Visitantes únicos'
    case 'events':
      return hasConversionGoalFilter ? 'Total de conversões' : 'Total de eventos'
    case 'visits':
      return 'Total de visitas'
    case 'pageviews':
      return 'Total de visualizações'
    case 'views_per_visit':
      return 'Visualizações por visita'
    case 'bounce_rate':
      return 'Taxa de rejeição'
    case 'visit_duration':
      return 'Duração da visita'
    case 'time_on_page':
      return 'Tempo na página'
    case 'scroll_depth':
      return 'Profundidade de rolagem'
    case 'conversion_rate':
      return 'Taxa de conversão'
    case 'total_revenue':
      return 'Receita total'
    case 'average_revenue':
      return 'Receita média'
    case 'percentage':
      return 'Porcentagem'
    case 'group_conversion_rate':
      return 'Taxa de conversão'
    case 'total_visitors':
      return 'Total de visitantes'
    case 'exit_rate':
      return 'Taxa de saída'
  }
}

export const getBreakdownMetricLabel = (
  metric: Metric,
  {
    hasConversionGoalFilter,
    isRealtime,
    dimensions
  }: {
    hasConversionGoalFilter: boolean
    isRealtime: boolean
    dimensions: string[]
  }
): string => {
  switch (dimensions[0]) {
    case 'visit:entry_page':
      return getEntryPagesBreakdownMetricLabel(metric, {
        hasConversionGoalFilter,
        isRealtime
      })
    case 'visit:exit_page':
      return getExitPagesBreakdownMetricLabel(metric, {
        hasConversionGoalFilter,
        isRealtime
      })
    case 'event:goal':
      return getConversionsBreakdownMetricLabel(metric)
    default:
      return getDefaultBreakdownMetricLabel(metric, {
        hasConversionGoalFilter,
        isRealtime
      })
  }
}

const getEntryPagesBreakdownMetricLabel = (
  metric: Metric,
  {
    hasConversionGoalFilter,
    isRealtime
  }: { hasConversionGoalFilter: boolean; isRealtime: boolean }
): string => {
  if (metric === 'visitors' && !hasConversionGoalFilter && !isRealtime) {
    return 'Entradas únicas'
  }
  if (metric === 'visits' && !hasConversionGoalFilter && !isRealtime) {
    return 'Total de entradas'
  }

  return getDefaultBreakdownMetricLabel(metric, {
    hasConversionGoalFilter,
    isRealtime
  })
}

const getExitPagesBreakdownMetricLabel = (
  metric: Metric,
  {
    hasConversionGoalFilter,
    isRealtime
  }: { hasConversionGoalFilter: boolean; isRealtime: boolean }
): string => {
  if (metric === 'visitors' && !hasConversionGoalFilter && !isRealtime) {
    return 'Saídas únicas'
  }
  if (metric === 'visits' && !hasConversionGoalFilter && !isRealtime) {
    return 'Total de saídas'
  }

  return getDefaultBreakdownMetricLabel(metric, {
    hasConversionGoalFilter,
    isRealtime
  })
}

const getConversionsBreakdownMetricLabel = (metric: Metric): string => {
  switch (metric) {
    case 'visitors':
      return 'Únicos'
    case 'events':
      return 'Total'
    default:
      return getDefaultBreakdownMetricLabel(metric, {
        hasConversionGoalFilter: false,
        isRealtime: false
      })
  }
}

const getDefaultBreakdownMetricLabel = (
  metric: Metric,
  {
    hasConversionGoalFilter,
    isRealtime
  }: { hasConversionGoalFilter: boolean; isRealtime: boolean }
): string => {
  switch (metric) {
    case 'visitors':
      return hasConversionGoalFilter
        ? 'Conversões'
        : isRealtime
          ? 'Visitantes ativos'
          : 'Visitantes'
    case 'group_conversion_rate':
      return 'CR'
    case 'conversion_rate':
      return 'CR'
    case 'average_revenue':
      return 'Média'
    case 'total_revenue':
      return 'Receita'
    case 'pageviews':
      return 'Visualizações'
    default:
      return getMetricLabel(metric, { hasConversionGoalFilter })
  }
}
