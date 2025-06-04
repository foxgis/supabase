import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import type { SupaRow } from 'components/grid/types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseColumnDeleteMutation } from 'data/database-columns/database-column-delete-mutation'
import { TableLike } from 'data/table-editor/table-editor-types'
import { useTableRowDeleteAllMutation } from 'data/table-rows/table-row-delete-all-mutation'
import { useTableRowDeleteMutation } from 'data/table-rows/table-row-delete-mutation'
import { useTableRowTruncateMutation } from 'data/table-rows/table-row-truncate-mutation'
import { useTableDeleteMutation } from 'data/tables/table-delete-mutation'
import { useGetImpersonatedRoleState } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, Checkbox } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type DeleteConfirmationDialogsProps = {
  selectedTable?: TableLike
  onTableDeleted?: () => void
}

const DeleteConfirmationDialogs = ({
  selectedTable,
  onTableDeleted,
}: DeleteConfirmationDialogsProps) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { filters, onApplyFilters } = useTableFilter()

  const removeDeletedColumnFromFiltersAndSorts = ({
    columnName,
  }: {
    ref?: string
    tableName?: string
    schema?: string
    columnName: string
  }) => {
    onApplyFilters(filters.filter((filter) => filter.column !== columnName))
  }

  const { mutate: deleteColumn } = useDatabaseColumnDeleteMutation({
    onSuccess: () => {
      if (!(snap.confirmationDialog?.type === 'column')) return
      const selectedColumnToDelete = snap.confirmationDialog.column
      removeDeletedColumnFromFiltersAndSorts({ columnName: selectedColumnToDelete.name })
      toast.success(`成功删除了列“${selectedColumnToDelete.name}” `)
    },
    onError: (error) => {
      if (!(snap.confirmationDialog?.type === 'column')) return
      const selectedColumnToDelete = snap.confirmationDialog.column
      toast.error(`删除 ${selectedColumnToDelete!.name} 失败：${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })
  const { mutate: deleteTable } = useTableDeleteMutation({
    onSuccess: async () => {
      toast.success(`成功删除了表“${selectedTable?.name}”`)
      onTableDeleted?.()
    },
    onError: (error) => {
      toast.error(`删除 ${selectedTable?.name}失败：${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: deleteRows, isLoading: isDeletingRows } = useTableRowDeleteMutation({
    onSuccess: () => {
      if (snap.confirmationDialog?.type === 'row') {
        snap.confirmationDialog.callback?.()
      }
      toast.success(`成功删除了选中的行`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: deleteAllRows, isLoading: isDeletingAllRows } = useTableRowDeleteAllMutation({
    onSuccess: () => {
      if (snap.confirmationDialog?.type === 'row') {
        snap.confirmationDialog.callback?.()
      }
      toast.success(`成功删除了选中的行`)
    },
    onError: (error) => {
      toast.error(`删除行失败：${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: truncateRows, isLoading: isTruncatingRows } = useTableRowTruncateMutation({
    onSuccess: () => {
      if (snap.confirmationDialog?.type === 'row') {
        snap.confirmationDialog.callback?.()
      }
      toast.success(`成功删除了表中所有行`)
    },
    onError: (error) => {
      toast.error(`删除行失败：${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const isAllRowsSelected =
    snap.confirmationDialog?.type === 'row' ? snap.confirmationDialog.allRowsSelected : false
  const numRows =
    snap.confirmationDialog?.type === 'row'
      ? snap.confirmationDialog.allRowsSelected
        ? snap.confirmationDialog.numRows ?? 0
        : snap.confirmationDialog.rows.length
      : 0

  const isDeleteWithCascade =
    snap.confirmationDialog?.type === 'column' || snap.confirmationDialog?.type === 'table'
      ? snap.confirmationDialog.isDeleteWithCascade
      : false

  const onConfirmDeleteColumn = async () => {
    if (!(snap.confirmationDialog?.type === 'column')) return
    if (project === undefined) return

    const selectedColumnToDelete = snap.confirmationDialog.column
    if (selectedColumnToDelete === undefined) return

    deleteColumn({
      column: selectedColumnToDelete,
      cascade: isDeleteWithCascade,
      projectRef: project.ref,
      connectionString: project?.connectionString,
    })
  }

  const onConfirmDeleteTable = async () => {
    if (!(snap.confirmationDialog?.type === 'table')) return
    const selectedTableToDelete = selectedTable

    if (selectedTableToDelete === undefined) return

    deleteTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: selectedTableToDelete.id,
      name: selectedTableToDelete.name,
      schema: selectedTableToDelete.schema,
      cascade: isDeleteWithCascade,
    })
  }

  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const onConfirmDeleteRow = async () => {
    if (!project) return console.error('未找到项目号')
    if (!selectedTable) return console.error('未找到选择的表')
    if (snap.confirmationDialog?.type !== 'row') return
    const selectedRowsToDelete = snap.confirmationDialog.rows

    if (snap.confirmationDialog.allRowsSelected) {
      if (filters.length === 0) {
        if (getImpersonatedRoleState().role !== undefined) {
          snap.closeConfirmationDialog()
          return toast.error('当处于切换角色时不支持表清空操作')
        }

        truncateRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable,
        })
      } else {
        deleteAllRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable,
          filters,
          roleImpersonationState: getImpersonatedRoleState(),
        })
      }
    } else {
      deleteRows({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: selectedTable,
        rows: selectedRowsToDelete as SupaRow[],
        roleImpersonationState: getImpersonatedRoleState(),
      })
    }
  }

  return (
    <>
      <ConfirmationModal
        variant="destructive"
        size="small"
        visible={snap.confirmationDialog?.type === 'column'}
        title={`确认删除列 "${
          snap.confirmationDialog?.type === 'column' && snap.confirmationDialog.column.name
        }"`}
        confirmLabel="删除"
        confirmLabelLoading="正在删除"
        onCancel={() => {
          snap.closeConfirmationDialog()
        }}
        onConfirm={onConfirmDeleteColumn}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-light">
            确定要删除所选列吗？本操作无法撤消。
          </p>
          <Checkbox
            label="级联删除列？"
            description="删除列及其相关联的对象"
            checked={isDeleteWithCascade}
            onChange={() => snap.toggleConfirmationIsWithCascade()}
          />
          {isDeleteWithCascade && (
            <Alert_Shadcn_
              variant="warning"
              title="警告：级联删除可能导致意外后果"
            >
              <AlertTitle_Shadcn_>
                所有相关联的对象都会被删除，包括任何依赖它们的对象，递归执行删除。
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <Button asChild size="tiny" type="default" icon={<ExternalLink />}>
                  <Link
                    href="https://www.postgresql.org/docs/current/ddl-depend.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    关于依赖跟踪
                  </Link>
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        variant={'destructive'}
        size="small"
        visible={snap.confirmationDialog?.type === 'table'}
        title={
          <span className="break-words">{`确认删除表 "${selectedTable?.name}"`}</span>
        }
        confirmLabel="删除"
        confirmLabelLoading="正在删除"
        onCancel={() => {
          snap.closeConfirmationDialog()
        }}
        onConfirm={onConfirmDeleteTable}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-light">
            您确定要删除选中的表吗？本操作无法撤消。
          </p>
          <Checkbox
            label="级联删除表？"
            description="删除表及其相关联的对象"
            checked={isDeleteWithCascade}
            onChange={() => snap.toggleConfirmationIsWithCascade(!isDeleteWithCascade)}
          />
          {isDeleteWithCascade && (
            <Alert_Shadcn_ variant="warning">
              <AlertTitle_Shadcn_>
                警告：级联删除可能导致意外后果
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                所有相关联的对象都会被删除，包括任何依赖它们的对象，递归执行删除。
              </AlertDescription_Shadcn_>
              <AlertDescription_Shadcn_ className="mt-4">
                <Button asChild size="tiny" type="default" icon={<ExternalLink />}>
                  <Link
                    href="https://www.postgresql.org/docs/current/ddl-depend.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    关于依赖跟踪
                  </Link>
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        variant={'destructive'}
        size="small"
        visible={snap.confirmationDialog?.type === 'row'}
        title={
          <p className="break-words">
            <span>确认删除选中的行</span>
            <span>{numRows > 1 && ''}</span>
          </p>
        }
        confirmLabel="删除"
        confirmLabelLoading="正在删除"
        onCancel={() => snap.closeConfirmationDialog()}
        onConfirm={() => onConfirmDeleteRow()}
        loading={isTruncatingRows || isDeletingRows || isDeletingAllRows}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-light">
            <span>您确定要删除</span>
            <span>{isAllRowsSelected ? '所有的' : '选中的'} </span>
            <span>{numRows > 1 && `${numRows} `}</span>
            <span>行</span>
            <span>{numRows > 1 && ''}</span>
            <span>？本操作无法撤消。</span>
          </p>
        </div>
      </ConfirmationModal>
    </>
  )
}

export default DeleteConfirmationDialogs
