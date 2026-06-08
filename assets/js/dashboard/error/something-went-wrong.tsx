import React, { ReactNode } from 'react'
import RocketIcon from '../stats/modals/rocket-icon'
import { useInRouterContext } from 'react-router-dom'
import { PlausibleSite } from '../site-context'
import { getRouterBasepath, rootRoute } from '../router'
import { AppNavigationLink } from '../navigation/use-app-navigate'

export function SomethingWentWrongMessage({
  error,
  callToAction = null
}: {
  error: unknown
  callToAction?: ReactNode
}) {
  return (
    <div className="text-center text-gray-900 dark:text-gray-100 mt-36">
      <RocketIcon />
      <div className="text-lg">
        <span className="font-bold">Ops! Algo deu errado.</span>
        {!!callToAction && ' '}
        {callToAction}
      </div>
      <div className="text-md font-mono mt-2">
        {error instanceof Error
          ? [error.name, error.message].join(': ')
          : 'Erro desconhecido'}
      </div>
    </div>
  )
}

const linkClass =
  'hover:underline text-indigo-600 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-600'

export function GoBackToDashboard({
  site
}: {
  site: Pick<PlausibleSite, 'domain' | 'shared'>
}) {
  const canUseAppLink = useInRouterContext()
  const linkText = 'ir para o painel'

  return (
    <span>
      <>Tente voltar ou </>
      {canUseAppLink ? (
        <AppNavigationLink path={rootRoute.path} className={linkClass}>
          {linkText}
        </AppNavigationLink>
      ) : (
        <a href={getRouterBasepath(site)} className={linkClass}>
          {linkText}
        </a>
      )}
    </span>
  )
}

export function GoToSites() {
  return (
    <>
      <>Tente voltar ou </>
      <a href={'/sites'} className={linkClass}>
        {'ir para seus sites'}
      </a>
    </>
  )
}
