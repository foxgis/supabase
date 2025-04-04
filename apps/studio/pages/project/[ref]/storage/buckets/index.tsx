import { useParams } from 'common'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import StorageBucketsError from 'components/layouts/StorageLayout/StorageBucketsError'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useBucketsQuery } from 'data/storage/buckets-query'
import type { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { error, isError } = useBucketsQuery({ projectRef: ref })

  if (!project) return <div></div>

  if (isError) <StorageBucketsError error={error as any} />

  return (
    <div className="storage-container flex flex-grow">
      <ProductEmptyState
        title="文件存储"
        infoButtonLabel="关于文件存储"
        infoButtonUrl="https://supabase.com/docs/guides/storage"
      >
        <p className="text-foreground-light text-sm">
          创建存储桶用于存储和共享各种多媒体文件。
        </p>
        <p className="text-foreground-light text-sm">
          可根据您的安全需求将存储桶设置为私有或者公开。
        </p>
      </ProductEmptyState>
    </div>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="存储桶">{page}</StorageLayout>
  </DefaultLayout>
)

export default PageLayout
