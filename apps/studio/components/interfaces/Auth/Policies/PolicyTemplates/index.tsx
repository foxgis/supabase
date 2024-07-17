import { isEmpty, noop } from 'lodash'
import { useState } from 'react'
import { Button } from 'ui'

import { PolicyTemplate } from './PolicyTemplates.constants'
import TemplatePreview from './TemplatePreview'
import TemplatesList from './TemplatesList'

interface PolicyTemplatesProps {
  templates?: PolicyTemplate[]
  templatesNote?: string
  onUseTemplate?: (template: PolicyTemplate) => void
}

const PolicyTemplates = ({
  templates = [],
  templatesNote = '',
  onUseTemplate = noop,
}: PolicyTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate>(templates[0])
  return (
    <div>
      <div className="flex justify-between border-t border-default">
        <TemplatesList
          templatesNote={templatesNote}
          templates={templates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
        <TemplatePreview selectedTemplate={selectedTemplate} />
      </div>
      <div className="flex w-full items-center justify-end gap-3 border-t px-6 py-4 border-default">
        <span className="text-sm text-foreground-lighter">
          这将覆盖您已编写的代码
        </span>
        <Button
          type="primary"
          disabled={isEmpty(selectedTemplate)}
          onClick={() => onUseTemplate(selectedTemplate)}
        >
          使用此模板
        </Button>
      </div>
    </div>
  )
}

export default PolicyTemplates
