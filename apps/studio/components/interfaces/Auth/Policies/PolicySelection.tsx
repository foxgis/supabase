import { noop } from 'lodash'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, Modal } from 'ui'

import CardButton from 'components/ui/CardButton'
import { Edit, ExternalLink, FlaskConical, Grid } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'

interface PolicySelectionProps {
  description: string
  showAssistantPreview: boolean
  onViewTemplates: () => void
  onViewEditor: () => void
  onToggleFeaturePreviewModal?: () => void
}

const PolicySelection = ({
  description = '',
  showAssistantPreview,
  onViewTemplates = noop,
  onViewEditor = noop,
  onToggleFeaturePreviewModal,
}: PolicySelectionProps) => {
  const snap = useAppStateSnapshot()

  return (
    <Modal.Content className="space-y-4 py-4">
      <div className="flex flex-col gap-y-2">
        <p className="text-sm text-foreground-light">{description}</p>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-1">
          <CardButton
            title="快速开始"
            description="从模板创建策略"
            icon={
              <div className="flex">
                <div
                  className="
                  flex h-8 w-8 items-center
                  justify-center
                  rounded bg-foreground text-background
                "
                >
                  <Grid size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewTemplates}
          />
          <CardButton
            title="完全自定义"
            description="从头开始创建策略"
            icon={
              <div className="flex">
                <div
                  className="
                  flex h-8 w-8 items-center
                  justify-center
                  rounded bg-foreground text-background
                "
                >
                  <Edit size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewEditor}
          />
        </div>
      </div>

      {showAssistantPreview && onToggleFeaturePreviewModal !== undefined && (
        <Alert_Shadcn_>
          <FlaskConical />
          <AlertTitle_Shadcn_>
            尝试使用 Supabase Assistant 编写 RLS 策略
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            使用 AI 帮助您为表创建 RLS 策略
          </AlertDescription_Shadcn_>
          <div className="flex items-center gap-x-2 mt-3">
            <Button type="default" onClick={onToggleFeaturePreviewModal}>
              切换功能预览
            </Button>
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
              <a
                href="https://supabase.com/blog/studio-introducing-assistant#introducing-the-supabase-assistant"
                target="_blank"
                rel="noreferrer"
              >
                了解更多
              </a>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
    </Modal.Content>
  )
}

export default PolicySelection
