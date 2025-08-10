import { toast } from 'sonner'

import { useDatabaseFunctionDeleteMutation } from 'data/database-functions/database-functions-delete-mutation'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteFunctionProps {
  func?: DatabaseFunction
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteFunction = ({ func, visible, setVisible }: DeleteFunctionProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { name, schema } = func ?? {}

  const { mutate: deleteDatabaseFunction, isLoading } = useDatabaseFunctionDeleteMutation({
    onSuccess: () => {
      toast.success(`成功删除了函数 ${name}`)
      setVisible(false)
    },
  })

  async function handleDelete() {
    if (!func) return console.error('未找到函数')
    if (!project) return console.error('未找到项目')

    deleteDatabaseFunction({
      func,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <>
      <TextConfirmModal
        variant={'warning'}
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={handleDelete}
        title="删除此函数"
        loading={isLoading}
        confirmLabel={`删除函数 ${name}`}
        confirmPlaceholder="输入函数名称"
        confirmString={name ?? '未知'}
        text={
          <>
            <span>本操作将从模式</span>{' '}
            <span className="text-bold text-foreground">{schema}</span>{' '}
            <span>中删除函数</span>{' '}
            <span className="text-bold text-foreground">{name}</span>
          </>
        }
        alert={{ title: '一旦删除，此函数将不可恢复。' }}
      />
    </>
  )
}

export default DeleteFunction
