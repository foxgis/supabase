import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop, sortBy } from 'lodash'
import { Edit, Edit2, FileText, MoreVertical, Trash } from 'lucide-react'
import { useRouter } from 'next/router'

import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface FunctionListProps {
  schema: string
  filterString: string
  isLocked: boolean
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const FunctionList = ({
  schema,
  filterString,
  isLocked,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionListProps) => {
  const router = useRouter()
  const { data: selectedProject } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const snap = useAppStateSnapshot()

  const { data: functions } = useDatabaseFunctionsQuery({
    projectRef: selectedProject?.ref,
    connectionString: selectedProject?.connectionString,
  })

  const filteredFunctions = (functions ?? []).filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _functions = sortBy(
    filteredFunctions.filter((x) => x.schema == schema),
    (func) => func.name.toLocaleLowerCase()
  )
  const projectRef = selectedProject?.ref
  const canUpdateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  if (_functions.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">还未创建函数</p>
          <p className="text-sm text-foreground-light">
            在模式 "{schema}" 中未找到函数
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_functions.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">未找到结果</p>
          <p className="text-sm text-foreground-light">
            您搜索的 "{filterString}" 没有返回任何结果
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  return (
    <>
      {_functions.map((x) => {
        const isApiDocumentAvailable = schema == 'public' && x.return_type !== 'trigger'

        return (
          <Table.tr key={x.id}>
            <Table.td className="truncate">
              <Button
                type="text"
                className="text-foreground text-sm p-0 hover:bg-transparent"
                onClick={() => editFunction(x)}
              >
                {x.name}
              </Button>
            </Table.td>
            <Table.td className="table-cell overflow-auto">
              <p title={x.argument_types} className="truncate">
                {x.argument_types || '-'}
              </p>
            </Table.td>
            <Table.td className="table-cell">
              <p title={x.return_type}>{x.return_type}</p>
            </Table.td>
            <Table.td className="table-cell">{x.security_definer ? '定义者权限' : '调用者权限'}</Table.td>
            <Table.td className="text-right">
              {!isLocked && (
                <div className="flex items-center justify-end">
                  {canUpdateFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="More options"
                          type="default"
                          className="px-1"
                          icon={<MoreVertical />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" className="w-52">
                        {isApiDocumentAvailable && (
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => {
                              snap.setActiveDocsSection(['stored-procedures'])
                              snap.setShowProjectApiDocs(true)
                            }}
                          >
                            <FileText size={14} />
                            <p>API 文档</p>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="space-x-2" onClick={() => editFunction(x)}>
                          <Edit2 size={14} />
                          <p>编辑函数</p>
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem
                          className="space-x-2"
                          onClick={() => {
                            aiSnap.newChat({
                              name: `Update function ${x.name}`,
                              open: true,
                              initialInput: 'Update this function to do...',
                              suggestions: {
                                title:
                                  'I can help you make a change to this function, here are a few example prompts to get you started:',
                                prompts: [
                                  {
                                    label: 'Rename Function',
                                    description: 'Rename this function to ...',
                                  },
                                  {
                                    label: 'Modify Function',
                                    description: 'Modify this function so that it ...',
                                  },
                                  {
                                    label: 'Add Trigger',
                                    description:
                                      'Add a trigger for this function that calls it when ...',
                                  },
                                ],
                              },
                              sqlSnippets: [x.complete_statement],
                            })
                          }}
                        >
                          <Edit size={14} />
                          <p>Edit function with Assistant</p>
                        </DropdownMenuItem> */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="space-x-2" onClick={() => deleteFunction(x)}>
                          <Trash size={14} className="text-destructive" />
                          <p>删除函数</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <ButtonTooltip
                      disabled
                      type="default"
                      icon={<MoreVertical />}
                      className="px-1"
                      tooltip={{
                        content: {
                          side: 'left',
                          text: '您需要额外的权限才能更新函数',
                        },
                      }}
                    />
                  )}
                </div>
              )}
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}

export default FunctionList
