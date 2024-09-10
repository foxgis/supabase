export const GISKeys = {
  listTiles: (projectRef: string | undefined) =>
    ['projects', projectRef, 'gis-tiles'] as const,
  listFeatures: (projectRef: string | undefined) =>
    ['projects', projectRef, 'gis-features'] as const,
}
