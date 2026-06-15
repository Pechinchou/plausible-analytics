import React, { useState } from 'react'

import * as storage from '../../util/storage'
import {
  hasConversionGoalFilter,
  isRealTimeDashboard
} from '../../util/filters'
import { useDashboardStateContext } from '../../dashboard-state-context'
import { useSiteContext } from '../../site-context'
import { ReportLayout } from '../reports/report-layout'
import { ReportHeader } from '../reports/report-header'
import { TabButton, TabWrapper } from '../../components/tabs'
import MoreLink from '../more-link'
import { MoreLinkState } from '../more-link-state'
import { QueryApiResponse } from '../../api'
import ImportedWarningBubble from '../imported-warning-bubble'
import {
  BREAKDOWN_REPORTS,
  BreakdownReportKey
} from '../reports/reports-config'
import {
  DimensionCellWithBar,
  IndexBreakdown,
  DimensionCellWithBarProps
} from '../reports/index-breakdown'
import { defaultGetFilterInfo } from '../breakdowns'
import { externalLinkForPage, trimURL } from '../../util/url'
import { IndexExternalLink } from './external-link'

const BAR_COLOR = 'bg-orange-50 group-hover/row:bg-orange-100'
const MAX_DIMENSION_LENGTH = 70

export default function Pages() {
  return (
    <>
      <PageTitlesPanel />
      <PageURLsPanel />
    </>
  )
}

function PageTitlesPanel() {
  const { dashboardState } = useDashboardStateContext()
  const site = useSiteContext()

  const storageKey = `pageTitleTab__${site.domain}`
  const [tab, setTab] = useState<TitleTabKey>(initTitleTab(storage.getItem(storageKey)))
  const [currentData, setCurrentData] = useState<QueryApiResponse | null>(null)

  const reportConfig = BREAKDOWN_REPORTS[tab]
  const metrics = reportConfig.getMetrics({
    isRealtime: isRealTimeDashboard(dashboardState),
    hasConversionGoalFilter: hasConversionGoalFilter(dashboardState)
  })

  function switchTab(tab: TitleTabKey) {
    storage.setItem(storageKey, tab)
    setTab(tab)
  }

  const moreLinkState = currentData
    ? currentData.results.length > 0
      ? MoreLinkState.READY
      : MoreLinkState.HIDDEN
    : MoreLinkState.LOADING

  return (
    <ReportLayout testId="report-page-titles" className="overflow-x-hidden">
      <ReportHeader>
        <div className="flex gap-x-3">
          <TabWrapper>
            {(
              [
                {
                  label: hasConversionGoalFilter(dashboardState)
                    ? 'Páginas de conversão'
                    : 'Páginas em Alta',
                  value: BreakdownReportKey.pageTitles
                },
                { label: 'Páginas de entrada', value: BreakdownReportKey.entryPageTitles },
                { label: 'Páginas de saída', value: BreakdownReportKey.exitPageTitles }
              ] as const
            ).map(({ value, label }) => (
              <TabButton
                key={value}
                active={tab === value}
                onClick={() => switchTab(value)}
              >
                {label}
              </TabButton>
            ))}
          </TabWrapper>
          <ImportedWarningBubble queryApiResponse={currentData} />
        </div>
        <MoreLink state={moreLinkState} linkProps={{ path: reportConfig.detailsPath, search: (s: string) => s }} />
      </ReportHeader>
      <IndexBreakdown
        metrics={metrics}
        dimensions={reportConfig.dimensions}
        dimensionLabel={reportConfig.dimensionLabel}
        alwaysOnFilters={reportConfig.alwaysOnFilters}
        DimensionElement={TitleDimensionCell}
        onDataReady={setCurrentData}
      />
    </ReportLayout>
  )
}

