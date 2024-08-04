import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIconAnimation, Button, Form, Input, Modal } from 'ui'
import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import { Snippet } from 'data/content/sql-folders-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useFlag } from 'hooks/ui/useFlag'
import { getContentById } from 'data/content/content-id-query'

export interface RenameQueryModalProps {
  snippet?: SqlSnippet | Snippet
  visible: boolean
  onCancel: () => void
  onComplete: () => void
}

const RenameQueryModal = ({
  snippet = {} as any,
  visible,
  onCancel,
  onComplete,
}: RenameQueryModalProps) => {
  const { ref } = useParams()
  const organization = useSelectedOrganization()

  const snap = useSqlEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const enableFolders = useFlag('sqlFolderOrganization')
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { id, name, description } = snippet

  const [nameInput, setNameInput] = useState(name)
  const [descriptionInput, setDescriptionInput] = useState(description)

  const { mutate: titleSql, isLoading: isTitleGenerationLoading } = useSqlTitleGenerateMutation({
    onSuccess: (data) => {
      const { title, description } = data
      setNameInput(title)
      if (!descriptionInput) setDescriptionInput(description)
    },
    onError: (error) => {
      toast.error(`查询重命名失败：${error.message}`)
    },
  })

  const isAiButtonVisible = enableFolders ? true : 'content' in snippet && !!snippet.content.sql

  const generateTitle = async () => {
    if (enableFolders) {
      if ('content' in snippet) {
        titleSql({ sql: snippet.content.sql })
      } else {
        try {
          const { content } = await getContentById({ projectRef: ref, id: snippet.id })
          titleSql({ sql: content.sql })
        } catch (error) {
          toast.error('未能基于查询内容生成标题')
        }
      }
    } else {
      if ('content' in snippet) titleSql({ sql: snippet.content.sql })
    }
  }

  const validate = () => {
    const errors: any = {}
    if (!nameInput) errors.name = '请输入查询的名称'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    if (!ref) return console.error('未找到项目号')
    if (!id) return console.error('未找到代码段 ID')

    setSubmitting(true)
    try {
      if (enableFolders) {
        // [Joshen] For SQL V2 - content is loaded on demand so we need to fetch the data if its not already loaded in the valtio state
        if (!('content' in snippet)) {
          // [Joshen] I feel like there's definitely some optimization we can do here but will involve changes to API
          const snippet = await getContentById({ projectRef: ref, id })
          snapV2.addSnippet({ projectRef: ref, snippet })
        }
        snapV2.renameSnippet({ id, name: nameInput, description: descriptionInput })
      } else {
        snap.renameSnippet(id, nameInput, descriptionInput)
      }
      if (onComplete) onComplete()
    } catch (error: any) {
      // [Joshen] We probably need some rollback cause all the saving is async
      toast.error(`查询重命名失败：${error.message}`)
    }
  }

  useEffect(() => {
    setNameInput(name)
    setDescriptionInput(description)
  }, [snippet.id])

  return (
    <Modal visible={visible} onCancel={onCancel} hideFooter header="重命名" size="small">
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{
          name: name ?? '',
          description: description ?? '',
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <>
            <Modal.Content className="space-y-4">
              <Input
                label="名称"
                id="name"
                name="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              {/* <div className="flex w-full justify-end mt-2">
                {!hasHipaaAddon && isAiButtonVisible && (
                  <Button
                    type="default"
                    onClick={() => generateTitle()}
                    size="tiny"
                    disabled={isTitleGenerationLoading}
                  >
                    <div className="flex items-center gap-1">
                      <div className="scale-75">
                        <AiIconAnimation loading={isTitleGenerationLoading} />
                      </div>
                      <span>使用 Supabase AI 重命名</span>
                    </div>
                  </Button>
                )}
              </div> */}
              <Input.TextArea
                label="描述"
                id="description"
                placeholder="查询的描述信息"
                size="medium"
                textAreaClassName="resize-none"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
              />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center justify-end gap-2">
              <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                取消
              </Button>
              <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                重命名查询
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default RenameQueryModal
