import { Search } from 'lucide-react'
import { partition } from 'lodash'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useGISTilesQuery } from 'data/gis/gis-tiles-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { Input } from 'ui'
import ProtectedSchemaWarning from 'components/interfaces/Database/ProtectedSchemaWarning'
import TileList from './TileList'

const TilesList = () => {
  const { project } = useProjectContext()
  const router = useRouter()
  const { search } = useParams()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const filterString = search ?? ''

  const setFilterString = (str: string) => {
    const url = new URL(document.URL)
    if (str === '') {
      url.searchParams.delete('search')
    } else {
      url.searchParams.set('search', str)
    }
    router.push(url)
  }

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    PROTECTED_SCHEMAS.includes(schema?.name ?? '')
  )
  const foundSchema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === foundSchema?.id)

  const {
    data: tiles,
    error,
    isLoading,
    isError,
  } = useGISTilesQuery({
    projectRef: project?.ref,
  })

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="获取瓦片服务列表失败" />

  return (
    <>
      {(tiles ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="瓦片服务"
          >
            <p className="text-sm text-foreground-light">
              瓦片服务是通过数据库动态生成的矢量切片，用户可以在地图上查看和使用。
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SchemaSelector
                className="w-[260px]"
                size="small"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={(schema) => {
                  const url = new URL(document.URL)
                  url.searchParams.delete('search')
                  router.push(url)
                  setSelectedSchema(schema)
                }}
              />
              <Input
                placeholder="查找瓦片服务"
                size="small"
                icon={<Search size={14} />}
                value={filterString}
                className="w-64"
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="瓦片服务" />}

          <Table
            className="table-fixed"
            head={
              <>
                <Table.th key="id">服务 ID</Table.th>
                <Table.th key="description" className="hidden md:table-cell">
                  服务描述
                </Table.th>
                <Table.th key="buttons" className="w-1/5"></Table.th>
              </>
            }
            body={
              <TileList
                schema={selectedSchema}
                filterString={filterString}
              />
            }
          />
        </div>
      )}
    </>
  )
}

export default TilesList
