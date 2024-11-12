import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { ArrowDown, ArrowUp, Loader2, RefreshCw, Search, Users, X } from 'lucide-react'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
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
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import AddUserDropdown from './AddUserDropdown'
import { UserPanel } from './UserPanel'
import { PROVIDER_FILTER_OPTIONS } from './Users.constants'
import { formatUserColumns, formatUsersData, isAtBottom } from './Users.utils'

type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'
export type UsersTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}
export type ColumnConfiguration = { id: string; width?: number }
export const USERS_TABLE_COLUMNS: UsersTableColumn[] = [
  { id: 'img', name: '', minWidth: 65, width: 65, resizable: false },
  { id: 'id', name: 'UID', width: 280 },
  { id: 'name', name: '名称', minWidth: 0, width: 150 },
  { id: 'email', name: '电子邮箱', width: 300 },
  { id: 'phone', name: '电话' },
  { id: 'providers', name: '认证方式', minWidth: 150 },
  { id: 'provider_type', name: '认证类型', minWidth: 150 },
  { id: 'created_at', name: '创建时间', width: 260 },
  { id: 'last_sign_in_at', name: '最近登录时间', width: 260 },
]

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const gridRef = useRef<DataGridHandle>(null)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedRow, setSelectedRow] = useState<number>()
  const [sortByValue, setSortByValue] = useState<string>('created_at:desc')
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
    }
  )

  const { data: countData } = useUsersCountQuery({
    projectRef,
    connectionString: project?.connectionString,
    keywords: filterKeywords,
    filter: filter === 'all' ? undefined : filter,
    providers: selectedProviders,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalUsers = useMemo(() => countData?.result[0].count ?? 0, [countData?.result[0].count])
  const users = useMemo(() => data?.pages.flatMap((page) => page.result), [data?.pages])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (isLoading || !isAtBottom(event)) return
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
      })
      setColumns(columns)
      if (columns.length < USERS_TABLE_COLUMNS.length) {
        setSelectedColumns(columns.filter((col) => col.key !== 'img').map((col) => col.key))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isRefetching, isSuccessStorage, isErrorStorage, errorStorage])

  return (
    <div className="h-full flex flex-col">
      <FormHeader className="py-4 px-6 !mb-0" title="用户" />
      <div className="bg-surface-200 py-3 px-6 flex items-center justify-between border-t">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            className="w-52 pl-7 bg-transparent"
            iconContainerClassName="pl-2"
            icon={<Search size={14} className="text-foreground-lighter" />}
            placeholder="查找电子邮件、电话或者 UID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === 'Enter') {
                setSearch(search.trim())
                setFilterKeywords(search.trim())
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

          <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
            <SelectTrigger_Shadcn_
              size="tiny"
              className={cn('w-[140px] !bg-transparent', filter === 'all' && 'border-dashed')}
            >
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                <SelectItem_Shadcn_ value="all" className="text-xs">
                  所有用户
                </SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="verified" className="text-xs">
                  认证用户
                </SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="unverified" className="text-xs">
                  未认证用户
                </SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="anonymous" className="text-xs">
                  匿名用户
                </SelectItem_Shadcn_>
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>

          <FilterPopover
            name="认证方式"
            options={PROVIDER_FILTER_OPTIONS}
            labelKey="name"
            valueKey="value"
            iconKey="icon"
            activeOptions={selectedProviders}
            labelClass="text-xs"
            maxHeightClass="h-[190px]"
            onSaveFilters={setSelectedProviders}
          />

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
              })

              setSelectedColumns(value)
              setColumns(updatedColumns)
              saveColumnConfiguration('toggle', { columns: updatedColumns })
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={sortOrder === 'desc' ? <ArrowDown /> : <ArrowUp />}>
                按{USERS_TABLE_COLUMNS.find(c => c.id === sortColumn)?.name}排序
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>按创建时间排序</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="created_at:asc">升序</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_at:desc">
                      降序
                    </DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>按最近登录时间排序</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="last_sign_in_at:asc">
                      升序
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="last_sign_in_at:desc">
                      降序
                    </DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>按电子邮件排序</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="email:asc">升序</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="email:desc">降序</DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>按电话号码排序</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="phone:asc">升序</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="phone:desc">降序</DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
          <Button
            size="tiny"
            icon={<RefreshCw />}
            type="default"
            loading={isRefetching && !isFetchingNextPage}
            onClick={() => refetch()}
          >
            刷新
          </Button>
          <AddUserDropdown />
        </div>
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
              rowClass={(_, idx) => {
                const isSelected = idx === selectedRow
                return [
                  `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                  '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                  '[&>.rdg-cell:first-child>div]:ml-4',
                ].join(' ')
              }}
              onScroll={handleScroll}
              onColumnResize={(idx, width) => saveColumnConfiguration('resize', { idx, width })}
              onColumnsReorder={(source, target) => {
                const sourceIdx = columns.findIndex((col) => col.key === source)
                const targetIdx = columns.findIndex((col) => col.key === target)

                const updatedColumns = swapColumns(columns, sourceIdx, targetIdx)
                setColumns(updatedColumns)

                saveColumnConfiguration('reorder', { columns: updatedColumns })
              }}
              renderers={{
                renderRow(idx, props) {
                  return (
                    <Row
                      {...props}
                      key={props.row.id}
                      onClick={() => {
                        if (typeof idx === 'number' && idx >= 0) {
                          setSelectedRow(idx)
                          gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
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
                          : '本项目还没有用户'}
                      </p>
                      <p className="text-foreground-light">
                        {filter !== 'all' || filterKeywords.length > 0
                          ? '目前没有用户满足筛选条件'
                          : '本项目目前还没有注册用户'}
                      </p>
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        </ResizablePanel>
        {selectedRow !== undefined && (
          <UserPanel
            selectedUser={users?.[selectedRow]}
            onClose={() => setSelectedRow(undefined)}
          />
        )}
      </ResizablePanelGroup>

      <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
        {isLoading || isRefetching ? '正在加载用户...' : `总计：${totalUsers} 个用户`}
        {(isLoading || isRefetching || isFetchingNextPage) && (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />正在加载中...
          </span>
        )}
      </div>
    </div>
  )
}
