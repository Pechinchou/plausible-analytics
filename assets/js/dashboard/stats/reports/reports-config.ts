import { ApiFilter, NonTimeDimension } from '../../stats-query'
import { Metric } from '../metrics'

export type MetricsByContext = {
  realtimeMetrics: Metric[]
  defaultIndexMetrics: Metric[]
  defaultDetailedMetrics: Metric[]
  goalFilterIndexMetrics: Metric[]
  goalFilterDetailedMetrics: Metric[]
}

export type BreakdownReportConfig = {
  dimensions: [NonTimeDimension, ...NonTimeDimension[]]
  metricsByContext: MetricsByContext
  detailsTitle: string
  detailsPath: string
  dimensionLabel: string
  alwaysOnFilters?: ApiFilter[]
}

const COMMON_METRICS_BY_CONTEXT: MetricsByContext = {
  realtimeMetrics: ['visitors', 'percentage'],
  defaultIndexMetrics: ['visitors', 'percentage'],
  defaultDetailedMetrics: [
    'visitors',
    'percentage',
    'bounce_rate',
    'visit_duration'
  ],
  goalFilterIndexMetrics: ['visitors', 'group_conversion_rate'],
  goalFilterDetailedMetrics: [
    'total_visitors',
    'visitors',
    'group_conversion_rate'
  ]
}

export enum BreakdownReportKey {
  'pages' = 'pages',
  'entryPages' = 'entryPages',
  'exitPages' = 'exitPages',
  'browsers' = 'browsers',
  'browserVersions' = 'browserVersions',
  'operatingSystems' = 'operatingSystems',
  'operatingSystemVersions' = 'operatingSystemVersions',
  'screenSizes' = 'screenSizes',
  'channels' = 'channels',
  'sources' = 'sources',
  'referrers' = 'referrers',
  'utmMediums' = 'utmMediums',
  'utmSources' = 'utmSources',
  'utmCampaigns' = 'utmCampaigns',
  'utmContents' = 'utmContents',
  'utmTerms' = 'utmTerms',
  'countries' = 'countries',
  'regions' = 'regions',
  'cities' = 'cities'
}

export const BREAKDOWN_REPORTS: Record<
  BreakdownReportKey,
  BreakdownReportConfig
