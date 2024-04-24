import * as Tooltip from '@radix-ui/react-tooltip'
import { isEmpty, noop, partition } from 'lodash'
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
} from 'react-beautiful-dnd'
import { Alert, Button, IconEdit, IconExternalLink, IconHelpCircle, IconKey, IconTrash } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import type { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { generateColumnField } from '../ColumnEditor/ColumnEditor.utils'
import type { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { TEXT_TYPES } from '../SidePanelEditor.constants'
import type { ColumnField, ExtendedPostgresRelationship } from '../SidePanelEditor.types'
import Column from './Column'
import type { ImportContent } from './TableEditor.types'

interface ColumnManagementProps {
  columns?: ColumnField[]
  relations: ForeignKey[]
  enumTypes: EnumeratedType[]
  importContent?: ImportContent
  isNewRecord: boolean
  onColumnsUpdated: (columns: ColumnField[]) => void
  onSelectImportData: () => void
  onClearImportContent: () => void
}

const ColumnManagement = ({
  columns = [],
  relations,
  enumTypes = [],
  importContent,
  isNewRecord,
  onColumnsUpdated = noop,
  onSelectImportData = noop,
  onClearImportContent = noop,
}: ColumnManagementProps) => {
  const hasImportContent = !isEmpty(importContent)
  const [primaryKeyColumns, otherColumns] = partition(
    columns,
    (column: ColumnField) => column.isPrimaryKey
  )

  const checkIfHaveForeignKeys = (column: ColumnField) => {
    return (
      relations.find((relation) => relation.columns.find((x) => x.source === column.name)) !==
      undefined
    )
  }

  const onUpdateColumn = (columnToUpdate: ColumnField, changes: Partial<ColumnField>) => {
    const updatedColumns = columns.map((column: ColumnField) => {
      if (column.id === columnToUpdate.id) {
        const isTextBasedColumn = TEXT_TYPES.includes(columnToUpdate.format)
        if (!isTextBasedColumn && changes.defaultValue === '') {
          changes.defaultValue = null
        }

        if ('name' in changes && column.foreignKey !== undefined) {
          const foreignKey: ExtendedPostgresRelationship = {
            ...column.foreignKey,
            source_column_name: changes?.name ?? '',
          }
          return { ...column, ...changes, foreignKey }
        }
        return { ...column, ...changes }
      } else {
        return column
      }
    })
    onColumnsUpdated(updatedColumns)
  }

  const onAddColumn = () => {
    const defaultColumn = generateColumnField()
    const updatedColumns = columns.concat(defaultColumn)
    onColumnsUpdated(updatedColumns)
  }

  const onRemoveColumn = (columnToRemove: ColumnField) => {
    const updatedColumns = columns.filter((column: ColumnField) => column.id !== columnToRemove.id)
    onColumnsUpdated(updatedColumns)
  }

  const onSortColumns = (result: any, type: 'pks' | 'others') => {
    // Dropped outside of the list
    if (!result.destination) {
      return
    }

    if (type === 'pks') {
      const updatedPrimaryKeyColumns = primaryKeyColumns.slice()
      const [removed] = updatedPrimaryKeyColumns.splice(result.source.index, 1)
      updatedPrimaryKeyColumns.splice(result.destination.index, 0, removed)
      const updatedColumns = updatedPrimaryKeyColumns.concat(otherColumns)
      return onColumnsUpdated(updatedColumns)
    }

    if (type === 'others') {
      const updatedOtherColumns = otherColumns.slice()
      const [removed] = updatedOtherColumns.splice(result.source.index, 1)
      updatedOtherColumns.splice(result.destination.index, 0, removed)
      const updatedColumns = primaryKeyColumns.concat(updatedOtherColumns)
      return onColumnsUpdated(updatedColumns)
    }
  }

  return (
    <>
      <div className="w-full space-y-4 table-editor-columns">
        <div className="flex items-center justify-between w-full">
          <h5>列</h5>
          <div className="flex items-center gap-x-2">
            <Button asChild type="default" icon={<IconExternalLink size={12} strokeWidth={2} />}>
              <a
                href="https://supabase.com/docs/guides/database/tables#data-types"
                target="_blank"
                rel="noreferrer"
              >
                关于数据类型
              </a>
            </Button>
            {isNewRecord && (
              <>
                <div className="py-3 border-r" />
                {hasImportContent ? (
                  <div className="flex items-center gap-x-2">
                    <Button type="default" icon={<IconEdit />} onClick={onSelectImportData}>
                      编辑内容
                    </Button>
                    <Button type="danger" icon={<IconTrash />} onClick={onClearImportContent}>
                      删除内容
                    </Button>
                  </div>
                ) : (
                  <Button type="default" onClick={onSelectImportData}>
                    通过Excel导入数据
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {hasImportContent && (
          <p className="text-sm text-foreground-light my-2">
            您创建的表有{importContent?.rowCount?.toLocaleString()}行和{columns.length}列。
          </p>
        )}

        {primaryKeyColumns.length === 0 && (
          <Alert title="警告：没有设置主键" variant="warning" withIcon>
            为了唯一标识每一行，数据表至少需要选择一列作为主键。不设置主键，您将无法更新和删除这张表中的数据记录。
          </Alert>
        )}

        {primaryKeyColumns.length > 1 && (
          <InformationBox
            block
            icon={<IconKey className="text-white" size="large" />}
            title="创建了复合主键"
            description="您选择的多个列组合为主键，作为表的唯一标识符"
          />
        )}

        <div className="space-y-2">
          {/* Headers */}
          <div className="flex w-full px-3">
            {/* Drag handle */}
            {isNewRecord && <div className="w-[5%]" />}
            <div className="w-[25%] flex items-center space-x-2">
              <h5 className="text-xs text-foreground-lighter">名称</h5>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <h5 className="text-xs text-foreground-lighter">
                    <IconHelpCircle size={15} strokeWidth={1.5} />
                  </h5>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                        'border border-background w-[300px]', //border
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        推荐使用小写字母和下划线分隔单词，例如column_name
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
            <div className="w-[25%]">
              <h5 className="text-xs text-foreground-lighter">类型</h5>
            </div>
            <div className={`${isNewRecord ? 'w-[25%]' : 'w-[30%]'} flex items-center space-x-2`}>
              <h5 className="text-xs text-foreground-lighter">默认值</h5>

              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <h5 className="text-xs text-foreground-lighter">
                    <IconHelpCircle size={15} strokeWidth={1.5} />
                  </h5>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                        'border border-background w-[300px]', //border
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        可以填写字面量或者表达式，当使用表达式时，将表达式用括号括起来，例如(gen_random_uuid())
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
            <div className="w-[10%]">
              <h5 className="text-xs text-foreground-lighter">主键</h5>
            </div>
            {/* Empty space */}
            <div className={`${hasImportContent ? 'w-[10%]' : 'w-0'}`} />
            {/* More config button */}
            <div className="w-[5%]" />
            {/* Delete button */}
            {!hasImportContent && <div className="w-[5%]" />}
          </div>

          {primaryKeyColumns.length > 0 && (
            <DragDropContext onDragEnd={(result: any) => onSortColumns(result, 'pks')}>
              <Droppable droppableId="pk_columns_droppable">
                {(droppableProvided: DroppableProvided) => (
                  <div
                    ref={droppableProvided.innerRef}
                    className={`space-y-2 rounded-md bg-surface-200 px-3 py-2 ${
                      isNewRecord ? '' : '-mx-3'
                    }`}
                  >
                    {primaryKeyColumns.map((column: ColumnField, index: number) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(draggableProvided: DraggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                          >
                            <Column
                              column={column}
                              enumTypes={enumTypes}
                              hasForeignKeys={checkIfHaveForeignKeys(column)}
                              isNewRecord={isNewRecord}
                              hasImportContent={hasImportContent}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              onUpdateColumn={(changes) => onUpdateColumn(column, changes)}
                              onRemoveColumn={() => onRemoveColumn(column)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <DragDropContext onDragEnd={(result: any) => onSortColumns(result, 'others')}>
            <Droppable droppableId="other_columns_droppable">
              {(droppableProvided: DroppableProvided) => (
                <div
                  ref={droppableProvided.innerRef}
                  className={`space-y-2 py-2 ${isNewRecord ? 'px-3 ' : ''}`}
                >
                  {otherColumns.map((column: ColumnField, index: number) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(draggableProvided: DraggableProvided) => (
                        <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                          <Column
                            column={column}
                            enumTypes={enumTypes}
                            isNewRecord={isNewRecord}
                            hasForeignKeys={checkIfHaveForeignKeys(column)}
                            hasImportContent={hasImportContent}
                            dragHandleProps={draggableProvided.dragHandleProps}
                            onUpdateColumn={(changes) => onUpdateColumn(column, changes)}
                            onRemoveColumn={() => onRemoveColumn(column)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {!hasImportContent && (
          <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
            <Button type="default" onClick={() => onAddColumn()}>
              添加列
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default ColumnManagement
