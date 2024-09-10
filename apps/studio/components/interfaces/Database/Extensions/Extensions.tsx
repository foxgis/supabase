import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isNull, partition } from 'lodash'
import { AlertCircle, ExternalLink, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Button, Input } from 'ui'
import ExtensionCard from './ExtensionCard'
import ExtensionCardSkeleton from './ExtensionCardSkeleton'
import { HIDDEN_EXTENSIONS, SEARCH_TERMS } from './Extensions.constants'

const Extensions = () => {
  const { filter } = useParams()
  const { project } = useProjectContext()
  const [filterString, setFilterString] = useState<string>('')

  const { data, isLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const extensions =
    filterString.length === 0
      ? data ?? []
      : (data ?? []).filter((ext) => {
          const nameMatchesSearch = ext.name.toLowerCase().includes(filterString.toLowerCase())
          const searchTermsMatchesSearch = (SEARCH_TERMS[ext.name] || []).some((x) =>
            x.includes(filterString.toLowerCase())
          )
          return nameMatchesSearch || searchTermsMatchesSearch
        })
  const extensionsWithoutHidden = extensions.filter((ext) => !HIDDEN_EXTENSIONS.includes(ext.name))
  const [enabledExtensions, disabledExtensions] = partition(
    extensionsWithoutHidden,
    (ext) => !isNull(ext.installed_version)
  )

  const canUpdateExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  useEffect(() => {
    if (filter !== undefined) setFilterString(filter as string)
  }, [filter])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            size="small"
            placeholder="查找扩展"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            className="w-64"
            icon={<Search size={14} />}
          />
          {isPermissionsLoaded && !canUpdateExtensions ? (
            <div className="w-[500px]">
              <InformationBox
                icon={<AlertCircle className="text-foreground-light" size={18} strokeWidth={2} />}
                title="您需要额外的权限才能更新数据库扩展"
              />
            </div>
          ) : (
            <Button className="ml-auto" asChild type="default" icon={<ExternalLink />}>
              <Link
                href="https://supabase.com/docs/guides/database/extensions"
                target="_blank"
                rel="noreferrer"
              >
                文档
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="my-8 w-full space-y-12">
          <div className="space-y-4">
            <ShimmeringLoader className="h-[28px] w-40" />

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ExtensionCardSkeleton key={index} index={index} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {extensions.length === 0 && (
            <NoSearchResults
              searchString={filterString}
              onResetFilter={() => setFilterString('')}
            />
          )}

          <div className="my-8 w-full space-y-12">
            {enabledExtensions.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg">已启用的扩展</h4>
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {enabledExtensions.map((extension) => (
                    <ExtensionCard key={extension.name} extension={extension} />
                  ))}
                </div>
              </div>
            )}

            {disabledExtensions.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg">可用的扩展</h4>
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {disabledExtensions.map((extension) => (
                    <ExtensionCard key={extension.name} extension={extension} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default Extensions
