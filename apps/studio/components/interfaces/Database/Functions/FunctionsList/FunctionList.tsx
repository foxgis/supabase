import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop, sortBy } from 'lodash'
import { useRouter } from 'next/router'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconEdit3,
  IconFileText,
  IconMoreVertical,
  IconTrash,
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
  const { project: selectedProject } = useProjectContext()

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
              <p title={x.name}>{x.name}</p>
            </Table.td>
            <Table.td className="hidden md:table-cell md:overflow-auto">
              <p title={x.argument_types} className="truncate">
                {x.argument_types || '-'}
              </p>
            </Table.td>
            <Table.td className="hidden lg:table-cell">
              <p title={x.return_type}>{x.return_type}</p>
            </Table.td>
            <Table.td className="hidden lg:table-cell">
              {x.security_definer ? 'Definer' : 'Invoker'}
            </Table.td>
            <Table.td className="text-right">
              {!isLocked && (
                <div className="flex items-center justify-end">
                  {canUpdateFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" className="px-1">
                          <IconMoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left">
                        {isApiDocumentAvailable && (
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => router.push(`/project/${projectRef}/api?rpc=${x.name}`)}
                          >
                            <IconFileText size="tiny" />
                            <p>客户端 API 文档</p>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="space-x-2" onClick={() => editFunction(x)}>
                          <IconEdit3 size="tiny" />
                          <p>编辑函数</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="space-x-2" onClick={() => deleteFunction(x)}>
                          <IconTrash stroke="red" size="tiny" />
                          <p>删除函数</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <Button
                          disabled
                          type="default"
                          icon={<IconMoreVertical />}
                          className="px-1"
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content side="left">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow',
                              'border border-background',
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              您需要额外的权限才能更新函数
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
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
