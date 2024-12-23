import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { Copy, Download, Edit, MoreHorizontal, Share, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

interface QueryItemActionsProps {
  tabInfo: SqlSnippet
  open: boolean
  setOpen: (value: boolean) => void
  onSelectRenameQuery: () => void
  onSelectDeleteQuery: () => void
  onSelectShareQuery: () => void
  onSelectDownloadQuery: () => void
}

export const QueryItemActions = ({
  tabInfo,
  open,
  setOpen,
  onSelectRenameQuery,
  onSelectDeleteQuery,
  onSelectShareQuery,
  onSelectDownloadQuery,
}: QueryItemActionsProps) => {
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()

  const snap = useSqlEditorStateSnapshot()
  const project = useSelectedProject()

  const { id, name, visibility, content, type } = tabInfo || {}
  const isSQLSnippet = type === 'sql'

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const { id: snippetID } = tabInfo || {}
  const snippet =
    snippetID !== undefined && snap.snippets && snap.snippets[snippetID] !== undefined
      ? snap.snippets[snippetID]
      : null

  const isSnippetOwner = profile?.id === snippet?.snippet.owner_id

  const onClickRename = (e: any) => {
    e.stopPropagation()
    onSelectRenameQuery()
  }

  const onClickShare = (e: any) => {
    e.stopPropagation()
    onSelectShareQuery()
  }

  const onClickDelete = (e: any) => {
    e.stopPropagation()
    onSelectDeleteQuery()
  }

  const createPersonalCopy = async () => {
    if (!isSQLSnippet) return console.error('不是 SQL 代码段')
    if (!ref) return console.error('未找到项目号')
    if (!id) return console.error('未找到代码段 ID')
    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name,
        sql: content.sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snap.addSnippet(snippet as SqlSnippet, ref)
      snap.addNeedsSaving(snippet.id!)
      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`为此查询创建个人副本失败：${error.message}`)
    }
  }

  return (
    <>
      {true ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
            asChild
            name="查询操作"
          >
            <Button
              type="text"
              className="px-1 text-lighter data-[state=open]:text-foreground"
              icon={<MoreHorizontal strokeWidth={2} />}
              onClick={(e) => e.preventDefault()}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-52">
            {isSnippetOwner && (
              <DropdownMenuItem onClick={onClickRename} className="flex gap-2">
                <Edit size={14} />
                重命名查询
              </DropdownMenuItem>
            )}

            {visibility === 'user' && canCreateSQLSnippet && (
              <DropdownMenuItem onClick={onClickShare} className="flex gap-2">
                <Share size={14} />
                分享查询
              </DropdownMenuItem>
            )}
            {visibility === 'project' && canCreateSQLSnippet && (
              <DropdownMenuItem onClick={createPersonalCopy} className="flex gap-2">
                <Copy size={14} />
                复制到个人的查询
              </DropdownMenuItem>
            )}

            {IS_PLATFORM && (
              <DropdownMenuItem onClick={() => onSelectDownloadQuery()} className="flex gap-2">
                <Download size={14} />
                下载为迁移文件
              </DropdownMenuItem>
            )}
            {isSnippetOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClickDelete} className="flex gap-2">
                  <Trash size={14} />
                  删除查询
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild disabled type="text" style={{ padding: '3px' }}>
          <span />
        </Button>
      )}
    </>
  )
}
