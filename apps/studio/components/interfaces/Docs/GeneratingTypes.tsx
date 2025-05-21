import { Download } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import { DocsButton } from 'components/ui/DocsButton'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { generateTypes } from 'data/projects/project-type-generation-query'
import { Button } from 'ui'

interface Props {
  selectedLang: 'bash' | 'js'
}

export default function GeneratingTypes({ selectedLang }: Props) {
  const { ref } = useParams()
  const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef: ref })

  const onClickGenerateTypes = async () => {
    try {
      setIsGeneratingTypes(true)
      const res = await generateTypes({ ref, included_schemas: config?.db_schema })
      let element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.types))
      element.setAttribute('download', 'supabase.ts')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      toast.success(`成功生成了类型定义！文件已下载`)
    } catch (error: any) {
      toast.error(`生成类型定义失败：${error.message}`)
    } finally {
      setIsGeneratingTypes(false)
    }
  }

  return (
    <>
      <h2 className="doc-heading flex items-center justify-between">
        <span>生成类型定义</span>
        <DocsButton href="https://supabase.com/docs/guides/database/api/generating-types" />
      </h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            数据中间件的 API 是通过数据库直接生成的，所以我们可以使用数据库的内省功能来生成类型安全的 API 定义文件。
          </p>
          <p>
            您可以通过以下方式之一从数据库生成类型定义文件：
            <Link href="https://supabase.com/docs/guides/database/api/generating-types">
              Supabase CLI
            </Link>
            ，或者通过右侧按钮下载类型文件并在 <code>src/index.ts</code> 中导入到您的应用程序中。
          </p>
        </article>
        <article
          className={`code ${selectedLang === 'js' ? 'flex items-center justify-center' : ''}`}
        >
          <div className="grid gap-2">
            <p className="text-center">
              {selectedLang === 'js' && (
                <Button
                  type="default"
                  disabled={isGeneratingTypes}
                  loading={isGeneratingTypes}
                  icon={<Download strokeWidth={1.5} />}
                  onClick={onClickGenerateTypes}
                >
                  生成并下载类型定义文件
                </Button>
              )}
            </p>
            <p className="text-xs text-center text-foreground-light bg-studio p-4">
              请牢记，每当您对表进行更改时，都需要重新生成并下载此文件。
            </p>
          </div>
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.cliLogin()} />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={localSnippets.generateTypes(ref ?? '')}
          />
        </article>
      </div>
    </>
  )
}

const localSnippets = {
  cliLogin: () => ({
    title: '通过 CLI 使用您个人的 Access Token 登录',
    bash: {
      code: `
npx supabase login
`,
    },
  }),
  generateTypes: (ref: string) => ({
    title: 'Generate types',
    bash: {
      code: `
npx supabase gen types typescript --project-id "${ref}" --schema public > types/supabase.ts
`,
    },
  }),
}
