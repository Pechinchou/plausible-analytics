import React, { useState, useEffect, useCallback } from 'react'
import * as storage from '../../util/storage'
import ImportedQueryUnsupportedWarning from '../imported-query-unsupported-warning'
import Properties from './props'
import { FeatureSetupNotice } from '../../components/feature-setup-notice'
import {
  ExplorationPreviewMock,
  FunnelsPreviewMock,
  PropertiesPreviewMock
} from '../../components/feature-preview-mocks'
import {
  hasConversionGoalFilter,
  getGoalFilter,
  FILTER_OPERATIONS
} from '../../util/filters'
import { useSiteContext } from '../../site-context'
import { useDashboardStateContext } from '../../dashboard-state-context'
import { useUserContext } from '../../user-context'
import { DropdownTabButton, TabButton, TabWrapper } from '../../components/tabs'
import { ReportLayout } from '../reports/report-layout'
import { ReportHeader } from '../reports/report-header'
import MoreLink from '../more-link'
import { MoreLinkState } from '../more-link-state'
import { Pill } from '../../components/pill'
import * as api from '../../api'
import * as url from '../../util/url'
import { conversionsRoute, customPropsRoute } from '../../router'
import {
  Mode,
  getFirstPreferenceFromEnabledModes,
  ModesContextProvider,
  useModesContext
} from './modes-context'
import { SpecialGoalPropBreakdown } from './special-goal-prop-breakdown'
import Conversions from './conversions'
import { getSpecialGoal, isPageViewGoal, isSpecialGoal } from '../../util/goals'

/*global BUILD_EXTRA*/
/*global require*/
function maybeRequireFunnels() {
  if (BUILD_EXTRA) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../extra/funnel')
  } else {
    return { default: null }
  }
}

function maybeRequireExploration() {
  if (BUILD_EXTRA) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../extra/exploration')
  } else {
    return { default: null }
  }
}

const Funnel = maybeRequireFunnels().default
const FunnelExploration = maybeRequireExploration().default

function singleGoalFilterApplied(dashboardState) {
  const goalFilter = getGoalFilter(dashboardState)
  if (goalFilter) {
    const [operation, _filterKey, clauses] = goalFilter
    return operation === FILTER_OPERATIONS.is && clauses.length === 1
  } else {
    return false
  }
}

const STORAGE_KEYS = {
  getForTab: ({ site }) =>
    storage.getDomainScopedStorageKey('behavioursTab', site.domain),
  getForFunnel: ({ site }) =>
    storage.getDomainScopedStorageKey('behavioursTabFunnel', site.domain),
  getForPropKey: ({ site }) =>
    storage.getDomainScopedStorageKey('prop_key', site.domain),
  getForPropKeyForGoal: ({ goalName, site }) => {
    return storage.getDomainScopedStorageKey(
      `${goalName}__prop_key)`,
      site.domain
    )
  }
}

function getPropKeyFromStorage({ site, dashboardState }) {
  if (singleGoalFilterApplied(dashboardState)) {
    const [_operation, _dimension, [goalName]] = getGoalFilter(dashboardState)
    const storedForGoal = storage.getItem(
      STORAGE_KEYS.getForPropKeyForGoal({ goalName, site })
    )
    if (storedForGoal) {
      return storedForGoal
    }
  }

  return storage.getItem(STORAGE_KEYS.getForPropKey({ site }))
}

function storePropKey({ site, propKey, dashboardState }) {
  if (singleGoalFilterApplied(dashboardState)) {
    const [_operation, _dimension, [goalName]] = getGoalFilter(dashboardState)
    storage.setItem(
      STORAGE_KEYS.getForPropKeyForGoal({ goalName, site }),
      propKey
    )
  } else {
    storage.setItem(STORAGE_KEYS.getForPropKey({ site }), propKey)
  }
}

