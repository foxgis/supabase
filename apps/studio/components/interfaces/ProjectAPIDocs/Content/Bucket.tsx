import { useParams } from 'common'
import { Badge } from 'ui'

import { useBucketsQuery } from 'data/storage/buckets-query'
import { formatBytes } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { DOCS_RESOURCE_CONTENT } from '../ProjectAPIDocs.constants'
import ResourceContent from '../ResourceContent'
import type { ContentProps } from './Content.types'

const Bucket = ({ language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data } = useBucketsQuery({ projectRef: ref })

  const resource = snap.activeDocsSection[1]
  const buckets = data ?? []
  const bucket = buckets.find((b) => b.name === resource)
  const allowedMimeTypes = bucket?.allowed_mime_types
  const maxFileSizeLimit = bucket?.file_size_limit

  if (bucket === undefined) return null

  return (
    <div className="divide-y">
      <div className="space-y-1 px-4 py-4">
        <div className="flex items-center space-x-2">
          <h2>{bucket.name}</h2>
          <Badge variant={bucket.public ? 'warning' : 'default'}>
            {bucket.public ? '公开' : '私有'}
          </Badge>
        </div>
        <p className="text-sm text-foreground-light">
          允许的多媒体类型：
          {allowedMimeTypes === null
            ? '允许所有类型'
            : (allowedMimeTypes ?? []).length === 0
              ? '不允许任何类型'
              : (allowedMimeTypes ?? []).length > 1
                ? (allowedMimeTypes ?? []).join(', ')
                : '未知类型'}
        </p>
        <p className="text-sm text-foreground-light">
          文件大小限制:{' '}
          {maxFileSizeLimit === null ? '无限制' : `${formatBytes(maxFileSizeLimit)}`}
        </p>
      </div>

      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.uploadFile}
        codeSnippets={DOCS_RESOURCE_CONTENT.uploadFile.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.deleteFiles}
        codeSnippets={DOCS_RESOURCE_CONTENT.deleteFiles.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.listFiles}
        codeSnippets={DOCS_RESOURCE_CONTENT.listFiles.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.downloadFile}
        codeSnippets={DOCS_RESOURCE_CONTENT.downloadFile.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      {bucket.public ? (
        <ResourceContent
          selectedLanguage={language}
          snippet={DOCS_RESOURCE_CONTENT.retrievePublicURL}
          codeSnippets={DOCS_RESOURCE_CONTENT.retrievePublicURL.code({
            name: resource,
            apikey,
            endpoint,
          })}
        />
      ) : (
        <ResourceContent
          selectedLanguage={language}
          snippet={DOCS_RESOURCE_CONTENT.createSignedURL}
          codeSnippets={DOCS_RESOURCE_CONTENT.createSignedURL.code({
            name: resource,
            apikey,
            endpoint,
          })}
        />
      )}
    </div>
  )
}

export default Bucket
