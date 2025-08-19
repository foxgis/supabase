import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { GISKeys } from './keys'

export type GISTilesVariables = { projectRef?: string }

export type Tile = {
  id: string
  name: string
  description: string
  schema: string
  type: string
  detailurl: string
}

export async function getGISTiles({ projectRef }: GISTilesVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`/api/gis/${projectRef}/tiles`, {
    signal,
  })

  if (response.error) handleError(response.error)

  return Object.values(response) as Tile[]
}

export type GISTilesData = Awaited<ReturnType<typeof getGISTiles>>
export type GISTilesError = ResponseError

export const useGISTilesQuery = <TData = GISTilesData,>(
  { projectRef }: GISTilesVariables,
  { enabled = true, ...options }: UseQueryOptions<GISTilesData, GISTilesError, TData> = {}
) =>
  useQuery<GISTilesData, GISTilesError, TData>(
    GISKeys.listTiles(projectRef),
    ({ signal }) => getGISTiles({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