function getDefaultSelectedFunnel({ site }) {
  const stored = storage.getItem(STORAGE_KEYS.getForFunnel({ site }))
  const storedExists = stored && site.funnels.some((f) => f.name === stored)

  if (storedExists) {
    return stored
  } else if (site.funnels.length > 0) {
    const firstAvailable = site.funnels[0].name
    storage.setItem(STORAGE_KEYS.getForFunnel({ site }), firstAvailable)
    return firstAvailable
  }
}

function Behaviours({ importedDataInView, setMode, mode }) {
  const { dashboardState } = useDashboardStateContext()
  const goalFilter = getGoalFilter(dashboardState)
  const specialGoal = goalFilter ? getSpecialGoal(goalFilter) : null
  const site = useSiteContext()
  const user = useUserContext()
  const { enabledModes, disableMode } = useModesContext()
  const adminAccess = ['owner', 'admin', 'editor', 'super_admin'].includes(
    user.role
  )
  const [loading, setLoading] = useState(true)

  const [selectedFunnel, setSelectedFunnel] = useState(
    getDefaultSelectedFunnel({ site })
  )
  const initialSelectedPropKey =
    getPropKeyFromStorage({ site, dashboardState }) || null
  const [selectedPropKey, setSelectedPropKey] = useState(initialSelectedPropKey)
  const [propertyKeys, setPropertyKeys] = useState(
    selectedPropKey !== null ? [selectedPropKey] : []
  )

  const [showingPropsForGoalFilter, setShowingPropsForGoalFilter] =
    useState(false)

  const [skipImportedReason, setSkipImportedReason] = useState(null)
  const [moreLinkState, setMoreLinkState] = useState(MoreLinkState.LOADING)

  const onGoalFilterClick = useCallback(
    (e) => {
      const goalName = e.target.innerHTML
      const isSpecial = isSpecialGoal(goalName)
      const isPageview = isPageViewGoal(goalName)

      if (
        !isSpecial &&
        !isPageview &&
        enabledModes.includes(Mode.PROPS) &&
        site.hasProps
      ) {
        setShowingPropsForGoalFilter(true)
        setMode(Mode.PROPS)
      }
    },
    [enabledModes, setMode, site.hasProps]
  )

  useEffect(() => {
    const justRemovedGoalFilter = !hasConversionGoalFilter(dashboardState)
    if (
      mode === Mode.PROPS &&
      justRemovedGoalFilter &&
      showingPropsForGoalFilter
    ) {
      setShowingPropsForGoalFilter(false)
      setMode(Mode.CONVERSIONS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConversionGoalFilter(dashboardState)])

  useEffect(() => setLoading(true), [dashboardState, mode])
  useEffect(() => {
    if (mode === Mode.PROPS && !selectedPropKey) {
      setMoreLinkState(MoreLinkState.HIDDEN)
    } else {
      setMoreLinkState(MoreLinkState.LOADING)
    }
  }, [dashboardState, mode, selectedPropKey])

  function setFunnelFactory(selectedFunnelName) {
    return () => {
      storage.setItem(STORAGE_KEYS.getForTab({ site }), Mode.FUNNELS)
      storage.setItem(STORAGE_KEYS.getForFunnel({ site }), selectedFunnelName)
      setMode(Mode.FUNNELS)
      setSelectedFunnel(selectedFunnelName)
    }
  }

  function setPropKeyFactory(selectedPropKeyName) {
    return () => {
      storage.setItem(STORAGE_KEYS.getForTab({ site }), Mode.PROPS)
      storePropKey({ site, propKey: selectedPropKeyName, dashboardState })
      setMode(Mode.PROPS)
      setSelectedPropKey(selectedPropKeyName)
    }
  }

  useEffect(() => {
    // Fetch property keys when PROPS mode is enabled (not just when active)
    // This ensures the dropdown appears immediately on page refresh
    if (
      enabledModes.includes(Mode.PROPS) &&
      site.hasProps &&
      site.propsAvailable
    ) {
      api
        .get(url.apiPath(site, '/suggestions/prop_key'), dashboardState, {
          q: ''
        })
        .then((propKeys) => {
          const propKeyValues = propKeys.map((entry) => entry.value)
          setPropertyKeys(propKeyValues)
          if (propKeyValues.length > 0) {
            const stored = getPropKeyFromStorage({ site, dashboardState })
            const storedExists = stored && propKeyValues.includes(stored)

            if (storedExists) {
              setSelectedPropKey(stored)
            } else {
              const firstAvailable = propKeyValues[0]
              setSelectedPropKey(firstAvailable)
              storePropKey({ site, propKey: firstAvailable, dashboardState })
            }
          } else {
            setSelectedPropKey(null)
          }
        })
        .catch((error) => {
          console.error('Failed to fetch property keys:', error)
          setPropertyKeys([])
          setSelectedPropKey(null)
        })
    } else {
      // Clear property keys when PROPS is not available
      setPropertyKeys([])
      setSelectedPropKey(null)
    }
  }, [site, dashboardState, enabledModes])

  function setTabFactory(tab) {
    return () => {
      storage.setItem(STORAGE_KEYS.getForTab({ site }), tab)
      setMode(tab)
    }
  }

  function afterFetchData(apiResponse) {
    setLoading(false)
    setSkipImportedReason(apiResponse.skip_imported_reason)
    if (apiResponse.results && apiResponse.results.length > 0) {
      setMoreLinkState(MoreLinkState.READY)
    } else {
      setMoreLinkState(MoreLinkState.HIDDEN)
    }
  }

  function renderConversions() {
    if (site.hasGoals) {
      if (specialGoal) {
        return (
          <SpecialGoalPropBreakdown
            prop={specialGoal.prop}
            afterFetchData={afterFetchData}
          />
        )
      } else {
        return (
          <Conversions
            onGoalFilterClick={onGoalFilterClick}
            afterFetchData={afterFetchData}
          />
        )
      }
    } else if (adminAccess) {
      return (
        <FeatureSetupNotice
          feature={Mode.CONVERSIONS}
          title={'Meça com que frequência visitantes completam ações específicas'}
          info={
            'Metas permitem rastrear cadastros, cliques em botões, preenchimentos de formulários, cliques em links externos, downloads de arquivos, páginas 404 e muito mais.'
          }
          callToAction={{
            action: 'Configurar metas',
            link: `/${encodeURIComponent(site.domain)}/settings/goals`
          }}
          onHideAction={() => disableMode(Mode.CONVERSIONS)}
        />
      )
    } else {
      return noDataYet()
    }
  }

  function renderExploration() {
    if (FunnelExploration === null) {
      return featureUnavailable()
    }

    if (site.explorationAvailable) {
      return <FunnelExploration />
    }

    const callToAction = { action: 'Fazer upgrade', link: '/billing/choose-plan' }

    return (
      <FeatureSetupNotice
        feature={Mode.EXPLORATION}
        title={'Explore jornadas de usuários'}
        info={
          'Veja como visitantes se movem entre páginas e eventos para entender o comportamento de navegação.'
        }
        callToAction={callToAction}
        secondaryCallToAction={{
          action: 'Saiba mais',
          link: 'https://plausible.io/docs/user-journeys'
        }}
        onHideAction={null}
        previewMock={<ExplorationPreviewMock />}
      />
    )
  }

  function renderFunnels() {
    if (Funnel === null) {
      return featureUnavailable()
    } else if (Funnel && selectedFunnel && site.funnelsAvailable) {
      return <Funnel funnelName={selectedFunnel} />
    } else if (Funnel && adminAccess) {
      let callToAction

      if (site.funnelsAvailable) {
        callToAction = {
          action: 'Configurar funis',
          link: `/${encodeURIComponent(site.domain)}/settings/funnels`
        }
      } else {
        callToAction = { action: 'Fazer upgrade', link: '/billing/choose-plan' }
      }

      return (
        <FeatureSetupNotice
          feature={Mode.FUNNELS}
          title={'Analise funis de conversão'}
          info={
            'Meça taxas de conversão entre cada etapa e identifique onde os visitantes abandonam.'
          }
          callToAction={callToAction}
          onHideAction={() => disableMode(Mode.FUNNELS)}
          previewMock={
            !site.funnelsAvailable ? <FunnelsPreviewMock /> : undefined
          }
        />
      )
    } else {
      return noDataYet()
    }
  }

  function renderProps() {
    if (site.hasProps && site.propsAvailable) {
      return (
        <Properties propKey={selectedPropKey} afterFetchData={afterFetchData} />
      )
    } else if (adminAccess) {
      let callToAction

      if (site.propsAvailable) {
        callToAction = {
          action: 'Configurar propriedades',
          link: `/${encodeURIComponent(site.domain)}/settings/properties`
        }
      } else {
        callToAction = { action: 'Fazer upgrade', link: '/billing/choose-plan' }
      }

      return (
        <FeatureSetupNotice
          feature={Mode.PROPS}
          title={'Adicione seus próprios dados às estatísticas'}
          info={
            'Crie métricas personalizadas e analise dados específicos do seu negócio.'
          }
          callToAction={callToAction}
          onHideAction={() => disableMode(Mode.PROPS)}
          previewMock={
            !site.propsAvailable ? <PropertiesPreviewMock /> : undefined
          }
        />
      )
    } else {
      return noDataYet()
    }
  }

  function noDataYet() {
    return (
      <div className="flex-1 flex items-center justify-center font-medium text-gray-500 dark:text-gray-400">
        Sem dados ainda
      </div>
    )
  }

  function featureUnavailable() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-medium text-gray-500 dark:text-gray-400">
        <span>This report is available in Plausible Cloud</span>
        <a
          className="flex items-center gap-x-1.5 mt-4 button px-2 sm:px-4"
          href="https://plausible.io"
        >
          Learn more
        </a>
      </div>
    )
  }

  function renderContent() {
    switch (mode) {
      case Mode.CONVERSIONS:
        return renderConversions()
      case Mode.PROPS:
        return renderProps()
      case Mode.FUNNELS:
        return renderFunnels()
      case Mode.EXPLORATION:
        return renderExploration()
    }
  }

  function getMoreLinkProps() {
    switch (mode) {
      case Mode.CONVERSIONS:
        return specialGoal
          ? {
              path: customPropsRoute.path,
              params: { propKey: url.maybeEncodeRouteParam(specialGoal.prop) },
              search: (search) => search
            }
          : {
              path: conversionsRoute.path,
              search: (search) => search
            }
      case Mode.PROPS:
        if (!selectedPropKey) {
          return null
        }
        return {
          path: customPropsRoute.path,
          params: { propKey: url.maybeEncodeRouteParam(selectedPropKey) },
          search: (search) => search
        }
      default:
        return null
    }
  }

  function isEnabled(mode) {
    return enabledModes.includes(mode)
  }

  function isRealtime() {
    return dashboardState.period === 'realtime'
  }

  function renderImportedQueryUnsupportedWarning() {
    if (mode === Mode.CONVERSIONS) {
      return (
        <ImportedQueryUnsupportedWarning
          loading={loading}
          skipImportedReason={skipImportedReason}
        />
      )
    } else if (mode === Mode.PROPS) {
      return (
        <ImportedQueryUnsupportedWarning
          loading={loading}
          skipImportedReason={skipImportedReason}
          message="Dados importados indisponíveis nesta visualização"
        />
      )
    } else {
      return (
        <ImportedQueryUnsupportedWarning
          altCondition={importedDataInView}
          message="Dados importados indisponíveis nesta visualização"
        />
      )
    }
  }

  if (!mode) {
    return null
  }

  return (
    <ReportLayout testId="report-behaviours" className="col-span-full">
      <ReportHeader>
        <div className="flex gap-x-2">
          <TabWrapper>
            {isEnabled(Mode.CONVERSIONS) &&
              (specialGoal ? (
                <TabButton
                  active={mode === Mode.CONVERSIONS}
                  onClick={setTabFactory(Mode.CONVERSIONS)}
                >
                  {specialGoal.title}
                </TabButton>
              ) : (
                <TabButton
                  active={mode === Mode.CONVERSIONS}
                  onClick={setTabFactory(Mode.CONVERSIONS)}
                >
                  Metas
                </TabButton>
              ))}
            {isEnabled(Mode.PROPS) &&
            !!propertyKeys.length &&
            site.propsAvailable ? (
              <DropdownTabButton
                className="md:relative"
                transitionClassName="md:left-auto md:w-88 md:origin-top-right"
                active={mode === Mode.PROPS}
                options={propertyKeys.map((key) => ({
                  label: key,
                  onClick: setPropKeyFactory(key),
                  selected: selectedPropKey === key
                }))}
                searchable={true}
              >
                Propriedades
              </DropdownTabButton>
            ) : (
              <TabButton
                active={mode === Mode.PROPS}
                onClick={setTabFactory(Mode.PROPS)}
              >
                Propriedades
              </TabButton>
            )}
            {!site.isConsolidatedView &&
              isEnabled(Mode.FUNNELS) &&
              Funnel &&
              (site.funnels.length > 0 && site.funnelsAvailable ? (
                <DropdownTabButton
                  className="md:relative"
                  transitionClassName="md:left-auto md:w-88 md:origin-top-right"
                  active={mode === Mode.FUNNELS}
                  options={site.funnels.map(({ name }) => ({
                    label: name,
                    onClick: setFunnelFactory(name),
                    selected: mode === Mode.FUNNELS && selectedFunnel === name
                  }))}
                  searchable={true}
                >
                  Funis
                </DropdownTabButton>
              ) : (
                <TabButton
                  active={mode === Mode.FUNNELS}
                  onClick={setTabFactory(Mode.FUNNELS)}
                >
                  Funis
                </TabButton>
              ))}
            {!site.isConsolidatedView && isEnabled(Mode.EXPLORATION) && (
              <TabButton
                active={mode === Mode.EXPLORATION}
                onClick={setTabFactory(Mode.EXPLORATION)}
              >
                Explorar
              </TabButton>
            )}
          </TabWrapper>
          {isRealtime() && <Pill className="-mt-1">últimos 30min</Pill>}
          {renderImportedQueryUnsupportedWarning()}
        </div>
        {![Mode.FUNNELS, Mode.EXPLORATION].includes(mode) && (
          <MoreLink state={moreLinkState} linkProps={getMoreLinkProps()} />
        )}
      </ReportHeader>
      {renderContent()}
    </ReportLayout>
  )
}

function BehavioursOuter({ importedDataInView }) {
  const site = useSiteContext()
  const { enabledModes } = useModesContext()
  const [mode, setMode] = useState(null)

  useEffect(() => {
    const storedMode = storage.getItem(STORAGE_KEYS.getForTab({ site }))
    // updates current mode when available modes change (if needed), loads user's stored mode
    setMode((currentMode) =>
      getFirstPreferenceFromEnabledModes(
        [currentMode, storedMode],
        enabledModes
      )
    )
  }, [enabledModes, site])

  return enabledModes.length && mode ? (
    <Behaviours
      importedDataInView={importedDataInView}
      mode={mode}
      setMode={setMode}
    />
  ) : null
}

export default function BehavioursWrapped({ importedDataInView }) {
  return (
    <ModesContextProvider>
      <BehavioursOuter importedDataInView={importedDataInView} />
    </ModesContextProvider>
  )
}
