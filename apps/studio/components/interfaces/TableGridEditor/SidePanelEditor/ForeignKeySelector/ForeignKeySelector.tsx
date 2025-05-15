import type { PostgresTable } from '@supabase/postgres-meta'
import { sortBy } from 'lodash'
import { ArrowRight, Database, HelpCircle, Table, X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Listbox,
  SidePanel,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DocsButton } from 'components/ui/DocsButton'
import InformationBox from 'components/ui/InformationBox'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { uuidv4 } from 'lib/helpers'
import ActionBar from '../ActionBar'
import { NUMERICAL_TYPES, TEXT_TYPES } from '../SidePanelEditor.constants'
import type { ColumnField } from '../SidePanelEditor.types'
import { FOREIGN_KEY_CASCADE_OPTIONS } from './ForeignKeySelector.constants'
import type { ForeignKey } from './ForeignKeySelector.types'
import { generateCascadeActionDescription } from './ForeignKeySelector.utils'

const EMPTY_STATE: ForeignKey = {
  id: undefined,
  schema: 'public',
  table: '',
  columns: [] as { source: string; target: string }[],
  deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
}

interface ForeignKeySelectorProps {
  visible: boolean
  table: {
    id: number
    name: string
    columns: { id: string; name: string; format: string; isNewColumn: boolean }[]
  }
  column?: ColumnField // For ColumnEditor, to prefill when adding a new foreign key
  foreignKey?: ForeignKey
  onClose: () => void
  onSaveRelation: (fk: ForeignKey) => void
}

