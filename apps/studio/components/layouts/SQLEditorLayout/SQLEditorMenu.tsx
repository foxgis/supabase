import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FilePlus, FolderPlus, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import {
  createSqlSnippetSkeleton,
  createSqlSnippetSkeletonV2,
} from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideBarFilters,
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'
import { SQLEditorNavV1 } from './SQLEditorNavV1'
import { SQLEditorNav as SQLEditorNavV2 } from './SQLEditorNavV2/SQLEditorNav'

export const SQLEditorMenu = ({ onViewOngoingQueries }: { onViewOngoingQueries: () => void }) => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref, id: activeId } = useParams()

  const [searchText, setSearchText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  const snap = useSqlEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const enableFolders = useFlag('sqlFolderOrganization')

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => postDeleteCleanup(data),
    onError: (error, data) => {
      if (error.code === 404 && error.message.includes('未找到内容')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`删除查询失败: ${error.message}`)
      }
    },
  })

  const postDeleteCleanup = (ids: string[]) => {
    setShowDeleteModal(false)
    setSelectedQueries([])
    if (ids.length > 0) ids.forEach((id) => snap.removeSnippet(id))
    const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => !ids.includes(x))
    if (existingSnippetIds.length === 0) {
      router.push(`/project/${ref}/sql/new`)
    } else if (ids.includes(activeId as string)) {
      router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
    }
  }

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
      if (enableFolders) {
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
      } else {
        const snippet = createSqlSnippetSkeleton({
          id: uuidv4(),
          name: untitledSnippetTitle,
          owner_id: profile?.id,
          project_id: project?.id,
        })
        snap.addSnippet(snippet as SqlSnippet, ref)
        router.push(`/project/${ref}/sql/${snippet.id}`)
        setSearchText('')
      }
    } catch (error: any) {
      toast.error(`创建查询失败: ${error.message}`)
    }
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('未找到项目号')
    deleteContent({ projectRef: ref, ids: selectedQueries })
  }

  return (
    <>
      <div className="h-full flex flex-col justify-between">
        <div className="mt-4 mb-2 flex flex-col gap-y-4">
          <div className="mx-4 flex items-center justify-between gap-x-2">
            {enableFolders ? (
              <>
                {/* [Joshen] Just double check with Jonny if this is okay */}
                <InnerSideBarFilters className="w-full p-0 gap-0">
                  <InnerSideBarFilterSearchInput
                    name="search-queries"
                    placeholder="查找查询..."
                    aria-labelledby="search-queries"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value.trim())}
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
                      创建新的代码片段
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-x-2" onClick={() => createNewFolder()}>
                      <FolderPlus size={14} />
                      创建新文件夹
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                block
                type="default"
                className="justify-start"
                onClick={() => handleNewQuery()}
                icon={<Plus className="text-foreground-muted" strokeWidth={1} size={14} />}
              >
                新查询
              </Button>
            )}
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

          {enableFolders ? (
            <SQLEditorNavV2 searchText={searchText} />
          ) : (
            <SQLEditorNavV1
              searchText={searchText}
              setSearchText={setSearchText}
              selectedQueries={selectedQueries}
              handleNewQuery={handleNewQuery}
              setSelectedQueries={setSelectedQueries}
              setShowDeleteModal={setShowDeleteModal}
            />
          )}
        </div>

        <div className="p-4 border-t sticky bottom-0 bg-studio">
          <Button block type="default" onClick={onViewOngoingQueries}>
            查看正在运行的查询
          </Button>
        </div>
      </div>

      <ConfirmationModal
        title="确定要删除查询？"
        confirmLabel={`删除 ${selectedQueries.length.toLocaleString()} 条查询${selectedQueries.length > 1 ? '' : ''}`}
        confirmLabelLoading="正在删除查询"
        size="medium"
        loading={isDeleting}
        visible={showDeleteModal}
        onConfirm={onConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant={'destructive'}
        alert={{
          title: '本操作无法被撤销',
          description: '一旦删除了选中的 SQL 代码片段将不能再恢复',
        }}
      >
        <p className="text-sm text-foreground-light">
          您确定想要删除选中的 {selectedQueries.length} 条查询吗？
          {selectedQueries.length > 1 ? '' : ''}
        </p>
      </ConfirmationModal>
    </>
  )
}
