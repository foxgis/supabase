import { partition, sortBy } from 'lodash'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import SchemaSelector from 'components/ui/SchemaSelector'
import ShimmeringLoader, { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DatabaseIndex, useIndexesQuery } from 'data/database/indexes-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { AlertCircle, Search, Trash } from 'lucide-react'
import { Button, Input, SidePanel } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'
import CreateIndexSidePanel from './CreateIndexSidePanel'

const Indexes = () => {
  const { project } = useProjectContext()
  const { schema: urlSchema, table } = useParams()

  const [search, setSearch] = useState('')
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [showCreateIndex, setShowCreateIndex] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<DatabaseIndex>()
  const [selectedIndexToDelete, setSelectedIndexToDelete] = useState<DatabaseIndex>()

  const {
    data: allIndexes,
    refetch: refetchIndexes,
    error: indexesError,
    isLoading: isLoadingIndexes,
    isSuccess: isSuccessIndexes,
    isError: isErrorIndexes,
  } = useIndexesQuery({
    schema: selectedSchema,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: schemas,
    isLoading: isLoadingSchemas,
    isSuccess: isSuccessSchemas,
    isError: isErrorSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess() {
      refetchIndexes()
      setSelectedIndexToDelete(undefined)
      toast.success('成功删除了索引')
    },
    onError(error) {
      toast.error(`删除索引失败：${error.message}`)
    },
  })

  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const sortedIndexes = sortBy(allIndexes?.result ?? [], (index) => index.name.toLocaleLowerCase())
  const indexes =
    search.length > 0
      ? sortedIndexes.filter((index) => index.name.includes(search) || index.table.includes(search))
      : sortedIndexes

  const onConfirmDeleteIndex = (index: DatabaseIndex) => {
    if (!project) return console.error('未找到项目')
    execute({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql: `drop index if exists "${index.name}"`,
    })
  }

  useEffect(() => {
    if (urlSchema !== undefined) {
      const schema = schemas?.find((s) => s.name === urlSchema)
      if (schema !== undefined) setSelectedSchema(schema.name)
    }
  }, [urlSchema, isSuccessSchemas])

  useEffect(() => {
    if (table !== undefined) setSearch(table)
  }, [table])

  return (
    <>
      <div className="pb-8">
        <div className="flex flex-col gap-y-4">
<<<<<<< HEAD
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isLoadingSchemas && <ShimmeringLoader className="w-[260px]" />}
              {isErrorSchemas && (
                <div className="w-[260px] text-foreground-light text-sm border px-3 py-1.5 rounded flex items-center space-x-2">
                  <IconAlertCircle strokeWidth={2} size={16} />
                  <p>加载模式失败</p>
                </div>
              )}
              {isSuccessSchemas && (
                <SchemaSelector
                  className="w-[260px]"
                  size="small"
                  showError={false}
                  selectedSchemaName={selectedSchema}
                  onSelectSchema={setSelectedSchema}
                />
              )}
              <Input
                size="small"
                value={search}
                className="w-64"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="查找索引"
                icon={<IconSearch size={14} />}
=======
          <div className="flex items-center gap-2 flex-wrap">
            {isLoadingSchemas && <ShimmeringLoader className="w-[260px]" />}
            {isErrorSchemas && (
              <div className="w-[260px] text-foreground-light text-sm border px-3 py-1.5 rounded flex items-center space-x-2">
                <AlertCircle strokeWidth={2} size={16} />
                <p>Failed to load schemas</p>
              </div>
            )}
            {isSuccessSchemas && (
              <SchemaSelector
                className="w-[260px]"
                size="small"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={setSelectedSchema}
>>>>>>> upstream/master
              />
            )}
            <Input
              size="small"
              value={search}
              className="w-64"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for an index"
              icon={<Search size={14} />}
            />

            {!isLocked && (
              <Button
                className="ml-auto"
                type="primary"
                onClick={() => setShowCreateIndex(true)}
                disabled={!isSuccessSchemas}
              >
                创建索引
              </Button>
            )}
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="索引" />}

          {isLoadingIndexes && <GenericSkeletonLoader />}

          {isErrorIndexes && (
            <AlertError error={indexesError as any} subject="获取数据库索引失败" />
          )}

          {isSuccessIndexes && (
            <Table
              head={[
                <Table.th key="schema">模式</Table.th>,
                <Table.th key="table">表</Table.th>,
                <Table.th key="name">名称</Table.th>,
                <Table.th key="buttons"></Table.th>,
              ]}
              body={
                <>
                  {sortedIndexes.length === 0 && search.length === 0 && (
                    <Table.tr>
                      <Table.td colSpan={4}>
                        <p className="text-sm text-foreground">尚未创建索引</p>
                        <p className="text-sm text-foreground-light">
                          在模式 "{selectedSchema}" 中未找到索引
                        </p>
                      </Table.td>
                    </Table.tr>
                  )}
                  {sortedIndexes.length === 0 && search.length > 0 && (
                    <Table.tr>
                      <Table.td colSpan={4}>
                        <p className="text-sm text-foreground">未找到结果</p>
                        <p className="text-sm text-foreground-light">
                          您搜索的 "{search}" 没有返回任何结果
                        </p>
                      </Table.td>
                    </Table.tr>
                  )}
                  {indexes.length > 0 &&
                    indexes.map((index) => (
                      <Table.tr key={index.name}>
                        <Table.td>
                          <p title={index.schema}>{index.schema}</p>
                        </Table.td>
                        <Table.td>
                          <p title={index.table}>{index.table}</p>
                        </Table.td>
                        <Table.td>
                          <p title={index.name}>{index.name}</p>
                        </Table.td>
                        <Table.td>
                          <div className="flex justify-end items-center space-x-2">
                            <Button type="default" onClick={() => setSelectedIndex(index)}>
                              查看定义
                            </Button>
                            {!isLocked && (
                              <Button
                                type="text"
                                className="px-1"
                                icon={<Trash />}
                                onClick={() => setSelectedIndexToDelete(index)}
                              />
                            )}
                          </div>
                        </Table.td>
                      </Table.tr>
                    ))}
                </>
              }
            />
          )}
        </div>
      </div>

      <SidePanel
        size="xlarge"
        visible={selectedIndex !== undefined}
        header={
          <>
            <span>索引：</span>
            <code className="text-sm ml-2">{selectedIndex?.name}</code>
          </>
        }
        onCancel={() => setSelectedIndex(undefined)}
      >
        <div className="h-full">
          <div className="relative h-full">
            <CodeEditor
              isReadOnly
              id={selectedIndex?.name ?? ''}
              language="pgsql"
              defaultValue={selectedIndex?.definition ?? ''}
            />
          </div>
        </div>
      </SidePanel>

      <CreateIndexSidePanel visible={showCreateIndex} onClose={() => setShowCreateIndex(false)} />

      <ConfirmationModal
        variant="warning"
        size="medium"
        loading={isExecuting}
        visible={selectedIndexToDelete !== undefined}
        title={
          <>
            确认删除索引 <code className="text-sm">{selectedIndexToDelete?.name}</code>
          </>
        }
        confirmLabel="确认删除"
        confirmLabelLoading="正在删除..."
        onConfirm={() =>
          selectedIndexToDelete !== undefined ? onConfirmDeleteIndex(selectedIndexToDelete) : {}
        }
        onCancel={() => setSelectedIndexToDelete(undefined)}
        alert={{
          title: '此操作无法撤销',
          description:
            '删除仍在使用的索引将会导致查询变慢，并且在某些情况下会导致显著的性能问题。',
        }}
      >
        <ul className="mt-4 space-y-5">
          <li className="flex gap-3">
            <div>
              <strong className="text-sm">在删除此索引之前，请考虑：</strong>
              <ul className="space-y-2 mt-2 text-sm text-foreground-light">
                <li className="list-disc ml-6">此索引不再被使用</li>
                <li className="list-disc ml-6">
                  此索引上的表当前未使用，因为删除索引需要在表上获取短暂的独占访问锁。
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </ConfirmationModal>
    </>
  )
}

export default Indexes
