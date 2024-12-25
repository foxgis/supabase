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
import { useLocalStorage } from 'hooks/misc/useLocalStorage'

interface SQLEditorMenuProps {
  onViewOngoingQueries: () => void
}

export const SQLEditorMenu = ({ onViewOngoingQueries }: SQLEditorMenuProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref } = useParams()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [sort, setSort] = useLocalStorage<'name' | 'inserted_at'>('sql-editor-sort', 'inserted_at')

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const createNewFolder = () => {
    if (!ref) return console.error('未找到项目号')
    snapV2.addNewFolder({ projectRef: ref })
  }

  const handleNewQuery = async () => {
    if (!ref) return console.error('未找到项目号')
    if (!project) return console.error('未找到项目')
    if (!profile) return console.error('未找到用户资料')
    if (!canCreateSQLSnippet) {
      return toast('您的查询历史可能会丢失，因为您没有足够的权限')
    }
    try {
      router.push(`/project/${ref}/sql/new?skip=true`)
      setSearchText('')
    } catch (error: any) {
      toast.error(`创建查询失败: ${error.message}`)
    }
  }

  return (
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
              isLoading={isSearching}
            >
              <InnerSideBarFilterSortDropdown
                value={sort}
                onValueChange={(value: any) => setSort(value)}
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
                创建新查询
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
            模版
          </InnerSideMenuItem>
          <InnerSideMenuItem
            title="Quickstarts"
            isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
            href={`/project/${ref}/sql/quickstarts`}
          >
            快速开始
          </InnerSideMenuItem>
        </div>

        <SQLEditorNavV2 searchText={searchText} sort={sort} setIsSearching={setIsSearching} />
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-studio">
        <Button block type="default" onClick={onViewOngoingQueries}>
          查询正在运行的查询
        </Button>
      </div>
    </div>
  )
}
