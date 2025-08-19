import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { GISKeys } from './keys'

export type GISFeaturesVariables = { projectRef?: string }

export type Feature = {
  id: string
  title: string
  description: string
  extent: object
  links: Array<object>
}

export async function getGISFeatures({ projectRef }: GISFeaturesVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const response: any = await get(`/api/gis/${projectRef}/features`, {
    signal,
  })

  if (response.error) handleError(response.error)

  return response.collections as Feature[]
}

export type GISFeaturesData = Awaited<ReturnType<typeof getGISFeatures>>
export type GISFeaturesError = ResponseError

export const useGISFeaturesQuery = <TData = GISFeaturesData,>(
  { projectRef }: GISFeaturesVariables,
  { enabled = true, ...options }: UseQueryOptions<GISFeaturesData, GISFeaturesError, TData> = {}
) =>
  useQuery<GISFeaturesData, GISFeaturesError, TData>(
    GISKeys.listFeatures(projectRef),
    ({ signal }) => getGISFeatures({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
