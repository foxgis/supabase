import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { isEmpty, noop } from 'lodash'
import { ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import {
  CONSTRAINT_TYPE,
  Constraint,
  useTableConstraintsQuery,
} from 'data/database/constraints-query'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { PROTECTED_SCHEMAS_WITHOUT_EXTENSIONS } from 'lib/constants/schemas'
import type { Dictionary } from 'types'
import { Button, Checkbox, Input, SidePanel, Toggle } from 'ui'
import ActionBar from '../ActionBar'
import type { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { formatForeignKeys } from '../ForeignKeySelector/ForeignKeySelector.utils'
import { TEXT_TYPES } from '../SidePanelEditor.constants'
import type {
  ColumnField,
  CreateColumnPayload,
  UpdateColumnPayload,
} from '../SidePanelEditor.types'
import ColumnDefaultValue from './ColumnDefaultValue'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
  getPlaceholderText,
  validateFields,
} from './ColumnEditor.utils'
import ColumnForeignKey from './ColumnForeignKey'
import ColumnType from './ColumnType'
import HeaderTitle from './HeaderTitle'

export interface ColumnEditorProps {
  column?: Readonly<PostgresColumn>
  selectedTable: PostgresTable
  visible: boolean
  closePanel: () => void
  saveChanges: (
    payload: CreateColumnPayload | UpdateColumnPayload,
    isNewRecord: boolean,
    configuration: {
      columnId?: string
      primaryKey?: Constraint
      foreignKeyRelations: ForeignKey[]
      existingForeignKeyRelations: ForeignKeyConstraint[]
    },
    resolve: any
  ) => void
  updateEditorDirty: () => void
}

const ColumnEditor = ({
  column,
  selectedTable,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: ColumnEditorProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [columnFields, setColumnFields] = useState<ColumnField>()
  const [fkRelations, setFkRelations] = useState<ForeignKey[]>([])
  const [placeholder, setPlaceholder] = useState(
    getPlaceholderText(columnFields?.format, columnFields?.name)
  )

  const { data: types } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const enumTypes = (types ?? []).filter(
    (type) => !PROTECTED_SCHEMAS_WITHOUT_EXTENSIONS.includes(type.schema)
  )

  const { data: constraints } = useTableConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: selectedTable?.id,
  })
  const primaryKey = (constraints ?? []).find(
    (constraint) => constraint.type === CONSTRAINT_TYPE.PRIMARY_KEY_CONSTRAINT
  )

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable?.schema,
  })

  const isNewRecord = column === undefined
  const foreignKeyMeta = data || []
  const foreignKeys = foreignKeyMeta.filter((relation) => {
    return relation.source_id === column?.table_id && relation.source_columns.includes(column.name)
  })
  const lockColumnType =
    fkRelations.find(
      (fk) =>
        fk.columns.find((col) => col.source === columnFields?.name) !== undefined && !fk.toRemove
    ) !== undefined

  useEffect(() => {
    if (visible) {
      setErrors({})
      const columnFields = isNewRecord
        ? generateColumnField({ schema: selectedTable.schema, table: selectedTable.name })
        : generateColumnFieldFromPostgresColumn(column, selectedTable, foreignKeyMeta)
      setColumnFields(columnFields)
      setFkRelations(formatForeignKeys(foreignKeys))
    }
  }, [visible])

  if (!columnFields) return null

  const onUpdateField = (changes: Partial<ColumnField>) => {
    const isTextBasedColumn = TEXT_TYPES.includes(columnFields.format)
    if (!isTextBasedColumn && changes.defaultValue === '') {
      changes.defaultValue = null
    }

    const changedName = 'name' in changes && changes.name !== columnFields.name
    const changedFormat = 'format' in changes && changes.format !== columnFields.format

    if (
      changedName &&
      fkRelations.find((fk) => fk.columns.find(({ source }) => source === columnFields?.name))
    ) {
      setFkRelations(
        fkRelations.map((relation) => ({
          ...relation,
          columns: relation.columns.map((col) =>
            col.source === columnFields?.name ? { ...col, source: changes.name! } : col
          ),
        }))
      )
    }

    if (changedName || changedFormat) {
      setPlaceholder(
        getPlaceholderText(changes.format || columnFields.format, changes.name || columnFields.name)
      )
    }

    const updatedColumnFields: ColumnField = { ...columnFields, ...changes }
    setColumnFields(updatedColumnFields)
    updateEditorDirty()

    const updatedErrors = { ...errors }
    for (const key of Object.keys(changes)) {
      delete updatedErrors[key]
    }
    setErrors(updatedErrors)
  }

  const onSaveChanges = (resolve: () => void) => {
    if (columnFields) {
      const errors = validateFields(columnFields)
      setErrors(errors)

      if (isEmpty(errors)) {
        const payload = isNewRecord
          ? generateCreateColumnPayload(selectedTable, columnFields)
          : generateUpdateColumnPayload(column!, selectedTable, columnFields)
        const configuration = {
          columnId: column?.id,
          primaryKey,
          foreignKeyRelations: fkRelations,
          existingForeignKeyRelations: foreignKeys,
        }
        saveChanges(payload, isNewRecord, configuration, resolve)
      } else {
        resolve()
      }
    }
  }

  return (
    <SidePanel
      size="xlarge"
      key="ColumnEditor"
      visible={visible}
      // @ts-ignore
      onConfirm={(resolve: () => void) => onSaveChanges(resolve)}
      // @ts-ignore
      header={<HeaderTitle table={selectedTable} column={column} />}
      onCancel={closePanel}
      customFooter={
        <ActionBar
          backButtonLabel="取消"
          applyButtonLabel="保存"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
    >
      <FormSection header={<FormSectionLabel className="lg:!col-span-4">常规</FormSectionLabel>}>
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Input
            label="名称"
            type="text"
            descriptionText="建议使用小写字母，并使用下划线分隔单词，例如 column_name"
            placeholder="column_name"
            error={errors.name}
            value={columnFields?.name ?? ''}
            onChange={(event: any) => onUpdateField({ name: event.target.value })}
          />
          <Input
            label="描述"
            labelOptional="可选"
            type="text"
            value={columnFields?.comment ?? ''}
            onChange={(event: any) => onUpdateField({ comment: event.target.value })}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel
            className="lg:!col-span-4"
            description={
              <div className="space-y-2">
                <Button asChild type="default" size="tiny" icon={<Plus strokeWidth={2} />}>
                  <Link href={`/project/${ref}/database/types`} target="_blank" rel="noreferrer">
                    创建枚举类型
                  </Link>
                </Button>
                <Button
                  asChild
                  type="default"
                  size="tiny"
                  icon={<ExternalLink size={14} strokeWidth={2} />}
                >
                  <Link
                    href="https://supabase.com/docs/guides/database/tables#data-types"
                    target="_blank"
                    rel="noreferrer"
                  >
                    关于数据类型
                  </Link>
                </Button>
              </div>
            }
          >
            数据类型
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <ColumnType
            showRecommendation
            value={columnFields?.format ?? ''}
            layout="vertical"
            enumTypes={enumTypes}
            error={errors.format}
            description={
              lockColumnType ? '无法改变列类型，因为它设置了外键关联' : ''
            }
            disabled={lockColumnType}
            onOptionSelect={(format: string) => onUpdateField({ format, defaultValue: null })}
          />
          {columnFields.foreignKey === undefined && (
            <div className="space-y-4">
              {columnFields.format.includes('int') && (
                <div className="w-full">
                  <Checkbox
                    label="设为标识符"
                    description="自动为列分配一个连续的唯一数字"
                    checked={columnFields.isIdentity}
                    onChange={() => {
                      const isIdentity = !columnFields.isIdentity
                      const isArray = isIdentity ? false : columnFields.isArray
                      onUpdateField({ isIdentity, isArray })
                    }}
                  />
                </div>
              )}
              {!columnFields.isPrimaryKey && (
                <div className="w-full">
                  <Checkbox
                    label="定义为数组"
                    description="允许列被定义为可变长度的多维数组"
                    checked={columnFields.isArray}
                    onChange={() => {
                      const isArray = !columnFields.isArray
                      const isIdentity = isArray ? false : columnFields.isIdentity
                      onUpdateField({ isArray, isIdentity })
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <ColumnDefaultValue
            columnFields={columnFields}
            enumTypes={enumTypes}
            onUpdateField={onUpdateField}
          />
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">外键</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <ColumnForeignKey
            column={columnFields}
            relations={fkRelations}
            closePanel={closePanel}
            onUpdateColumnType={(format: string) => {
              if (format[0] === '_') {
                onUpdateField({ format: format.slice(1), isArray: true, isIdentity: false })
              } else {
                onUpdateField({ format })
              }
            }}
            onUpdateFkRelations={setFkRelations}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">约束</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Toggle
            label="设为主键"
            descriptionText="主键表示可唯一标识行的一列或一组列"
            checked={columnFields?.isPrimaryKey ?? false}
            onChange={() => onUpdateField({ isPrimaryKey: !columnFields?.isPrimaryKey })}
          />
          <Toggle
            label="可空"
            descriptionText="允许该列在没有提供值时设为 NULL 值"
            checked={columnFields.isNullable}
            onChange={() => onUpdateField({ isNullable: !columnFields.isNullable })}
          />
          <Toggle
            label="设为唯一值"
            descriptionText="强制该列的值在所有行中唯一"
            checked={columnFields.isUnique}
            onChange={() => onUpdateField({ isUnique: !columnFields.isUnique })}
          />
          <Input
            label="约束检查"
            labelOptional="可选"
            placeholder={placeholder}
            type="text"
            value={columnFields?.check ?? ''}
            onChange={(event: any) => onUpdateField({ check: event.target.value })}
            className="[&_input]:font-mono"
          />
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}

export default ColumnEditor
