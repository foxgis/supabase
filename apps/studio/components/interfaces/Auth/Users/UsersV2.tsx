import { useQueryClient } from '@tanstack/react-query'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { ArrowDown, ArrowUp, Loader2, RefreshCw, Search, Trash, Users, X } from 'lucide-react'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { authKeys } from 'data/auth/keys'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { isAtBottom } from 'lib/helpers'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  LoadingLine,
  ResizablePanel,
  ResizablePanelGroup,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { AddUserDropdown } from './AddUserDropdown'
import { DeleteUserModal } from './DeleteUserModal'
import { UserPanel } from './UserPanel'
import {
  ColumnConfiguration,
  MAX_BULK_DELETE,
  PROVIDER_FILTER_OPTIONS,
  USERS_TABLE_COLUMNS,
} from './Users.constants'
import { formatUserColumns, formatUsersData } from './Users.utils'

export type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const gridRef = useRef<DataGridHandle>(null)
  const xScroll = useRef<number>(0)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const {
    authenticationShowProviderFilter: showProviderFilter,
    authenticationShowSortByEmail: showSortByEmail,
    authenticationShowSortByPhone: showSortByPhone,
    authenticationShowUserTypeFilter: showUserTypeFilter,
  } = useIsFeatureEnabled([
    'authentication:show_provider_filter',
    'authentication:show_sort_by_email',
    'authentication:show_sort_by_phone',
    'authentication:show_user_type_filter',
  ])

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [sortByValue, setSortByValue] = useState<string>('created_at:desc')

  const [selectedUser, setSelectedUser] = useState<string>()
  const [selectedUsers, setSelectedUsers] = useState<Set<any>>(new Set([]))
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User>()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingUsers, setIsDeletingUsers] = useState(false)

  const [
    columnConfiguration,
    setColumnConfiguration,
    { isSuccess: isSuccessStorage, isError: isErrorStorage, error: errorStorage },
  ] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AUTH_USERS_COLUMNS_CONFIGURATION(projectRef ?? ''),
    null as ColumnConfiguration[] | null
  )

  const [sortColumn, sortOrder] = sortByValue.split(':')

  const {
    data,
    error,
    isSuccess,
    isLoading,
    isRefetching,
    isError,
    isFetchingNextPage,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: filterKeywords,
      filter: filter === 'all' ? undefined : filter,
      providers: selectedProviders,
      sort: sortColumn as 'created_at' | 'email' | 'phone',
      order: sortOrder as 'asc' | 'desc',
    },
    {
      keepPreviousData: Boolean(filterKeywords),
      // [Joshen] This is to prevent the dashboard from invalidating when refocusing as it may create
      // a barrage of requests to invalidate each page esp when the project has many many users.
      staleTime: Infinity,
    }
  )

  const { data: countData, refetch: refetchCount } = useUsersCountQuery({
    projectRef,
    connectionString: project?.connectionString,
    keywords: filterKeywords,
    filter: filter === 'all' ? undefined : filter,
    providers: selectedProviders,
  })

  const { mutateAsync: deleteUser } = useUserDeleteMutation()

  const totalUsers = countData ?? 0
  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  // [Joshen] Only relevant for when selecting one user only
  const selectedUserFromCheckbox = users.find((u) => u.id === [...selectedUsers][0])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const isScrollingHorizontally = xScroll.current !== event.currentTarget.scrollLeft
    xScroll.current = event.currentTarget.scrollLeft

    if (
      isLoading ||
      isFetchingNextPage ||
      isScrollingHorizontally ||
      !isAtBottom(event) ||
      !hasNextPage
    ) {
      return
    }
    fetchNextPage()
  }

  const clearSearch = () => {
    setSearch('')
    setFilterKeywords('')
  }

  const swapColumns = (data: any[], sourceIdx: number, targetIdx: number) => {
    const updatedColumns = data.slice()
    const [removed] = updatedColumns.splice(sourceIdx, 1)
    updatedColumns.splice(targetIdx, 0, removed)
    return updatedColumns
  }

  // [Joshen] Left off here - it's tricky trying to do both column toggling and re-ordering
  const saveColumnConfiguration = AwesomeDebouncePromise(
    (event: 'resize' | 'reorder' | 'toggle', value) => {
      if (event === 'toggle') {
        const columnConfig = value.columns.map((col: any) => ({
          id: col.key,
          width: col.width,
        }))
        setColumnConfiguration(columnConfig)
      } else if (event === 'resize') {
        const columnConfig = columns.map((col, idx) => ({
          id: col.key,
          width: idx === value.idx ? value.width : col.width,
        }))
        setColumnConfiguration(columnConfig)
      } else if (event === 'reorder') {
        const columnConfig = value.columns.map((col: any) => ({
          id: col.key,
          width: col.width,
        }))
        setColumnConfiguration(columnConfig)
      }
    },
    500
  )

  const handleDeleteUsers = async () => {
    if (!projectRef) return console.error('未找到项目号')
    const userIds = [...selectedUsers]

    setIsDeletingUsers(true)
    try {
      await Promise.all(
        userIds.map((id) => deleteUser({ projectRef, userId: id, skipInvalidation: true }))
      )
      // [Joshen] Skip invalidation within RQ to prevent multiple requests, then invalidate once at the end
      await Promise.all([
        queryClient.invalidateQueries(authKeys.usersInfinite(projectRef)),
        queryClient.invalidateQueries(authKeys.usersCount(projectRef)),
      ])
      toast.success(
        `成功删除了选中的 ${selectedUsers.size} 个用户${selectedUsers.size > 1 ? '' : ''}`
      )
      setShowDeleteModal(false)
      setSelectedUsers(new Set([]))

      if (userIds.includes(selectedUser)) setSelectedUser(undefined)
    } catch (error: any) {
      toast.error(`删除选中的用户失败：${error.message}`)
    } finally {
      setIsDeletingUsers(false)
    }
  }

  useEffect(() => {
    if (
      !isRefetching &&
      (isSuccessStorage ||
        (isErrorStorage && (errorStorage as Error).message.includes('data is undefined')))
    ) {
      const columns = formatUserColumns({
        config: columnConfiguration ?? [],
        users: users ?? [],
        visibleColumns: selectedColumns,
        setSortByValue,
        onSelectDeleteUser: setSelectedUserToDelete,
      })
      setColumns(columns)
      if (columns.length < USERS_TABLE_COLUMNS.length) {
        setSelectedColumns(columns.filter((col) => col.key !== 'img').map((col) => col.key))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSuccess,
    isRefetching,
    isSuccessStorage,
    isErrorStorage,
    errorStorage,
    users,
    selectedUsers,
  ])

  return (
    <>
      <div className="h-full flex flex-col">
        <FormHeader className="py-4 px-6 !mb-0" title="用户" />
        <div className="bg-surface-200 py-3 px-4 md:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-t">
          {selectedUsers.size > 0 ? (
            <div className="flex items-center gap-x-2">
              <Button type="default" icon={<Trash />} onClick={() => setShowDeleteModal(true)}>
                删除 {selectedUsers.size} 个用户
              </Button>
              <ButtonTooltip
                type="default"
                icon={<X />}
                className="px-1.5"
                onClick={() => setSelectedUsers(new Set([]))}
                tooltip={{ content: { side: 'bottom', text: '取消选中' } }}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  size="tiny"
                  className="w-52 pl-7 bg-transparent"
                  iconContainerClassName="pl-2"
                  icon={<Search size={14} className="text-foreground-lighter" />}
                  placeholder="查找电子邮件、电话或 UID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.code === 'Enter') {
                      setSearch(search.trim())
                      setFilterKeywords(search.trim().toLocaleLowerCase())
                    }
                  }}
                  actions={[
                    search && (
                      <Button
                        size="tiny"
                        type="text"
                        icon={<X />}
                        onClick={() => clearSearch()}
                        className="p-0 h-5 w-5"
                      />
                    ),
                  ]}
                />

                {showUserTypeFilter && (
                  <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
                    <SelectTrigger_Shadcn_
                      size="tiny"
                      className={cn(
                        'w-[140px] !bg-transparent',
                        filter === 'all' && 'border-dashed'
                      )}
                    >
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_ value="all" className="text-xs">
                          所有用户
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="verified" className="text-xs">
                          已验证用户
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="unverified" className="text-xs">
                          未验证用户
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="anonymous" className="text-xs">
                          匿名用户
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                )}

                {showProviderFilter && (
                  <FilterPopover
                    name="认证方式"
                    options={PROVIDER_FILTER_OPTIONS}
                    labelKey="name"
                    valueKey="value"
                    iconKey="icon"
                    activeOptions={selectedProviders}
                    labelClass="text-xs"
                    maxHeightClass="h-[190px]"
                    className="w-52"
                    onSaveFilters={setSelectedProviders}
                  />
                )}

                <div className="border-r border-strong h-6" />

                <FilterPopover
                  name={selectedColumns.length === 0 ? '所有列' : '列'}
                  title="选择要显示的列"
                  buttonType={selectedColumns.length === 0 ? 'dashed' : 'default'}
                  options={USERS_TABLE_COLUMNS.slice(1)} // Ignore user image column
                  labelKey="name"
                  valueKey="id"
                  labelClass="text-xs"
                  maxHeightClass="h-[190px]"
                  clearButtonText="重置"
                  activeOptions={selectedColumns}
                  onSaveFilters={(value) => {
                    // When adding back hidden columns:
                    // (1) width set to default value if any
                    // (2) they will just get appended to the end
                    // (3) If "clearing", reset order of the columns to original

                    let updatedConfig = (columnConfiguration ?? []).slice()
                    if (value.length === 0) {
                      updatedConfig = USERS_TABLE_COLUMNS.map((c) => ({ id: c.id, width: c.width }))
                    } else {
                      value.forEach((col) => {
                        const hasExisting = updatedConfig.find((c) => c.id === col)
                        if (!hasExisting)
                          updatedConfig.push({
                            id: col,
                            width: USERS_TABLE_COLUMNS.find((c) => c.id === col)?.width,
                          })
                      })
                    }

                    const updatedColumns = formatUserColumns({
                      config: updatedConfig,
                      users: users ?? [],
                      visibleColumns: value,
                      setSortByValue,
                      onSelectDeleteUser: setSelectedUserToDelete,
                    })

                    setSelectedColumns(value)
                    setColumns(updatedColumns)
                    saveColumnConfiguration('toggle', { columns: updatedColumns })
                  }}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button icon={sortOrder === 'desc' ? <ArrowDown /> : <ArrowUp />}>
                      按 {sortColumn.replaceAll('_', ' ')} 排序
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44" align="start">
                    <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>按创建时间排序</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioItem value="created_at:asc">
                            升序
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="created_at:desc">
                            降序
                          </DropdownMenuRadioItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>按最后登录时间排序</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioItem value="last_sign_in_at:asc">
                            升序
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="last_sign_in_at:desc">
                            降序
                          </DropdownMenuRadioItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      {showSortByEmail && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>按邮箱排序</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioItem value="email:asc">
                              升序
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="email:desc">
                              降序
                            </DropdownMenuRadioItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      {showSortByPhone && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>按手机号排序</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioItem value="phone:asc">
                              升序
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="phone:desc">
                              降序
                            </DropdownMenuRadioItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-x-2">
                {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
                <Button
                  size="tiny"
                  icon={<RefreshCw />}
                  type="default"
                  loading={isRefetching && !isFetchingNextPage}
                  onClick={() => {
                    refetch()
                    refetchCount()
                  }}
                >
                  刷新
                </Button>
                <AddUserDropdown />
              </div>
            </>
          )}
        </div>
        <LoadingLine loading={isLoading || isRefetching || isFetchingNextPage} />
        <ResizablePanelGroup
          direction="horizontal"
          className="relative flex flex-grow bg-alternative min-h-0"
          autoSaveId="query-performance-layout-v1"
        >
          <ResizablePanel defaultSize={1}>
            <div className="flex flex-col w-full h-full">
              <DataGrid
                ref={gridRef}
                className="flex-grow border-t-0"
                rowHeight={44}
                headerRowHeight={36}
                columns={columns}
                rows={formatUsersData(users ?? [])}
                rowClass={(row) => {
                  const isSelected = row.id === selectedUser
                  return [
                    `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                    '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                    '[&>.rdg-cell:first-child>div]:ml-4',
                  ].join(' ')
                }}
                rowKeyGetter={(row) => row.id}
                selectedRows={selectedUsers}
                onScroll={handleScroll}
                onSelectedRowsChange={(rows) => {
                  if (rows.size > MAX_BULK_DELETE) {
                    toast(`Only up to ${MAX_BULK_DELETE} users can be selected at a time`)
                  } else setSelectedUsers(rows)
                }}
                onColumnResize={(idx, width) => saveColumnConfiguration('resize', { idx, width })}
                onColumnsReorder={(source, target) => {
                  const sourceIdx = columns.findIndex((col) => col.key === source)
                  const targetIdx = columns.findIndex((col) => col.key === target)

                  const updatedColumns = swapColumns(columns, sourceIdx, targetIdx)
                  setColumns(updatedColumns)

                  saveColumnConfiguration('reorder', { columns: updatedColumns })
                }}
                renderers={{
                  renderRow(id, props) {
                    return (
                      <Row
                        {...props}
                        onClick={() => {
                          const user = users.find((u) => u.id === id)
                          if (user) {
                            const idx = users.indexOf(user)
                            if (props.row.id) {
                              setSelectedUser(props.row.id)
                              gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                            }
                          }
                        }}
                      />
                    )
                  },
                  noRowsFallback: isLoading ? (
                    <div className="absolute top-14 px-6 w-full">
                      <GenericSkeletonLoader />
                    </div>
                  ) : isError ? (
                    <div className="absolute top-14 px-6 flex flex-col items-center justify-center w-full">
                      <AlertError subject="Failed to retrieve users" error={error} />
                    </div>
                  ) : (
                    <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                      <Users className="text-foreground-lighter" strokeWidth={1} />
                      <div className="text-center">
                        <p className="text-foreground">
                          {filter !== 'all' || filterKeywords.length > 0
                            ? '未找到用户'
                            : '项目中没有用户'}
                        </p>
                        <p className="text-foreground-light">
                          {filter !== 'all' || filterKeywords.length > 0
                            ? '当前没有符合筛选条件的用户'
                            : '当前没有用户注册到项目中'}
                        </p>
                      </div>
                    </div>
                  ),
                }}
              />
            </div>
          </ResizablePanel>
          {selectedUser !== undefined && (
            <UserPanel
              selectedUser={users.find((u) => u.id === selectedUser)}
              onClose={() => setSelectedUser(undefined)}
            />
          )}
        </ResizablePanelGroup>

        <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
          {isLoading || isRefetching ? '正在加载用户...' : `合计：${totalUsers} 位用户`}
          {(isLoading || isRefetching || isFetchingNextPage) && (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> 正在加载中...
            </span>
          )}
        </div>
      </div>

      <ConfirmationModal
        visible={showDeleteModal}
        variant="destructive"
        title={`确认删除 ${selectedUsers.size} 个用户${selectedUsers.size > 1 ? '' : ''}`}
        loading={isDeletingUsers}
        confirmLabel="删除"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => handleDeleteUsers()}
        alert={{
          title: `删除${selectedUsers.size === 1 ? '用户' : '用户'}操作不可撤销`,
          description: `此操作将从项目中删除选中的${selectedUsers.size === 1 ? '' : ` ${selectedUsers.size} 个`}用户${selectedUsers.size > 1 ? '' : ''}以及与之相关的所有数据。`,
        }}
      >
        <p className="text-sm text-foreground-light">
          此操作是永久的！您确定想要删除{' '}
          {selectedUsers.size === 1 ? '' : `选中的 ${selectedUsers.size} 个`}用户
          {selectedUsers.size > 1 ? '' : ''}
          {selectedUsers.size === 1 ? (
            <span className="text-foreground">
              {' '}
              {selectedUserFromCheckbox?.email ?? selectedUserFromCheckbox?.phone ?? '此用户'}
            </span>
          ) : null}
          吗？
        </p>
      </ConfirmationModal>

      {/* [Joshen] For deleting via context menu, the dialog above is dependent on the selectedUsers state */}
      <DeleteUserModal
        visible={!!selectedUserToDelete}
        selectedUser={selectedUserToDelete}
        onClose={() => setSelectedUserToDelete(undefined)}
        onDeleteSuccess={() => {
          if (selectedUserToDelete?.id === selectedUser) setSelectedUser(undefined)
          setSelectedUserToDelete(undefined)
        }}
      />
    </>
  )
}
