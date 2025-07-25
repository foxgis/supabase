import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input, SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'

interface SchemaEditorProps {
  visible: boolean
  onSuccess: (schema: string) => void
  closePanel: () => void
}

const SchemaEditor = ({ visible, onSuccess, closePanel }: SchemaEditorProps) => {
  const { project } = useProjectContext()

  const [errors, setErrors] = useState<{ name?: string }>({ name: undefined })
  const [name, setName] = useState('')

  const { mutateAsync: createSchema, isLoading } = useSchemaCreateMutation()

  useEffect(() => {
    if (visible) {
      setName('')
      setErrors({ name: undefined })
    }
  }, [visible])

  const onSaveChanges = async () => {
    const errors: any = {}
    if (name.length === 0) errors.name = '请为模式指定名称'
    if (Object.keys(errors).length > 0) {
      return setErrors(errors)
    }

    if (project === undefined) return console.error('未找到项目')
    try {
      await createSchema({
        projectRef: project.ref,
        connectionString: project.connectionString,
        name,
      })
      onSuccess(name)
      toast.success(`成功创建了模式“${name}”`)
    } catch (error) {
      toast.error(`创建模式失败：${error}`)
    }
  }

  return (
    <SidePanel
      size="medium"
      key="SchemaEditor"
      visible={visible}
      header={'创建模式'}
      className="transition-all duration-100 ease-in"
      onCancel={closePanel}
      onConfirm={onSaveChanges}
      loading={isLoading}
      cancelText="取消"
      confirmText="保存"
    >
      <>
        <SidePanel.Content>
          <div className="space-y-10 py-6">
            <Input
              label="模式名"
              layout="vertical"
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
