import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input, SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import ActionBar from './ActionBar'

interface SchemaEditorProps {
  visible: boolean
  closePanel: () => void
}

const SchemaEditor = ({ visible, closePanel }: SchemaEditorProps) => {
  const { project } = useProjectContext()

  const [errors, setErrors] = useState<{ name?: string }>({ name: undefined })
  const [name, setName] = useState('')

  const { mutate: createSchema } = useSchemaCreateMutation()

  useEffect(() => {
    if (visible) {
      setName('')
      setErrors({ name: undefined })
    }
  }, [visible])

  const onSaveChanges = (resolve: any) => {
    const errors: any = {}
    if (name.length === 0) errors.name = '请为模式指定名称'
    if (Object.keys(errors).length > 0) {
      resolve()
      return setErrors(errors)
    }

    if (project === undefined) return console.error('未找到项目')
    createSchema(
      { projectRef: project.ref, connectionString: project.connectionString, name },
      {
        onSuccess: () => {
          resolve()
          closePanel()
          toast.success(`成功创建了模式 "${name}"`)
        },
      }
    )
  }

  return (
    <SidePanel
      size="large"
      key="SchemaEditor"
      visible={visible}
      header={'创建模式'}
      className="transition-all duration-100 ease-in"
      onCancel={closePanel}
      onConfirm={() => (resolve: () => void) => onSaveChanges(resolve)}
      customFooter={
        <ActionBar
          backButtonLabel="取消"
          applyButtonLabel="保存"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
    >
      <>
        <SidePanel.Content>
          <div className="space-y-10 py-6">
            <Input
              label="名称"
              layout="horizontal"
              type="text"
              error={errors?.name}
              value={name}
              onChange={(event: any) => setName(event.target.value)}
            />
          </div>
        </SidePanel.Content>
      </>
    </SidePanel>
  )
}

export default SchemaEditor