> = {
  [BreakdownReportKey.pages]: {
    dimensions: ['event:page'],
    metricsByContext: {
      ...COMMON_METRICS_BY_CONTEXT,
      defaultDetailedMetrics: [
        'visitors',
        'percentage',
        'pageviews',
        'bounce_rate',
        'time_on_page',
        'scroll_depth'
      ]
    },
    detailsTitle: 'Principais páginas',
    detailsPath: 'pages',
    dimensionLabel: 'Página'
  },
  [BreakdownReportKey.entryPages]: {
    dimensions: ['visit:entry_page'],
    metricsByContext: {
      ...COMMON_METRICS_BY_CONTEXT,
      defaultDetailedMetrics: [
        'visitors',
        'percentage',
        'visits',
        'bounce_rate',
        'visit_duration'
      ]
    },
    detailsTitle: 'Páginas de entrada',
    detailsPath: 'entry-pages',
    dimensionLabel: 'Página de entrada',
    alwaysOnFilters: [['is_not', 'visit:entry_page', ['']]]
  },
  [BreakdownReportKey.exitPages]: {
    dimensions: ['visit:exit_page'],
    metricsByContext: {
      ...COMMON_METRICS_BY_CONTEXT,
      defaultDetailedMetrics: ['visitors', 'percentage', 'visits', 'exit_rate']
    },
    detailsTitle: 'Páginas de saída',
    detailsPath: 'exit-pages',
    dimensionLabel: 'Página de saída',
    alwaysOnFilters: [['is_not', 'visit:exit_page', ['']]]
  },
  [BreakdownReportKey.browsers]: {
    dimensions: ['visit:browser'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Navegadores',
    detailsPath: 'browsers',
    dimensionLabel: 'Navegador'
  },
  [BreakdownReportKey.browserVersions]: {
    dimensions: ['visit:browser_version', 'visit:browser'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Versões de navegador',
    detailsPath: 'browser-versions',
    dimensionLabel: 'Versão do navegador'
  },
  [BreakdownReportKey.operatingSystems]: {
    dimensions: ['visit:os'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Sistemas operacionais',
    detailsPath: 'operating-systems',
    dimensionLabel: 'Sistema operacional'
  },
  [BreakdownReportKey.operatingSystemVersions]: {
    dimensions: ['visit:os_version', 'visit:os'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Versões de sistema operacional',
    detailsPath: 'operating-system-versions',
    dimensionLabel: 'Versão do sistema operacional'
  },
  [BreakdownReportKey.screenSizes]: {
    dimensions: ['visit:device'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Dispositivos',
    detailsPath: 'screen-sizes',
    dimensionLabel: 'Dispositivo'
  },
  [BreakdownReportKey.channels]: {
    dimensions: ['visit:channel'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Principais canais de aquisição',
    detailsPath: 'channels',
    dimensionLabel: 'Canal'
  },
  [BreakdownReportKey.sources]: {
    dimensions: ['visit:source'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Principais fontes',
    detailsPath: 'sources',
    dimensionLabel: 'Fonte'
  },
  [BreakdownReportKey.referrers]: {
    dimensions: ['visit:referrer'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'Detalhamento de referência',
    detailsPath: 'referrers/:referrer',
    dimensionLabel: 'Referência'
  },
  [BreakdownReportKey.utmMediums]: {
    dimensions: ['visit:utm_medium'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'UTM mídias',
    detailsPath: 'utm_mediums',
    dimensionLabel: 'UTM mídia',
    alwaysOnFilters: [['is_not', 'visit:utm_medium', ['']]]
  },
  [BreakdownReportKey.utmSources]: {
    dimensions: ['visit:utm_source'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'UTM fontes',
    detailsPath: 'utm_sources',
    dimensionLabel: 'UTM fonte',
    alwaysOnFilters: [['is_not', 'visit:utm_source', ['']]]
  },
  [BreakdownReportKey.utmCampaigns]: {
    dimensions: ['visit:utm_campaign'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'UTM campanhas',
    detailsPath: 'utm_campaigns',
    dimensionLabel: 'UTM campanha',
    alwaysOnFilters: [['is_not', 'visit:utm_campaign', ['']]]
  },
  [BreakdownReportKey.utmContents]: {
    dimensions: ['visit:utm_content'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'UTM conteúdos',
    detailsPath: 'utm_contents',
    dimensionLabel: 'UTM conteúdo',
    alwaysOnFilters: [['is_not', 'visit:utm_content', ['']]]
  },
  [BreakdownReportKey.utmTerms]: {
    dimensions: ['visit:utm_term'],
    metricsByContext: COMMON_METRICS_BY_CONTEXT,
    detailsTitle: 'UTM termos',
    detailsPath: 'utm_terms',
    dimensionLabel: 'UTM termo',
    alwaysOnFilters: [['is_not', 'visit:utm_term', ['']]]
  },
  [BreakdownReportKey.countries]: {
    dimensions: ['visit:country_name', 'visit:country'],
    metricsByContext: {
      ...COMMON_METRICS_BY_CONTEXT,
      defaultDetailedMetrics: ['visitors', 'percentage']
    },
    detailsTitle: 'Principais países',
    detailsPath: 'countries',
    dimensionLabel: 'País',
    alwaysOnFilters: [['is_not', 'visit:country', ['\0\0', 'ZZ']]]
  },
  [BreakdownReportKey.regions]: {
    // the 3rd dimension "visit:country" is needed to render the country flag
    dimensions: ['visit:region_name', 'visit:region', 'visit:country'],
    metricsByContext: {
      ...COMMON_METRICS_BY_CONTEXT,
      defaultDetailedMetrics: ['visitors', 'percentage']
    },
    detailsTitle: 'Principais regiões',
    detailsPath: 'regions',
    dimensionLabel: 'Região',
    alwaysOnFilters: [['is_not', 'visit:region', ['']]]
  },
  [BreakdownReportKey.cities]: {
    // the 3rd dimension "visit:country" is needed to render the country flag
    dimensions: ['visit:city_name', 'visit:city', 'visit:country'],
    metricsByContext: {
      ...COMMON_METRICS_BY_CONTEXT,
      defaultDetailedMetrics: ['visitors', 'percentage']
    },
    detailsTitle: 'Principais cidades',
    detailsPath: 'cities',
    dimensionLabel: 'Cidade',
    alwaysOnFilters: [['is_not', 'visit:city', [0]]]
  }
}
