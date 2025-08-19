import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import CreateBucketModal from 'components/interfaces/Storage/CreateBucketModal'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Menu } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
} from 'ui-patterns/InnerSideMenu'
import BucketRow from './BucketRow'

const StorageMenu = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const { data: projectDetails } = useSelectedProjectQuery()
  const snap = useStorageExplorerStateSnapshot()
  const isBranch = projectDetails?.parent_project_ref !== undefined

  const [searchText, setSearchText] = useState<string>('')

  const page = router.pathname.split('/')[4] as
    | undefined
    | 'policies'
    | 'settings'
    | 'usage'
    | 'logs'

  const {
    data: buckets = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useBucketsQuery({ projectRef: ref })
  const sortedBuckets =
    snap.sortBucket === 'alphabetical'
      ? buckets.sort((a, b) =>
          a.name.toLowerCase().trim().localeCompare(b.name.toLowerCase().trim())
        )
      : buckets.sort((a, b) => (new Date(b.created_at) > new Date(a.created_at) ? -1 : 1))
  const filteredBuckets =
    searchText.length > 1
      ? sortedBuckets.filter((bucket) => bucket.name.includes(searchText.trim()))
      : sortedBuckets
  const tempNotSupported = error?.message.includes('Tenant config') && isBranch

  return (
    <>
      <Menu type="pills" className="mt-6 flex flex-grow flex-col">
        <div className="mb-6 mx-5 flex flex-col gap-y-1.5">
          <CreateBucketModal />

          <InnerSideBarFilters className="px-0">
            <InnerSideBarFilterSearchInput
              name="search-buckets"
              aria-labelledby="查找存储桶"
              placeholder="查找存储桶..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
              }}
            >
              <InnerSideBarFilterSortDropdown
                value={snap.sortBucket}
                onValueChange={(value: any) => snap.setSortBucket(value)}
              >
                <InnerSideBarFilterSortDropdownItem
                  key="alphabetical"
                  value="alphabetical"
                  className="flex gap-2"
                >
                  名称
                </InnerSideBarFilterSortDropdownItem>
                <InnerSideBarFilterSortDropdownItem key="created-at" value="created-at">
                  创建时间
                </InnerSideBarFilterSortDropdownItem>
              </InnerSideBarFilterSortDropdown>
            </InnerSideBarFilterSearchInput>
          </InnerSideBarFilters>
        </div>

        <div className="space-y-6">
          <div className="mx-3">
            <Menu.Group title={<span className="uppercase font-mono">存储桶</span>} />

            {isLoading && (
              <div className="space-y-2 mx-2">
                <ShimmeringLoader className="!py-2.5" />
                <ShimmeringLoader className="!py-2.5" />
                <ShimmeringLoader className="!py-2.5" />
              </div>
            )}

            {isError && (
              <div className="px-2">
                <Alert_Shadcn_ variant={tempNotSupported ? 'default' : 'warning'}>
                  <AlertTitle_Shadcn_ className="text-xs tracking-normal">
                    {tempNotSupported
                      ? '文件存储功能目前不支持预览分支'
                      : '拉取存储桶失败'}
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="text-xs">
                    {tempNotSupported
                      ? '我们正在积极调查如何在预览分支中启用此功能'
                      : '请刷新重试'}
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              </div>
            )}

            {isSuccess && (
              <>
                {buckets.length === 0 && (
                  <InnerSideBarEmptyPanel
                    className="mx-2"
                    title="无可用存储桶"
                    description="您创建的存储桶将在这里显示"
                  />
                )}
                {searchText.length > 0 && filteredBuckets.length === 0 && (
                  <InnerSideBarEmptyPanel
                    className="mx-2"
                    title="未找到结果"
                    description={`您查询的 "${searchText}" 没有返回任何结果`}
                  />
                )}
                {filteredBuckets.map((bucket, idx: number) => {
                  const isSelected = bucketId === bucket.id
                  return (
                    <BucketRow
                      key={`${idx}_${bucket.id}`}
                      bucket={bucket}
                      projectRef={ref}
                      isSelected={isSelected}
                    />
                  )
                })}
              </>
            )}
          </div>

          <div className="w-full bg-dash-sidebar px-3 py-6 sticky bottom-0 border-t border-border">
            <Menu.Group title={<span className="uppercase font-mono">配置</span>} />
            <Link href={`/project/${ref}/storage/policies`}>
              <Menu.Item rounded active={page === 'policies'}>
                <p className="truncate">存储策略</p>
              </Menu.Item>
            </Link>
            <Link href={`/project/${ref}/storage/settings`}>
              <Menu.Item rounded active={page === 'settings'}>
                <p className="truncate">设置</p>
              </Menu.Item>
            </Link>
          </div>
        </div>
      </Menu>
    </>
  )
}

export default StorageMenu
