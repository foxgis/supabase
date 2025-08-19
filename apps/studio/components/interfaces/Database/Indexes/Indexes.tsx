import { sortBy } from 'lodash'
import { AlertCircle, Search, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import SchemaSelector from 'components/ui/SchemaSelector'
import ShimmeringLoader, { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseIndexDeleteMutation } from 'data/database-indexes/index-delete-mutation'
import { DatabaseIndex, useIndexesQuery } from 'data/database-indexes/indexes-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import {
  Button,
  Input,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
  Card,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'
import CreateIndexSidePanel from './CreateIndexSidePanel'

const Indexes = () => {
  const { data: project } = useSelectedProjectQuery()
  const { schema: urlSchema, table } = useParams()

  const [search, setSearch] = useState('')
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [showCreateIndex, setShowCreateIndex] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<DatabaseIndex>()
  const [selectedIndexToDelete, setSelectedIndexToDelete] = useState<DatabaseIndex>()

  const {
    data: allIndexes,
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

  const { mutate: deleteIndex, isLoading: isExecuting } = useDatabaseIndexDeleteMutation({
    onSuccess: async () => {
      setSelectedIndexToDelete(undefined)
      toast.success('成功删除了索引')
    },
  })

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const sortedIndexes = sortBy(allIndexes ?? [], (index) => index.name.toLocaleLowerCase())
  const indexes =
    search.length > 0
      ? sortedIndexes.filter((index) => index.name.includes(search) || index.table.includes(search))
      : sortedIndexes

  const onConfirmDeleteIndex = (index: DatabaseIndex) => {
    if (!project) return console.error('未找到项目')

    deleteIndex({
      projectRef: project.ref,
      connectionString: project.connectionString,
      name: index.name,
      schema: selectedSchema,
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
          <div className="flex items-center gap-2 flex-wrap">
            {isLoadingSchemas && <ShimmeringLoader className="w-[260px]" />}
            {isErrorSchemas && (
              <div className="w-[260px] text-foreground-light text-sm border px-3 py-1.5 rounded flex items-center space-x-2">
                <AlertCircle strokeWidth={2} size={16} />
                <p>加载模式失败</p>
              </div>
            )}
            {isSuccessSchemas && (
              <SchemaSelector
                className="w-full lg:w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={setSelectedSchema}
              />
            )}
            <Input
              size="tiny"
              value={search}
              className="w-full lg:w-52"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="查找索引"
              icon={<Search size={14} />}
            />

            {!isSchemaLocked && (
              <Button
                className="ml-auto flex-grow lg:flex-grow-0"
                type="primary"
                onClick={() => setShowCreateIndex(true)}
                disabled={!isSuccessSchemas}
              >
                创建索引
              </Button>
            )}
          </div>

          {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="索引" />}

          {isLoadingIndexes && <GenericSkeletonLoader />}

          {isErrorIndexes && (
            <AlertError error={indexesError as any} subject="获取数据库索引失败" />
          )}

          {isSuccessIndexes && (
            <div className="w-full overflow-hidden">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead key="schema">模式</TableHead>
                      <TableHead key="table">表</TableHead>
                      <TableHead key="name">名称</TableHead>
                      <TableHead key="buttons"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIndexes.length === 0 && search.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <p className="text-sm text-foreground">No indexes created yet</p>
                          <p className="text-sm text-foreground-light">
                            在模式 "{selectedSchema}" 未找到任何索引
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {sortedIndexes.length === 0 && search.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <p className="text-sm text-foreground">未找到结果</p>
                          <p className="text-sm text-foreground-light">
                            您搜索的 "{search}" 未找到任何结果
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {indexes.length > 0 &&
                      indexes.map((index) => (
                        <TableRow key={index.name}>
                          <TableCell>
                            <p title={index.schema}>{index.schema}</p>
                          </TableCell>
                          <TableCell>
                            <p title={index.table}>{index.table}</p>
                          </TableCell>
                          <TableCell>
                            <p title={index.name}>{index.name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end items-center space-x-2">
                              <Button type="default" onClick={() => setSelectedIndex(index)}>
                                查看定义
                              </Button>
                              {!isSchemaLocked && (
                                <Button
                                  aria-label="Delete index"
                                  type="text"
                                  className="px-1"
                                  icon={<Trash />}
                                  onClick={() => setSelectedIndexToDelete(index)}
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
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
          title: '本操作无法撤销',
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
