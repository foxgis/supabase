import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { generateTypes } from 'data/projects/project-type-generation-query'
import { Button, IconDownload, IconExternalLink } from 'ui'
import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import type { ContentProps } from './Content.types'

const Entities = ({ language }: ContentProps) => {
  const { ref } = useParams()
  const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)

  const onClickGenerateTypes = async () => {
    try {
      setIsGeneratingTypes(true)
      const res = await generateTypes({ ref })
      let element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.types))
      element.setAttribute('download', 'supabase.ts')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      toast.success(`成功生成了类型文件！文件已下载`)
    } catch (error: any) {
      toast.error(`生成类型文件失败：${error.message}`)
    } finally {
      setIsGeneratingTypes(false)
    }
  }

  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.entitiesIntroduction} />
      <div>
        <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.generatingTypes} />
        <div className="flex items-center space-x-2 px-4 mt-3">
          <Button asChild type="default" icon={<IconExternalLink />}>
            <Link
              href="https://supabase.com/docs/guides/database/api/generating-types"
              target="_blank"
              rel="noreferrer"
            >
              文档
            </Link>
          </Button>
          <Button
            type="default"
            disabled={isGeneratingTypes}
            loading={isGeneratingTypes}
            icon={<IconDownload strokeWidth={1.5} />}
            onClick={onClickGenerateTypes}
          >
            生成并下载类型文件
          </Button>
        </div>
        <p className="text-xs text-foreground-light px-4 mt-2">
          请记住在您对表进行任何更改后需要重新生成并下载此文件。
        </p>
      </div>
      {/* <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.graphql} /> */}
    </>
  )
}

export default Entities
