export const GISKeys = {
  listTiles: (projectRef: string | undefined) =>
    ['projects', projectRef, 'gis-tiles'] as const,
}
