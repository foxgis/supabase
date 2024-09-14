import { noop } from 'lodash'
import { ChevronLeft, ExternalLink, FlaskConical } from 'lucide-react'
import { Button } from 'ui'
import { POLICY_MODAL_VIEWS } from '../Policies.constants'

interface PolicyEditorModalTitleProps {
  view: string
  schema: string
  table: string
  isNewPolicy: boolean
  showAssistantPreview: boolean
  onSelectBackFromTemplates: () => void
  onToggleFeaturePreviewModal: () => void
}

const PolicyEditorModalTitle = ({
  view,
  schema,
  table,
  isNewPolicy,
  showAssistantPreview,
  onSelectBackFromTemplates = noop,
  onToggleFeaturePreviewModal,
}: PolicyEditorModalTitleProps) => {
  const getTitle = () => {
    if (view === POLICY_MODAL_VIEWS.EDITOR || view === POLICY_MODAL_VIEWS.SELECTION) {
      return `正在为 ${schema}.${table} ${isNewPolicy ? '添加新策略' : '编辑策略'} `
    }
    if (view === POLICY_MODAL_VIEWS.REVIEW) {
      return `正在检查 {schema}.${table} 上${isNewPolicy ? '待创建的' : '待更新的'} 策略$`
    }
  }

  if (view === POLICY_MODAL_VIEWS.TEMPLATES) {
    return (
      <div>
        <div className="flex items-center space-x-3">
          <span
            onClick={onSelectBackFromTemplates}
            className="cursor-pointer text-foreground-lighter transition-colors hover:text-foreground"
          >
            <ChevronLeft strokeWidth={2} size={14} />
          </span>
          <h4>请为您的新策略选择一个模板</h4>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full flex items-center justify-between gap-x-4">
      <h4 className="truncate" title={getTitle()}>
        {getTitle()}
      </h4>
      <div className="flex items-center gap-x-2 pr-6">
        {showAssistantPreview && view === POLICY_MODAL_VIEWS.EDITOR && (
          <Button type="default" icon={<FlaskConical />} onClick={onToggleFeaturePreviewModal}>
            试用 Supabase Assistant
          </Button>
        )}
        <Button asChild type="default" icon={<ExternalLink size={14} />} className="mt-[-4px]">
          <a
            href="https://supabase.com/docs/learn/auth-deep-dive/auth-policies"
            target="_blank"
            rel="noreferrer"
          >
            {' '}
            文档
          </a>
        </Button>
      </div>
    </div>
  )
}

export default PolicyEditorModalTitle