export const ForeignKeySelector = ({
  visible,
  table,
  column,
  foreignKey,
  onClose,
  onSaveRelation,
}: ForeignKeySelectorProps) => {
  const { project } = useProjectContext()
  const { selectedSchema } = useQuerySchemaState()

  const [fk, setFk] = useState(EMPTY_STATE)
  const [errors, setErrors] = useState<{ columns?: string; types?: any[]; typeNotice?: any[] }>({})
  const hasTypeErrors = (errors?.types ?? []).filter((x: any) => x !== undefined).length > 0
  const hasTypeNotices = (errors?.typeNotice ?? []).filter((x: any) => x !== undefined).length > 0

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: tables } = useTablesQuery<PostgresTable[] | undefined>({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: fk.schema,
    includeColumns: true,
  })

  const selectedTable = (tables ?? []).find((x) => x.name === fk.table && x.schema === fk.schema)

  const disableApply = selectedTable === undefined || hasTypeErrors

  const updateSelectedSchema = (schema: string) => {
    const updatedFk = { ...EMPTY_STATE, id: fk.id, schema }
    setFk(updatedFk)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    const table = (tables ?? []).find((x) => x.id === tableId)
    if (table) {
      setFk({
        ...EMPTY_STATE,
        id: fk.id,
        name: fk.name,
        tableId: table.id,
        schema: table.schema,
        table: table.name,
        columns:
          column !== undefined
            ? [{ source: column.name, target: '' }]
            : [{ source: '', target: '' }],
      })
    }
  }

  const addColumn = () => {
    setFk({ ...fk, columns: fk.columns.concat([{ source: '', target: '' }]) })
  }

  const onRemoveColumn = (idx: number) => {
    setFk({ ...fk, columns: fk.columns.filter((_, i) => i !== idx) })
  }

  const updateSelectedColumn = (idx: number, key: 'target' | 'source', value: string) => {
    const updatedRelations = fk.columns.map((x, i) => {
      if (i === idx) {
        if (key === 'target') {
          const targetType = selectedTable?.columns?.find((col) => col.name === value)?.format
          return { ...x, [key]: value, targetType }
        } else {
          const sourceType = table.columns.find((col) => col.name === value)?.format as string
          return { ...x, [key]: value, sourceType }
        }
      } else {
        return x
      }
    })
    setFk({ ...fk, columns: updatedRelations })
  }

  const updateCascadeAction = (action: 'updateAction' | 'deletionAction', value: string) => {
    setErrors({})
    setFk({ ...fk, [action]: value })
  }

  const validateSelection = (resolve: any) => {
    const errors: any = {}
    const incompleteColumns = fk.columns.filter(
      (column) => column.source === '' || column.target === ''
    )
    if (incompleteColumns.length > 0) errors['columns'] = '请确保选择了列'

    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      resolve()
      return
    } else {
      if (fk.table !== '') onSaveRelation(fk)
      onClose()
      resolve()
    }
  }

  const validateType = () => {
    const typeNotice: any = []
    const typeErrors: any = []

    fk.columns.forEach((column) => {
      const { source, target, sourceType: sType, targetType: tType } = column
      const sourceColumn = table.columns.find((col) => col.name === source)
      const sourceType = sType ?? sourceColumn?.format ?? ''
      const targetType =
        tType ?? selectedTable?.columns?.find((col) => col.name === target)?.format ?? ''

      // [Joshen] Doing this way so that its more readable
      // If either source or target not selected yet, thats okay
      if (source === '' || target === '') {
        return typeErrors.push(undefined)
      }

      if (sourceColumn?.isNewColumn && targetType !== '') {
        return typeNotice.push({ sourceType, targetType })
      }

      // If source and target are in the same type of data types, thats okay
      if (
        (NUMERICAL_TYPES.includes(sourceType) && NUMERICAL_TYPES.includes(targetType)) ||
        (TEXT_TYPES.includes(sourceType) && TEXT_TYPES.includes(targetType)) ||
        (TEXT_TYPES.includes(sourceType) && TEXT_TYPES.includes(targetType)) ||
        (sourceType === 'uuid' && targetType === 'uuid')
      ) {
        return typeErrors.push(undefined)
      }

      // Otherwise just check if the format is equal to each other
      if (sourceType === targetType) {
        return typeErrors.push(undefined)
      }

      typeErrors.push({ sourceType, targetType })
    })

    setErrors({ types: typeErrors, typeNotice })
  }

  useEffect(() => {
    if (visible) {
      if (foreignKey !== undefined) setFk(foreignKey)
      else setFk({ ...EMPTY_STATE, id: uuidv4() })
    }
  }, [visible])

  useEffect(() => {
    if (visible) validateType()
  }, [fk])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      className="max-w-[480px]"
      header={`${foreignKey === undefined ? '添加' : '管理'} ${table.name} 的外键关联`}
      customFooter={
        <ActionBar
          backButtonLabel="取消"
          disableApply={disableApply}
          applyButtonLabel="保存"
          closePanel={onClose}
          applyFunction={(resolve: any) => validateSelection(resolve)}
        />
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-6">
          <InformationBox
            icon={<HelpCircle size={20} strokeWidth={1.5} />}
            title="什么是外键？"
            description={`外键通过确保没有人能够向表中插入在另一个表中没有匹配项的行，来帮助维护数据的参照完整性。`}
            url="https://www.postgresql.org/docs/current/tutorial-fk.html"
            urlLabel="Postgres 外键相关文档"
          />

          <Listbox
            id="schema"
            label="选择一个模式"
            value={fk.schema}
            onChange={(value: string) => updateSelectedSchema(value)}
          >
            {schemas?.map((schema) => {
              return (
                <Listbox.Option
                  key={schema.id}
                  value={schema.name}
                  label={schema.name}
                  className="min-w-96"
                  addOnBefore={() => <Database size={16} strokeWidth={1.5} />}
                >
                  <div className="flex items-center gap-2">
                    {/* For aria searching to target the schema name instead of schema */}
                    <span className="hidden">{schema.name}</span>
                    <span className="text-foreground">{schema.name}</span>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox>

          <Listbox
            id="table"
            label="选择引用的表"
            value={selectedTable?.id ?? 1}
            onChange={(value: string) => updateSelectedTable(Number(value))}
          >
            <Listbox.Option key="empty" className="min-w-96" value={1} label="---">
              ---
            </Listbox.Option>
            {sortBy(tables, ['schema']).map((table) => {
              return (
                <Listbox.Option
                  key={table.id}
                  value={table.id}
                  label={table.name}
                  className="min-w-96"
                  addOnBefore={() => <Table size={16} strokeWidth={1.5} />}
                >
                  <div className="flex items-center gap-2">
                    {/* For aria searching to target the table name instead of schema */}
                    <span className="hidden">{table.name}</span>
                    <span className="text-foreground-lighter">{table.schema}</span>
                    <span className="text-foreground">{table.name}</span>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox>

          {fk.schema && fk.table && (
            <>
              <div className="flex flex-col gap-y-3">
                <label className="text-foreground-light text-sm">
                  从{' '}
                  <code className="text-xs">
                    {fk.schema}.{fk.table}
                  </code>{' '}
                  选择列引用
                </label>
                <div className="grid grid-cols-10 gap-y-2">
                  <div className="col-span-5 text-xs text-foreground-lighter">
                    {selectedSchema}.{table.name.length > 0 ? table.name : '[unnamed table]'}
                  </div>
                  <div className="col-span-4 text-xs text-foreground-lighter text-right">
                    {fk.schema}.{fk.table}
                  </div>
                  {fk.columns.length === 0 && (
                    <Alert_Shadcn_ className="col-span-10 py-2 px-3">
                      <AlertDescription_Shadcn_>
                        这些表之间没有外键关联
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                  {fk.columns.map((_, idx) => (
                    <Fragment key={`${uuidv4()}`}>
                      <div className="col-span-4">
                        <Listbox
                          id="column"
                          value={fk.columns[idx].source}
                          onChange={(value: string) => updateSelectedColumn(idx, 'source', value)}
                        >
                          <Listbox.Option key="empty" value={''} label="---" className="!w-[170px]">
                            ---
                          </Listbox.Option>
                          {(table?.columns ?? [])
                            .filter((x) => x.name.length !== 0)
                            .map((column) => (
                              <Listbox.Option
                                key={column.id}
                                value={column.name}
                                label={column.name}
                                className="!w-[170px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-foreground">{column.name}</span>
                                  <span className="text-foreground-lighter">
                                    {column.format === '' ? '-' : column.format}
                                  </span>
                                </div>
                              </Listbox.Option>
                            ))}
                        </Listbox>
                      </div>
                      <div className="col-span-1 flex justify-center items-center">
                        <ArrowRight />
                      </div>
                      <div className="col-span-4">
                        <Listbox
                          id="column"
                          value={fk.columns[idx].target}
                          onChange={(value: string) => updateSelectedColumn(idx, 'target', value)}
                        >
                          <Listbox.Option key="empty" value={''} label="---" className="!w-[170px]">
                            ---
                          </Listbox.Option>
                          {(selectedTable?.columns ?? []).map((column) => (
                            <Listbox.Option
                              key={column.id}
                              value={column.name}
                              label={column.name}
                              className="!w-[170px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-foreground">{column.name}</span>
                                <span className="text-foreground-lighter">{column.format}</span>
                              </div>
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                      <div className="col-span-1 flex justify-end items-center">
                        <Button
                          type="default"
                          className="px-1"
                          icon={<X />}
                          disabled={fk.columns.length === 1}
                          onClick={() => onRemoveColumn(idx)}
                        />
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="space-y-2">
                  <Button type="default" onClick={addColumn}>
                    添加另一列
                  </Button>
                  {errors.columns && <p className="text-red-900 text-sm">{errors.columns}</p>}
                  {hasTypeErrors && (
                    <Alert_Shadcn_ variant="warning">
                      <AlertTitle_Shadcn_>列类型不匹配</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        以下这些列不是同一类型因而不能被引用：
                      </AlertDescription_Shadcn_>
                      <ul className="list-disc pl-5 mt-2 text-foreground-light">
                        {(errors?.types ?? []).map((x, idx: number) => {
                          if (x === undefined) return null
                          return (
                            <li key={`type-error-${idx}`}>
                              <code className="text-xs">{fk.columns[idx]?.source}</code> (
                              {x.sourceType}) and{' '}
                              <code className="text-xs">{fk.columns[idx]?.target}</code>(
                              {x.targetType})
                            </li>
                          )
                        })}
                      </ul>
                    </Alert_Shadcn_>
                  )}
                  {hasTypeNotices && (
                    <Alert_Shadcn_>
                      <AlertTitle_Shadcn_>将更改列类型</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        The following columns will have their types updated to match their
                        referenced column
                        将更改以下列的类型已匹配引用的列。
                      </AlertDescription_Shadcn_>
                      <ul className="list-disc pl-5 mt-2 text-foreground-light">
                        {(errors?.typeNotice ?? []).map((x, idx: number) => {
                          if (x === undefined) return null
                          return (
                            <li key={`type-error-${idx}`}>
                              <div className="flex items-center gap-x-1">
                                <code className="text-xs">{fk.columns[idx]?.source}</code>{' '}
                                <ArrowRight /> {x.targetType}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </Alert_Shadcn_>
                  )}
                </div>
              </div>

              <SidePanel.Separator />

              <InformationBox
                icon={<HelpCircle size="20" strokeWidth={1.5} />}
                title="那种操作最为合适？"
                description={
                  <>
                    <p>
                      操作的选择取决于相关表所表示的对象类型：
                    </p>
                    <ul className="mt-2 list-disc pl-4 space-y-1">
                      <li>
                        <code className="text-xs">级联操作</code>：如果引用表表示的内容是被引用表表示内容的组成部分，并且不能独立存在。
                      </li>
                      <li>
                        <code className="text-xs">限制操作</code>或<code className="text-xs">无操作</code>：如果两个表表示独立的对象
                      </li>
                      <li>
                        <code className="text-xs">设为 NULL</code>或<code className="text-xs">设为默认值</code>：如果一个外键关系表示的是可选信息
                      </li>
                    </ul>
                    <p className="mt-2">
                      一般情况下，限制和级联删除是最常见的操作，但是默认行为是无操作
                    </p>
                  </>
                }
                url="https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK"
                urlLabel="更多信息"
              />

              <Listbox
                id="updateAction"
                value={fk.updateAction}
                label="被引用的行更新之后的操作"
                descriptionText={
                  <p>
                    {generateCascadeActionDescription(
                      'update',
                      fk.updateAction,
                      `${fk.schema}.${fk.table}`
                    )}
                  </p>
                }
                onChange={(value: string) => updateCascadeAction('updateAction', value)}
              >
                {FOREIGN_KEY_CASCADE_OPTIONS.filter((option) =>
                  ['no-action', 'cascade', 'restrict'].includes(option.key)
                ).map((option) => (
                  <Listbox.Option key={option.key} value={option.value} label={option.label}>
                    <p className="text-foreground">{option.label}</p>
                  </Listbox.Option>
                ))}
              </Listbox>

              <Listbox
                id="deletionAction"
                value={fk.deletionAction}
                className="[&>div>label]:flex [&>div>label]:items-center"
                label="被引用的行删除之后的操作"
                // @ts-ignore
                labelOptional={
                  <DocsButton href="https://supabase.com/docs/guides/database/postgres/cascade-deletes" />
                }
                descriptionText={
                  <>
                    <p>
                      {generateCascadeActionDescription(
                        'delete',
                        fk.deletionAction,
                        `${fk.schema}.${fk.table}`
                      )}
                    </p>
                  </>
                }
                onChange={(value: string) => updateCascadeAction('deletionAction', value)}
              >
                {FOREIGN_KEY_CASCADE_OPTIONS.map((option) => (
                  <Listbox.Option key={option.key} value={option.value} label={option.label}>
                    <p className="text-foreground">{option.label}</p>
                  </Listbox.Option>
                ))}
              </Listbox>
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}
