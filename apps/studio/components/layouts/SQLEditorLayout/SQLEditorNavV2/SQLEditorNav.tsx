import { useDebounce } from '@uidotdev/usehooks'
import { Eye, EyeOffIcon, Heart, Unlock } from 'lucide-react'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from 'components/interfaces/SQLEditor/MoveQueryModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { getContentById } from 'data/content/content-id-query'
import { useSQLSnippetFoldersDeleteMutation } from 'data/content/sql-folders-delete-mutation'
import { Snippet, SnippetFolder, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import {
  SnippetWithContent,
  useSnippetFolders,
  useSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import { cn, Separator, TreeView } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuSeparator,
} from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import SQLEditorLoadingSnippets from './SQLEditorLoadingSnippets'
import { ROOT_NODE, formatFolderResponseForTreeView, getLastItemIds } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import { useContentUpsertV2Mutation } from 'data/content/content-upsert-v2-mutation'
import { SqlSnippets } from 'types'

interface SQLEditorNavProps {
  searchText: string
  sort?: 'inserted_at' | 'name'
  setIsSearching?: Dispatch<SetStateAction<boolean>>
}

export const SQLEditorNav = ({
  searchText: _searchText,
  sort = 'inserted_at',
  setIsSearching,
}: SQLEditorNavProps) => {
  const searchText = _searchText.trim()
  const debouncedSearchText = useDebounce(searchText, 250)
  const isSearching = searchText.length > 0

  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref: projectRef, id } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [mountedId, setMountedId] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showFavoriteSnippets, setShowFavoriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  const [defaultExpandedFolderIds, setDefaultExpandedFolderIds] = useState<string[]>()
  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState<SnippetFolder>()

  const snippet = snapV2.snippets[id as string]?.snippet

  // ==========================
  // Private snippets & folders
  // ==========================
  const {
    data: privateSnippetsPages,
    isLoading,
    isPreviousData,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSQLSnippetFoldersQuery(
    { projectRef, name: debouncedSearchText, sort },
    { keepPreviousData: true }
  )

  useEffect(() => {
    if (projectRef && privateSnippetsPages) {
      privateSnippetsPages.pages.forEach((page) => {
        page.contents?.forEach((snippet) => {
          snapV2.addSnippet({
            projectRef,
            snippet,
          })
        })

        page.folders?.forEach((folder) => {
          snapV2.addFolder({ projectRef, folder })
        })
      })
    }
  }, [projectRef, privateSnippetsPages?.pages])

  const [subResults, setSubResults] = useState<{
    [id: string]: { snippets?: Snippet[]; isLoading: boolean }
  }>({})

  const filteredSnippets = useMemo(() => {
    const rootSnippets = privateSnippetsPages?.pages.flatMap((page) => page.contents ?? []) ?? []

    let snippetInfo = Object.values(subResults).reduce(
      (
        acc: {
          snippets: Snippet[]
          isLoading: boolean
          snippetIds: Set<string>
        },
        curr
      ) => {
        // filter out snippets that already exist
        const newSnippets = (curr.snippets ?? []).filter(
          (snippet) => !acc.snippetIds.has(snippet.id)
        )
        const newSnippetIds = new Set(newSnippets.map((snippet) => snippet.id))

        return {
          snippets: [...acc.snippets, ...newSnippets],
          isLoading: acc.isLoading || curr.isLoading,
          snippetIds: new Set<string>([...acc.snippetIds, ...newSnippetIds]),
        }
      },
      {
        snippets: rootSnippets,
        isLoading: isLoading || (isPreviousData && isFetching),
        snippetIds: new Set<string>(rootSnippets.map((snippet) => snippet.id)),
      }
    )

    if (snippet && snippet.visibility === 'user' && !snippetInfo.snippetIds.has(snippet.id)) {
      snippetInfo.snippetIds.add(snippet.id)
      snippetInfo.snippets = [...snippetInfo.snippets, snippet]
    }

    return snippetInfo
  }, [privateSnippetsPages?.pages, subResults, isLoading, isPreviousData, isFetching, snippet])

  const privateSnippets = useMemo(
    () =>
      filteredSnippets.snippets
        ?.filter((snippet) => snippet.visibility === 'user')
        .sort((a, b) => {
          if (sort === 'name') return a.name.localeCompare(b.name)
          else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
        }) ?? [],
    [filteredSnippets.snippets, sort]
  )
  const folders = useSnippetFolders(projectRef as string)

  const { data: privateSnippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
    visibility: 'user',
    name: debouncedSearchText,
  })
  const numPrivateSnippets = privateSnippets.length

  const privateSnippetsTreeState = useMemo(
    () =>
      folders.length === 0 && privateSnippets.length === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ folders, contents: privateSnippets }),
    [folders, privateSnippets]
  )

  const privateSnippetsLastItemIds = useMemo(
    () => getLastItemIds(privateSnippetsTreeState),
    [privateSnippetsTreeState]
  )

  // =================
  // Favorite snippets
  // =================
  const {
    data: favoriteSqlSnippetsData,
    isLoading: isLoadingFavoriteSqlSnippets,
    hasNextPage: hasMoreFavoriteSqlSnippets,
    fetchNextPage: fetchNextFavoriteSqlSnippets,
    isFetchingNextPage: isFetchingMoreFavoriteSqlSnippets,
    isSuccess: isFavoriteSnippetsSuccess,
  } = useSqlSnippetsQuery(
    {
      projectRef,
      favorite: true,
      name: debouncedSearchText,
      sort,
    },
    { enabled: showFavoriteSnippets, keepPreviousData: true }
  )

  useEffect(() => {
    if (projectRef === undefined || !isFavoriteSnippetsSuccess) return

    favoriteSqlSnippetsData.pages.forEach((page) => {
      page.contents?.forEach((snippet) => {
        snapV2.addSnippet({
          projectRef,
          snippet,
        })
      })
    })
  }, [projectRef, privateSnippetsPages?.pages])

  const favoriteSnippets = useMemo(() => {
    let snippets = favoriteSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []

    if (snippet && snippet.favorite && !snippets.find((x) => x.id === snippet.id)) {
      snippets.push(snippet as any)
    }

    return (
      snippets
        .map((snippet) => ({ ...snippet, folder_id: undefined }))
        .sort((a, b) => {
          if (sort === 'name') return a.name.localeCompare(b.name)
          else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
        }) ?? []
    )
  }, [favoriteSqlSnippetsData?.pages, snippet, sort])

  const { data: favoritedSnippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
    favorite: true,
    name: debouncedSearchText,
  })
  const numFavoriteSnippets = favoriteSnippets.length

  const favoritesTreeState = useMemo(
    () =>
      numFavoriteSnippets === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: favoriteSnippets }),
    [favoriteSnippets, numFavoriteSnippets]
  )

  const favoriteSnippetsLastItemIds = useMemo(
    () => getLastItemIds(favoritesTreeState),
    [favoritesTreeState]
  )

  // =================
  // Shared snippets
  // =================
  const {
    data: sharedSqlSnippetsData,
    isLoading: isLoadingSharedSqlSnippets,
    hasNextPage: hasMoreSharedSqlSnippets,
    fetchNextPage: fetchNextSharedSqlSnippets,
    isFetchingNextPage: isFetchingMoreSharedSqlSnippets,
    isSuccess: isSharedSqlSnippetsSuccess,
  } = useSqlSnippetsQuery(
    {
      projectRef,
      visibility: 'project',
      name: debouncedSearchText,
      sort,
    },
    { enabled: showSharedSnippets, keepPreviousData: true }
  )

  useEffect(() => {
    if (projectRef === undefined || !isSharedSqlSnippetsSuccess) return

    sharedSqlSnippetsData.pages.forEach((page) => {
      page.contents?.forEach((snippet) => {
        snapV2.addSnippet({
          projectRef,
          snippet,
        })
      })
    })
  }, [projectRef, privateSnippetsPages?.pages])

  const sharedSnippets = useMemo(() => {
    let snippets = sharedSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []

    if (snippet && snippet.visibility === 'project' && !snippets.find((x) => x.id === snippet.id)) {
      snippets.push(snippet as any)
    }

    return (
      snippets.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
      }) ?? []
    )
  }, [sharedSqlSnippetsData?.pages, snippet, sort])

  const { data: sharedSnippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
    visibility: 'project',
    name: debouncedSearchText,
  })
  const numProjectSnippets = sharedSnippets.length

  const projectSnippetsTreeState = useMemo(
    () =>
      numProjectSnippets === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: sharedSnippets }),
    [sharedSnippets, numProjectSnippets]
  )

  const projectSnippetsLastItemIds = useMemo(
    () => getLastItemIds(projectSnippetsTreeState),
    [projectSnippetsTreeState]
  )

  // ==========================
  // Snippet mutations from  RQ
  // ==========================

  const { mutate: upsertContent, isLoading: isUpserting } = useContentUpsertV2Mutation({
    onError: (error) => {
      toast.error(`Failed to update query: ${error.message}`)
    },
  })

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onError: (error, data) => {
      if (error.message.includes('未找到内容')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`删除查询失败：${error.message}`)
      }
    },
  })

  const { mutate: deleteFolder, isLoading: isDeletingFolder } = useSQLSnippetFoldersDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success('成功删除了文件夹')
      const { ids } = vars
      snapV2.removeFolder(ids[0])
      setSelectedFolderToDelete(undefined)
    },
  })

  // ===============
  // UI functions
  // ===============

  const postDeleteCleanup = (ids: string[]) => {
    // [Refactor] To investigate - deleting a snippet while it's open, will have it in the side nav
    // for a bit, before it gets removed (assumingly invalidated)
    setShowDeleteModal(false)
    setSelectedSnippets([])
    const existingSnippetIds = Object.keys(snapV2.snippets).filter((x) => !ids.includes(x))

    if (existingSnippetIds.length === 0) {
      router.push(`/project/${projectRef}/sql/new`)
    } else if (ids.includes(id as string)) {
      router.push(`/project/${projectRef}/sql/${existingSnippetIds[0]}`)
    }

    if (ids.length > 0) ids.forEach((id) => snapV2.removeSnippet(id))
  }

  const onConfirmDelete = () => {
    if (!projectRef) return console.error('未找到项目号')
    deleteContent(
      { projectRef, ids: selectedSnippets.map((x) => x.id) },
      {
        onSuccess: (data) => {
          toast.success(
            `成功删除了 ${selectedSnippets.length.toLocaleString()} 条查询${selectedSnippets.length > 1 ? '' : ''}`
          )
          postDeleteCleanup(data)
        },
      }
    )
  }

  const onUpdateVisibility = async (action: 'share' | 'unshare') => {
    const snippet = action === 'share' ? selectedSnippetToShare : selectedSnippetToUnshare
    if (!projectRef) return console.error('未找到项目号')
    if (!snippet) return console.error('未找到查询 ID')

    const storeSnippet = snapV2.snippets[snippet.id]
    let snippetContent = storeSnippet?.snippet?.content

    if (snippetContent === undefined) {
      const { content } = await getContentById({ projectRef, id: snippet.id })
      snippetContent = content as unknown as SqlSnippets.Content
    }

    // [Joshen] Just as a final check - to ensure that the content is minimally there (empty string is fine)
    if (snippetContent === undefined) {
      return toast.error('未能更新查询的可见性：未找到查询内容')
    }

    const visibility = action === 'share' ? 'project' : 'user'

    upsertContent(
      {
        projectRef,
        payload: {
          ...snippet,
          visibility,
          folder_id: null,
          content: snippetContent,
        },
      },
      {
        onSuccess: () => {
          setSelectedSnippetToShare(undefined)
          setSelectedSnippetToUnshare(undefined)
          setShowSharedSnippets(true)
          snapV2.updateSnippet({
            id: snippet.id,
            snippet: { visibility, folder_id: null },
            skipSave: true,
          })
          toast.success(
            action === 'share'
              ? '查询已共享到项目'
              : '查询已从项目中取消共享'
          )
        },
      }
    )
  }

  const onSelectCopyPersonal = async (snippet: SnippetWithContent) => {
    if (!profile) return console.error('未找到用户信息')
    if (!project) return console.error('未找到项目')
    if (!projectRef) return console.error('未找到项目号')
    if (!snippet) return console.error('未找到查询 ID')

    let sql: string = ''
    if (snippet.content && snippet.content.sql) {
      sql = snippet.content.sql
    } else {
      // Fetch the content first
      const { content } = await getContentById({ projectRef, id: snippet.id })
      if ('sql' in content) {
        sql = content.sql
      }
    }

    const snippetCopy = createSqlSnippetSkeletonV2({
      id: uuidv4(),
      name: snippet.name,
      sql,
      owner_id: profile?.id,
      project_id: project?.id,
    })

    snapV2.addSnippet({ projectRef, snippet: snippetCopy })
    snapV2.addNeedsSaving(snippetCopy.id!)
    router.push(`/project/${projectRef}/sql/${snippetCopy.id}`)
  }

  const onConfirmDeleteFolder = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (selectedFolderToDelete === undefined) return console.error('未选中文件夹')

    const folderSnippets = privateSnippets.filter(
      (content) => content.folder_id === selectedFolderToDelete.id
    )
    if (folderSnippets.length > 0) {
      const ids = folderSnippets.map((x) => x.id)
      deleteContent(
        { projectRef, ids },
        {
          onSuccess: () => {
            ids.forEach((id) => snapV2.removeSnippet(id))
            postDeleteCleanup(ids)
            deleteFolder({ projectRef, ids: [selectedFolderToDelete?.id] })
          },
        }
      )
    } else {
      deleteFolder({ projectRef, ids: [selectedFolderToDelete?.id] })
    }
  }

  // [Joshen] Just FYI doing a controlled state instead of letting the TreeView component doing it because
  // 1. There seems to be no way of accessing the internal state of the TreeView to retrieve the selected nodes
  // 2. The component itself doesn't handle UUID for node IDs well - trying to multi select doesn't select the expected nodes
  // We're only supporting shift clicks (not cmd/control click) - this is even with the react tree view component itself
  const onMultiSelect = (selectedId: string) => {
    // The base is always the current query thats selected
    const contentIds = privateSnippets.map((x) => x.id)
    const baseIndex = contentIds.indexOf(id as string)
    const targetIndex = contentIds.indexOf(selectedId)

    const floor = Math.min(baseIndex, targetIndex)
    const ceiling = Math.max(baseIndex, targetIndex)

    const _selectedSnippets = []
    const sameFolder = privateSnippets[floor].folder_id === privateSnippets[ceiling].folder_id

    for (let i = floor; i <= ceiling; i++) {
      if (sameFolder) {
        if (privateSnippets[i].folder_id === privateSnippets[floor].folder_id)
          _selectedSnippets.push(privateSnippets[i])
      } else {
        // [Joshen] Temp don't allow selecting across folders for now
        // _selectedSnippets.push(contents[i])
      }
    }

    setSelectedSnippets(_selectedSnippets)
  }

  // ===============
  // useEffects
  // ===============

  useEffect(() => {
    setIsSearching?.(filteredSnippets.isLoading)
  }, [filteredSnippets.isLoading, setIsSearching])

  useEffect(() => {
    if (snippet !== undefined && !mountedId) {
      if (snippet.visibility === 'project') setShowSharedSnippets(true)
      if (snippet.folder_id) {
        setDefaultExpandedFolderIds([snippet.folder_id])
      }

      // Only want to run this once when loading sql/[id] route
      setMountedId(true)
    }
  }, [snippet, mountedId, sort, debouncedSearchText])

  useEffect(() => {
    // Unselect all snippets whenever opening another snippet
    setSelectedSnippets([])
  }, [id])

  return (
    <>
      <InnerSideMenuSeparator />
      <InnerSideMenuCollapsible
        open={showSharedSnippets}
        onOpenChange={setShowSharedSnippets}
        className="px-0"
      >
        <InnerSideMenuCollapsibleTrigger title={`分享的查询`} />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoadingSharedSqlSnippets ? (
            <SQLEditorLoadingSnippets />
          ) : numProjectSnippets === 0 ? (
            <InnerSideBarEmptyPanel
              className={cn('mx-2 px-3', isSearching ? '[&>div>p]:text-foreground-lighter' : '')}
              title={isSearching ? '基于您的搜索条件未找到符合的查询' : '暂无分享的查询'}
              description={
                isSearching
                  ? undefined
                  : '通过右键点击查询向团队分享。'
              }
            />
          ) : (
            <TreeView
              data={projectSnippetsTreeState}
              aria-label="project-level-snippets"
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
                  onSelectDelete={() => {
                    setShowDeleteModal(true)
                    setSelectedSnippets([element.metadata as unknown as Snippet])
                  }}
                  onSelectRename={() => {
                    setShowRenameModal(true)
                    setSelectedSnippetToRename(element.metadata as Snippet)
                  }}
                  onSelectDownload={() => {
                    setSelectedSnippetToDownload(element.metadata as Snippet)
                  }}
                  onSelectCopyPersonal={() => {
                    onSelectCopyPersonal(element.metadata as Snippet)
                  }}
                  onSelectUnshare={() => {
                    setSelectedSnippetToUnshare(element.metadata as Snippet)
                  }}
                  isLastItem={projectSnippetsLastItemIds.has(element.id as string)}
                  hasNextPage={hasMoreSharedSqlSnippets}
                  fetchNextPage={fetchNextSharedSqlSnippets}
                  isFetchingNextPage={isFetchingMoreSharedSqlSnippets}
                />
              )}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />

      <InnerSideMenuCollapsible
        className="px-0"
        open={showFavoriteSnippets}
        onOpenChange={setShowFavoriteSnippets}
      >
        <InnerSideMenuCollapsibleTrigger title={`收藏的查询`} />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoadingFavoriteSqlSnippets ? (
            <SQLEditorLoadingSnippets />
          ) : numFavoriteSnippets === 0 ? (
            <InnerSideBarEmptyPanel
              title={isSearching ? '基于您的搜索条件未找到符合的查询' : '暂无收藏的查询'}
              className={cn('mx-2 px-3', isSearching ? '[&>div>p]:text-foreground-lighter' : '')}
              description={
                isSearching ? null : (
                  <>
                    通过点击{' '}
                    <Heart size={12} className="inline-block relative align-center -top-[1px]" />{' '}
                    图标将查询保存到收藏以便快捷访问。
                  </>
                )
              }
            />
          ) : (
            <TreeView
              data={favoritesTreeState}
              aria-label="favorite-snippets"
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
                  onSelectDelete={() => {
                    setShowDeleteModal(true)
                    setSelectedSnippets([element.metadata as unknown as Snippet])
                  }}
                  onSelectRename={() => {
                    setShowRenameModal(true)
                    setSelectedSnippetToRename(element.metadata as Snippet)
                  }}
                  onSelectDownload={() => {
                    setSelectedSnippetToDownload(element.metadata as Snippet)
                  }}
                  onSelectCopyPersonal={() => {
                    onSelectCopyPersonal(element.metadata as Snippet)
                  }}
                  onSelectShare={() => setSelectedSnippetToShare(element.metadata as Snippet)}
                  onSelectUnshare={() => {
                    setSelectedSnippetToUnshare(element.metadata as Snippet)
                  }}
                  isLastItem={favoriteSnippetsLastItemIds.has(element.id as string)}
                  hasNextPage={hasMoreFavoriteSqlSnippets}
                  fetchNextPage={fetchNextFavoriteSqlSnippets}
                  isFetchingNextPage={isFetchingMoreFavoriteSqlSnippets}
                />
              )}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />

      <InnerSideMenuCollapsible
        open={showPrivateSnippets}
        onOpenChange={setShowPrivateSnippets}
        className="px-0"
      >
        <InnerSideMenuCollapsibleTrigger title={`私有的查询`} />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoading ? (
            <SQLEditorLoadingSnippets />
          ) : folders.length === 0 && numPrivateSnippets === 0 ? (
            <InnerSideBarEmptyPanel
              className="mx-3 px-4"
              title="还没有创建查询"
              description="当您在编辑器中开始编写查询时，查询会自动保存。"
            />
          ) : (
            <TreeView
              multiSelect
              togglableSelect
              clickAction="EXCLUSIVE_SELECT"
              data={privateSnippetsTreeState}
              selectedIds={selectedSnippets.map((x) => x.id)}
              aria-label="private-snippets"
              expandedIds={defaultExpandedFolderIds}
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
                  isMultiSelected={selectedSnippets.length > 1}
                  isLastItem={privateSnippetsLastItemIds.has(element.id as string)}
                  status={props.isBranch ? snapV2.folders[element.id].status : 'idle'}
                  onMultiSelect={onMultiSelect}
                  onSelectCreate={() => {
                    if (profile && project) {
                      const snippet = createSqlSnippetSkeletonV2({
                        id: uuidv4(),
                        name: untitledSnippetTitle,
                        owner_id: profile?.id,
                        project_id: project?.id,
                        folder_id: element.id as string,
                        sql: '',
                      })
                      snapV2.addSnippet({ projectRef: project.ref, snippet })
                      router.push(`/project/${projectRef}/sql/${snippet.id}`)
                    }
                  }}
                  onSelectDelete={() => {
                    if (props.isBranch) {
                      setSelectedFolderToDelete(element.metadata as SnippetFolder)
                    } else {
                      setShowDeleteModal(true)
                      if (selectedSnippets.length === 0) {
                        setSelectedSnippets([element.metadata as unknown as Snippet])
                      }
                    }
                  }}
                  onSelectRename={() => {
                    if (props.isBranch) {
                      snapV2.editFolder(element.id as string)
                    } else {
                      setShowRenameModal(true)
                      setSelectedSnippetToRename(element.metadata as Snippet)
                    }
                  }}
                  onSelectMove={() => {
                    setShowMoveModal(true)
                    if (selectedSnippets.length === 0) {
                      setSelectedSnippets([element.metadata as Snippet])
                    }
                  }}
                  onSelectDownload={() => setSelectedSnippetToDownload(element.metadata as Snippet)}
                  onSelectShare={() => setSelectedSnippetToShare(element.metadata as Snippet)}
                  onEditSave={(name: string) => {
                    // [Joshen] Inline editing only for folders for now
                    if (name.length === 0 && element.id === 'new-folder') {
                      snapV2.removeFolder(element.id as string)
                    } else if (name.length > 0) {
                      snapV2.saveFolder({ id: element.id as string, name })
                    }
                  }}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  sort={sort}
                  name={debouncedSearchText}
                  onFolderContentsChange={({ isLoading, snippets }) => {
                    setSubResults((prev) => ({
                      ...prev,
                      [element.id as string]: { snippets, isLoading },
                    }))
                  }}
                />
              )}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>

      <Separator />

      <RenameQueryModal
        snippet={selectedSnippetToRename}
        visible={showRenameModal}
        onCancel={() => setShowRenameModal(false)}
        onComplete={() => setShowRenameModal(false)}
      />

      <MoveQueryModal
        snippets={selectedSnippets}
        visible={showMoveModal}
        onClose={() => {
          setShowMoveModal(false)
          setSelectedSnippets([])
        }}
      />

      <DownloadSnippetModal
        id={selectedSnippetToDownload?.id ?? ''}
        visible={selectedSnippetToDownload !== undefined}
        onCancel={() => setSelectedSnippetToDownload(undefined)}
      />

      <ConfirmationModal
        size="medium"
        loading={isUpserting}
        title={`确认分享查询：${selectedSnippetToShare?.name}`}
        confirmLabel="分享查询"
        confirmLabelLoading="正在分享查询"
        visible={selectedSnippetToShare !== undefined}
        onCancel={() => setSelectedSnippetToShare(undefined)}
        onConfirm={() => onUpdateVisibility('share')}
        alert={{
          title: '此 SQL 查询将会对所有团队成员公开',
          description: '任何可访问本项目的人都可以查看它',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3 items-center">
            <Eye size={16} />
            <span>项目成员将具有此查询的只读访问权限。</span>
          </li>
          <li className="flex gap-3 items-center">
            <Unlock size={16} />
            <span>任何人都可以将它复制到他们的个人代码段收藏中。</span>
          </li>
        </ul>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        title={`确认取消分享：${selectedSnippetToUnshare?.name}`}
        confirmLabel="取消分享查询"
        confirmLabelLoading="正在取消分享查询"
        visible={selectedSnippetToUnshare !== undefined}
        onCancel={() => setSelectedSnippetToUnshare(undefined)}
        onConfirm={() => onUpdateVisibility('unshare')}
        alert={{
          title: '此 SQL 查询不再对所有团队成员公开',
          description: '只有您才有访问此查询的权限',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3">
            <EyeOffIcon />
            <span>项目成员将不再能够查看此查询。</span>
          </li>
        </ul>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        title={`确认删除${selectedSnippets.length === 1 ? '查询' : ` ${selectedSnippets.length.toLocaleString()} 条查询${selectedSnippets.length > 1 ? '' : ''}`}`}
        confirmLabel={`删除 ${selectedSnippets.length.toLocaleString()} 条查询${selectedSnippets.length > 1 ? '' : ''}`}
        confirmLabelLoading="正在删除查询"
        loading={isDeleting}
        visible={showDeleteModal}
        variant="destructive"
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedSnippets([])
        }}
        onConfirm={onConfirmDelete}
        alert={
          (selectedSnippets[0]?.visibility as unknown as string) === 'project'
            ? {
                title: '此 SQL 代码段将永远丢失',
                description:
                  '删除此查询也将从项目团队的所有成员中移除。',
              }
            : undefined
        }
      >
        <p className="text-sm">
          本操作无法撤销。{' '}
          {selectedSnippets.length === 1
            ? `您确定想要删除 '${selectedSnippets[0]?.name}' 吗？`
            : `您确定想要删除选中的 ${selectedSnippets.length} 条查询吗？`}
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        title="确认删除文件夹"
        confirmLabel="删除文件夹"
        confirmLabelLoading="正在删除文件夹"
        loading={isDeletingFolder}
        visible={selectedFolderToDelete !== undefined}
        variant="destructive"
        onCancel={() => setSelectedFolderToDelete(undefined)}
        onConfirm={onConfirmDeleteFolder}
        alert={{
          title: '本操作无法撤销',
          description:
            '此文件夹中的所有 SQL 代码段也讲会被久删除，无法恢复。',
        }}
      >
        <p className="text-sm">
          您确定要删除文件夹 '{selectedFolderToDelete?.name}' 吗？
        </p>
      </ConfirmationModal>
    </>
  )
}
