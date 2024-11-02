import { Edit, MoreVertical, Search, Trash } from 'lucide-react'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import {
  EnumeratedType,
  useEnumeratedTypesQuery,
} from 'data/enumerated-types/enumerated-types-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from 'ui'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'
import CreateEnumeratedTypeSidePanel from './CreateEnumeratedTypeSidePanel'
import DeleteEnumeratedTypeModal from './DeleteEnumeratedTypeModal'
import EditEnumeratedTypeSidePanel from './EditEnumeratedTypeSidePanel'

const EnumeratedTypes = () => {
  const { project } = useProjectContext()
  const [search, setSearch] = useState('')
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [showCreateTypePanel, setShowCreateTypePanel] = useState(false)
  const [selectedTypeToEdit, setSelectedTypeToEdit] = useState<EnumeratedType>()
  const [selectedTypeToDelete, setSelectedTypeToDelete] = useState<EnumeratedType>()

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, error, isLoading, isError, isSuccess } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const enumeratedTypes = (data ?? []).filter((type) => type.enums.length > 0)
  const filteredEnumeratedTypes =
    search.length > 0
      ? enumeratedTypes.filter(
          (x) => x.schema === selectedSchema && x.name.toLowerCase().includes(search.toLowerCase())
        )
      : enumeratedTypes.filter((x) => x.schema === selectedSchema)

  const protectedSchemas = (schemas ?? []).filter((schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <SchemaSelector
            className="w-[260px]"
            size="small"
            showError={false}
            selectedSchemaName={selectedSchema}
            onSelectSchema={setSelectedSchema}
          />
          <Input
            size="small"
            value={search}
            className="w-64"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="查找类型"
            icon={<Search size={14} />}
          />
        </div>

        <div className="flex items-center gap-x-2">
          <DocsButton href="https://www.postgresql.org/docs/current/datatype-enum.html" />
          {!isLocked && (
            <Button className="ml-auto" type="primary" onClick={() => setShowCreateTypePanel(true)}>
              创建类型
            </Button>
          )}
        </div>
      </div>

      {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="枚举类型" />}

      {isLoading && <GenericSkeletonLoader />}

      {isError && (
        <AlertError error={error} subject="获取数据库枚举类型失败" />
      )}

      {isSuccess && (
        <Table
          head={[
            <Table.th key="schema">模式</Table.th>,
            <Table.th key="name">名称</Table.th>,
            <Table.th key="values">值列表</Table.th>,
            <Table.th key="actions" />,
          ]}
          body={
            <>
              {filteredEnumeratedTypes.length === 0 && search.length === 0 && (
                <Table.tr>
                  <Table.td colSpan={4}>
                    <p className="text-sm text-foreground">尚未创建枚举类型</p>
                    <p className="text-sm text-foreground-light">
                      在模式 "{selectedSchema}" 中没有找到枚举类型
                    </p>
                  </Table.td>
                </Table.tr>
              )}
              {filteredEnumeratedTypes.length === 0 && search.length > 0 && (
                <Table.tr>
                  <Table.td colSpan={4}>
                    <p className="text-sm text-foreground">未找到结果</p>
                    <p className="text-sm text-foreground-light">
                      您搜索的 "{search}" 没有返回任何结果
                    </p>
                  </Table.td>
                </Table.tr>
              )}
              {filteredEnumeratedTypes.length > 0 &&
                filteredEnumeratedTypes.map((type) => (
                  <Table.tr key={type.id}>
                    <Table.td className="w-20">
                      <p className="w-20 truncate">{type.schema}</p>
                    </Table.td>
                    <Table.td>{type.name}</Table.td>
                    <Table.td>{type.enums.join(', ')}</Table.td>
                    <Table.td>
                      {!isLocked && (
                        <div className="flex justify-end items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-32">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => setSelectedTypeToEdit(type)}
                              >
                                <Edit size={14} />
                                <p>更新类型</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => setSelectedTypeToDelete(type)}
                              >
                                <Trash size={14} />
                                <p>删除类型</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Table.td>
                  </Table.tr>
                ))}
            </>
          }
        />
      )}

      <CreateEnumeratedTypeSidePanel
        visible={showCreateTypePanel}
        onClose={() => setShowCreateTypePanel(false)}
        schema={selectedSchema}
      />

      <EditEnumeratedTypeSidePanel
        visible={selectedTypeToEdit !== undefined}
        selectedEnumeratedType={selectedTypeToEdit}
        onClose={() => setSelectedTypeToEdit(undefined)}
      />

      <DeleteEnumeratedTypeModal
        visible={selectedTypeToDelete !== undefined}
        selectedEnumeratedType={selectedTypeToDelete}
        onClose={() => setSelectedTypeToDelete(undefined)}
      />
    </div>
  )
}

export default EnumeratedTypes
