import React, { useEffect, useMemo } from 'react'
import { numberShortFormatter } from '../../util/number-formatter'
import RocketIcon from '../modals/rocket-icon'
import LazyLoader from '../../components/lazy-loader'
import { PlausibleSite, useSiteContext } from '../../site-context'
import {
  SearchTermsErrorCode,
  SearchTermsErrorPayload,
  SearchTermsResultItem,
  SearchTermsSuccessResponse,
  useIndexGoogleSearchTermsQuery
} from './fetch-search-terms'
import {
  Bar,
  DEFAULT_METRIC_COLUMN_WIDTH,
  IndexBreakdownRenderer
} from '../reports/index-breakdown'
import { ColumnConfiguration, MetricValueWrapper } from '../breakdowns'

function ErrorMessage({ code }: { code: SearchTermsErrorCode }): JSX.Element {
  if (code === 'not_configured') {
    return <div>O site não está conectado ao Google Search Keywords</div>
  } else if (code === 'unsupported_filters') {
    return (
      <div>
        Não foi possível buscar dados de palavras-chave do Search Console porque ele não suporta os filtros atuais
      </div>
    )
  } else if (code === 'period_too_recent') {
    return (
      <div>
        Nenhum termo de busca foi encontrado para este período. Ajuste ou amplie seu intervalo de tempo. Consulte{' '}
        <a
          href="https://plausible.io/docs/google-search-console-integration#i-dont-see-google-search-query-data-in-my-dashboard"
          target="_blank"
          rel="noreferrer"
          className="hover:underline text-indigo-700 dark:text-indigo-500"
        >
          nossa documentação
        </a>{' '}
        for more details.
      </div>
    )
  } else {
    return <div>Não foi possível buscar dados de palavras-chave do Search Console</div>
  }
}

function ConfigureSearchTermsCTA({
  site
}: {
  site: PlausibleSite
}): JSX.Element {
  return (
    <>
      <div>Configure a integração para ver os termos de busca</div>
      <a
        href={`/${encodeURIComponent(site.domain)}/settings/integrations`}
        className="button mt-4"
      >
        Conectar com o Google
      </a>
    </>
  )
}

export function SearchTerms({
  onDataReady
}: {
  onDataReady: (data: SearchTermsSuccessResponse) => void
}) {
  const site = useSiteContext()

  const [visible, setVisible] = React.useState(false)

  const apiState = useIndexGoogleSearchTermsQuery({ enabled: visible })

  useEffect(() => {
    if (apiState.data) {
      onDataReady(apiState.data)
    }
  }, [apiState.data, onDataReady])

  const barMaxValue = useMemo(() => {
    if (!apiState.data) return null
    return Math.max(...apiState.data.results.map((item) => item.visitors))
  }, [apiState.data])

  const columns = useMemo(():
    | ColumnConfiguration<SearchTermsResultItem>[]
    | null => {
    if (barMaxValue === null) {
      return null
    }

    return [
      {
        key: 'dimension',
        renderLabel: () => 'Termo de busca',
        renderCell: (item, _isActive) => (
          <Bar
            barWidthPercent={(item.visitors / barMaxValue) * 100}
            className="bg-blue-50 group-hover/row:bg-blue-100"
          >
            {item.name}
          </Bar>
        ),
        align: 'left'
      },
      {
        key: 'visitors',
        renderLabel: () => 'Visitantes',
        renderCell: (item, _isActive) => (
          <MetricValueWrapper>
            {numberShortFormatter(item.visitors)}
          </MetricValueWrapper>
        ),
        width: DEFAULT_METRIC_COLUMN_WIDTH,
        align: 'right'
      }
    ]
  }, [barMaxValue])

  if (apiState.error) {
    const { is_admin, error_code } = apiState.error
      .payload as SearchTermsErrorPayload

    return (
      <div className="text-center text-gray-700 dark:text-gray-300 text-sm mt-20">
        <RocketIcon />
        <ErrorMessage code={error_code} />
        {error_code === 'not_configured' && is_admin && (
          <ConfigureSearchTermsCTA site={site} />
        )}
      </div>
    )
  }
  return (
    <LazyLoader onVisible={() => setVisible(true)}>
      <IndexBreakdownRenderer<SearchTermsResultItem>
        {...apiState}
        rows={apiState.data?.results ?? []}
        getDimensionValue={(row) => row.name}
        isRealtimeSilentUpdate={false}
        columns={columns}
      />
    </LazyLoader>
  )
}
