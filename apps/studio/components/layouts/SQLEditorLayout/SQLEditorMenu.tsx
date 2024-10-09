import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FilePlus, FolderPlus, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import {
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideBarFilters,
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'
import { SQLEditorNav as SQLEditorNavV2 } from './SQLEditorNavV2/SQLEditorNav'

interface SQLEditorMenuProps {
  onViewOngoingQueries: () => void
}

export const SQLEditorMenu = ({ onViewOngoingQueries }: SQLEditorMenuProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref, id: activeId } = useParams()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const [searchText, setSearchText] = useState('')
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const createNewFolder = () => {
    // [Joshen] LEFT OFF: We need to figure out a good UX for creating folders
    // - Modal? Directly chuck into the tree view like storage explorer?
    if (!ref) return console.error('未找到项目号')
    snapV2.addNewFolder({ projectRef: ref })
    // createFolder({ projectRef: ref, name: 'test' })
  }

  const handleNewQuery = async () => {
    if (!ref) return console.error('未找到项目号')
    if (!project) return console.error('未找到项目')
    if (!profile) return console.error('未找到用户资料')
    if (!canCreateSQLSnippet) {
      return toast('您的查询历史可能会丢失，因为您没有足够的权限')
    }

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile.id,
        project_id: project.id,
        sql: '',
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      router.push(`/project/${ref}/sql/${snippet.id}`)
      setSearchText('')
    } catch (error: any) {
      toast.error(`创建查询失败: ${error.message}`)
    }
  }

  return (
    <>
      <div className="h-full flex flex-col justify-between">
        <div className="mt-4 mb-2 flex flex-col gap-y-4">
          <div className="mx-4 flex items-center justify-between gap-x-2">
            <InnerSideBarFilters className="w-full p-0 gap-0">
              <InnerSideBarFilterSearchInput
                name="search-queries"
                placeholder="查找查询..."
                aria-labelledby="查找查询"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              >
                <InnerSideBarFilterSortDropdown
                  value={snapV2.order}
                  onValueChange={(value: any) => snapV2.setOrder(value)}
                >
                  <InnerSideBarFilterSortDropdownItem key="name" value="name">
                    名称
                  </InnerSideBarFilterSortDropdownItem>
                  <InnerSideBarFilterSortDropdownItem key="inserted_at" value="inserted_at">
                    创建时间
                  </InnerSideBarFilterSortDropdownItem>
                </InnerSideBarFilterSortDropdown>
              </InnerSideBarFilterSearchInput>
            </InnerSideBarFilters>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="default"
                  icon={<Plus className="text-foreground" />}
                  className="w-[26px]"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" className="w-48">
                <DropdownMenuItem className="gap-x-2" onClick={() => handleNewQuery()}>
                  <FilePlus size={14} />
                  创建代码片段
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-x-2" onClick={() => createNewFolder()}>
                  <FolderPlus size={14} />
                  创建新文件夹
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="px-2">
            <InnerSideMenuItem
              title="Templates"
              isActive={router.asPath === `/project/${ref}/sql/templates`}
              href={`/project/${ref}/sql/templates`}
            >
              查询模板
            </InnerSideMenuItem>
            <InnerSideMenuItem
              title="Quickstarts"
              isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
              href={`/project/${ref}/sql/quickstarts`}
            >
              快速开始
            </InnerSideMenuItem>
          </div>

          <SQLEditorNavV2 searchText={searchText} />
        </div>

        <div className="p-4 border-t sticky bottom-0 bg-studio">
          <Button block type="default" onClick={onViewOngoingQueries}>
            查看正在运行的查询
          </Button>
        </div>
      </div>
    </>
  )
}
