import { includes, sortBy } from 'lodash'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useGISFeaturesQuery } from 'data/gis/gis-features-query'
import { ArrowUpRight } from 'lucide-react'
import { Button } from 'ui'

interface FeatureListProps {
  schema: string
  filterString: string
}

const FeatureList = ({
  schema,
  filterString,
}: FeatureListProps) => {
  const router = useRouter()
  const { project: selectedProject } = useProjectContext()

  const { data: features } = useGISFeaturesQuery({
    projectRef: selectedProject?.ref
  })

  const filteredFeatures = (features ?? []).filter((x) =>
    includes(x.id.toLowerCase(), filterString.toLowerCase())
  )
  const _features = sortBy(
    filteredFeatures.filter((x) => x.id.startsWith(schema)),
    (feature) => feature.id.toLocaleLowerCase()
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

  if (_features.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={3}>
          <p className="text-sm text-foreground">未找到要素服务</p>
          <p className="text-sm text-foreground-light">
            在模式 "{schema}" 中未找到要素服务
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_features.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={3}>
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
      {_features.map((x) => {
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
            <Table.td className="w-1/5">
              <div className="flex justify-end items-center space-x-2">
                <Button asChild type="default" iconRight={<ArrowUpRight strokeWidth={1} />}>
                  <Link href={`${apiUrl}/pg_featureserv/collections/${x.id}.json`} target="_blank">
                    元数据
                  </Link>
                </Button>
                <Button asChild type="default" iconRight={<ArrowUpRight strokeWidth={1} />}>
                  <Link href={`${apiUrl}/pg_featureserv/collections/${x.id}/items.html`} target="_blank">
                    查看
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

export default FeatureList