function PageURLsPanel() {
  const { dashboardState } = useDashboardStateContext()
  const site = useSiteContext()

  const storageKey = `pageTab__${site.domain}`
  const [tab, setTab] = useState<URLTabKey>(initTab(storage.getItem(storageKey)))
  const [currentData, setCurrentData] = useState<QueryApiResponse | null>(null)

  const reportKey = getReportKey(tab)
  const reportConfig = BREAKDOWN_REPORTS[reportKey]

  const metrics = reportConfig.getMetrics({
    isRealtime: isRealTimeDashboard(dashboardState),
    hasConversionGoalFilter: hasConversionGoalFilter(dashboardState)
  })

  function switchTab(tab: URLTabKey) {
    storage.setItem(storageKey, tab)
    setTab(tab)
  }

  const moreLinkState = currentData
    ? currentData.results.length > 0
      ? MoreLinkState.READY
      : MoreLinkState.HIDDEN
    : MoreLinkState.LOADING

  return (
    <ReportLayout testId="report-pages" className="overflow-x-hidden">
      <ReportHeader>
        <div className="flex gap-x-3">
          <TabWrapper>
            {(
              [
                {
                  label: hasConversionGoalFilter(dashboardState)
                    ? 'Páginas de conversão'
                    : 'Páginas em Alta',
                  value: BreakdownReportKey.pages
                },
                { label: 'Páginas de entrada', value: BreakdownReportKey.entryPages },
                { label: 'Páginas de saída', value: BreakdownReportKey.exitPages }
              ] as const
            ).map(({ value, label }) => (
              <TabButton
                key={value}
                active={tab === value}
                onClick={() => switchTab(value)}
              >
                {label}
              </TabButton>
            ))}
          </TabWrapper>
          <ImportedWarningBubble queryApiResponse={currentData} />
        </div>
        <MoreLink state={moreLinkState} linkProps={{ path: reportConfig.detailsPath, search: (s: string) => s }} />
      </ReportHeader>
      <IndexBreakdown
        metrics={metrics}
        dimensions={reportConfig.dimensions}
        dimensionLabel={reportConfig.dimensionLabel}
        alwaysOnFilters={reportConfig.alwaysOnFilters}
        DimensionElement={PagesDimensionCell}
        onDataReady={setCurrentData}
      />
    </ReportLayout>
  )
}

function TitleDimensionCell(props: DimensionCellWithBarProps) {
  const title = props.row.dimensions[0] || '(sem título)'
  const displayValue = title.length > MAX_DIMENSION_LENGTH
    ? title.slice(0, MAX_DIMENSION_LENGTH) + '...'
    : title
  return (
    <DimensionCellWithBar
      getFilterInfo={defaultGetFilterInfo}
      text={displayValue}
      barClassName={BAR_COLOR}
      {...props}
    />
  )
}

function PagesDimensionCell(props: DimensionCellWithBarProps) {
  const site = useSiteContext()
  const externalUrl = externalLinkForPage(site, props.row.dimensions[0])
  const displayValue = trimURL(props.row.dimensions[0], MAX_DIMENSION_LENGTH)
  return (
    <DimensionCellWithBar
      getFilterInfo={defaultGetFilterInfo}
      text={displayValue}
      barClassName={BAR_COLOR}
      externalLink={
        externalUrl && (
          <IndexExternalLink href={externalUrl} isActive={props.isActive} />
        )
      }
      {...props}
    />
  )
}

type TitleTabKey =
  | BreakdownReportKey.pageTitles
  | BreakdownReportKey.entryPageTitles
  | BreakdownReportKey.exitPageTitles

const initTitleTab = (storedTab: string): TitleTabKey => {
  switch (storedTab) {
    case BreakdownReportKey.entryPageTitles:
      return BreakdownReportKey.entryPageTitles
    case BreakdownReportKey.exitPageTitles:
      return BreakdownReportKey.exitPageTitles
    default:
      return BreakdownReportKey.pageTitles
  }
}

const initTab = (storedTab: string): URLTabKey => {
  switch (storedTab) {
    case LegacyTabKey.entryPages:
    case BreakdownReportKey.entryPages:
      return BreakdownReportKey.entryPages
    case LegacyTabKey.exitPages:
    case BreakdownReportKey.exitPages:
      return BreakdownReportKey.exitPages
    case BreakdownReportKey.pages:
    default:
      return BreakdownReportKey.pages
  }
}

const getReportKey = (tab: URLTabKey): URLReportKey => tab

type URLTabKey =
  | BreakdownReportKey.pages
  | BreakdownReportKey.entryPages
  | BreakdownReportKey.exitPages

type URLReportKey = URLTabKey

enum LegacyTabKey {
  entryPages = 'entry-pages',
  exitPages = 'exit-pages'
}
