import { includes, sortBy } from 'lodash'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useGISTilesQuery } from 'data/gis/gis-tiles-query'
import { ArrowUpRight } from 'lucide-react'
import { Button } from 'ui'

interface TileListProps {
  schema: string
  filterString: string
}

const TileList = ({
  schema,
  filterString,
}: TileListProps) => {
  const router = useRouter()
  const { project: selectedProject } = useProjectContext()

  const { data: tiles } = useGISTilesQuery({
    projectRef: selectedProject?.ref
  })

  const filteredTiles = (tiles ?? []).filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _tiles = sortBy(
    filteredTiles.filter((x) => x.schema == schema),
    (func) => func.name.toLocaleLowerCase()
  )

  const { data, error } = useProjectApiQuery({ projectRef: selectedProject?.ref })
  const { protocol, endpoint } = data?.autoApiService ?? {}
  const apiUrl = endpoint ? `${protocol ?? 'http'}://${endpoint}` : undefined

  if (error) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-foreground-light">
          <p>连接到 API 出错</p>
          <p>{`${error}`}</p>
        </p>
      </div>
    )
  }

  if (_tiles.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">未找到瓦片服务</p>
          <p className="text-sm text-foreground-light">
            在模式 "{schema}" 中未找到瓦片服务
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_tiles.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">未找到结果</p>
          <p className="text-sm text-foreground-light">
            您搜索的 "{filterString}" 没有返回任何结果
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  return (
    <>
      {_tiles.map((x) => {
        return (
          <Table.tr key={x.id}>
            <Table.td className="truncate">
              <p title={x.id}>{x.id}</p>
            </Table.td>
            <Table.td className="hidden md:table-cell md:overflow-auto">
              {x.description ? (
                <span className="lg:max-w-48 truncate inline-block" title={x.description}>
                  {x.description}
                </span>
              ) : (
                <p className="text-border-stronger">无描述信息</p>
              )}
            </Table.td>
            <Table.td className="hidden lg:table-cell w-[120px]">
              <p title={x.type}>{x.type}</p>
            </Table.td>
            <Table.td className="w-1/5">
              <div className="flex justify-end items-center space-x-2">
                <Button asChild type="default" iconRight={<ArrowUpRight strokeWidth={1} />}>
                  <Link href={`${apiUrl}/pg_tileserv/${x.id}.json`} target="_blank">
                    详情
                  </Link>
                </Button>
                <Button asChild type="default" iconRight={<ArrowUpRight strokeWidth={1} />}>
                  <Link href={`${apiUrl}/pg_tileserv/${x.id}.html`} target="_blank">
                    预览
                  </Link>
                </Button>
              </div>
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}

export default TileList
