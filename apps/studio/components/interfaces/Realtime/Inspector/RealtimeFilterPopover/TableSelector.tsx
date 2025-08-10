import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { debounce } from 'lodash'
import { Check, Code, Loader } from 'lucide-react'

interface TableSelectorProps {
  className?: string
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedSchemaName: string
  selectedTableName: string
  onSelectTable: (name: string, id: number | undefined) => void
}

const TableSelector = ({
  className,
  size = 'tiny',
  showError = true,
  selectedSchemaName,
  selectedTableName,
  onSelectTable,
}: TableSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [initiallyLoaded, setInitiallyLoaded] = useState(false)
  const { data: project } = useSelectedProjectQuery()
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isSuccess, isError, error, refetch } = useEntityTypesQuery({
    projectRef: project?.ref,
    search: searchInput,
    connectionString: project?.connectionString,
    schemas: [selectedSchemaName],
  })
  useEffect(() => {
    if (!initiallyLoaded && isSuccess) {
      setInitiallyLoaded(true)
    }
  }, [initiallyLoaded, isSuccess])

  useEffect(() => {
    if (!open && searchInput !== '') {
      setSearchInput('')
    }
  }, [open, searchInput])

  const searchTables = debounce(setSearchInput)

  const entities = (data?.pages[0].data.entities ? [...data?.pages[0].data.entities] : []).sort(
    (a, b) => (a.name > b.name ? 0 : -1)
  )

  return (
    <div className={className}>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            size={size}
            type="outline"
            disabled={isLoading}
            className={`w-full [&>span]:w-full ${size === 'small' ? 'py-1.5' : ''}`}
            icon={isLoading ? <Loader className="animate-spin" size={12} /> : null}
            iconRight={
              <Code className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
            }
          >
            {initiallyLoaded ? (
              <div className="w-full flex space-x-3">
                <p className="text-xs text-light">表</p>
                <p className="text-xs">
                  {selectedTableName === '*' ? '所有表' : selectedTableName}
                </p>
              </div>
            ) : (
              <p className="flex text-xs text-light">正在加载表...</p>
            )}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_
              placeholder="查找表..."
              onValueChange={(str) => searchTables(str)}
            />
            <CommandList_Shadcn_>
              {isLoading && (
                <div className="flex items-center justify-center space-x-2 px-3 py-2">
                  <Loader className="animate-spin" size={12} />
                  <p className="flex text-xs text-light">正在加载表...</p>
                </div>
              )}

              {showError && isError && (
                <Alert_Shadcn_ variant="warning" className="!px-3 !py-3 !border-0 rounded-none">
                  <AlertTitle_Shadcn_ className="text-xs text-amber-900">
                    加载表失败
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="text-xs mb-2">
                    错误: {(error as any)?.message}
                  </AlertDescription_Shadcn_>
                  <Button type="default" size="tiny" onClick={() => refetch()}>
                    重新加载表
                  </Button>
                </Alert_Shadcn_>
              )}

              {isSuccess && (
                <>
                  <CommandGroup_Shadcn_ forceMount>
                    <ScrollArea className={(entities || []).length > 7 ? 'h-[210px]' : ''}>
                      {entities?.length === 0 && (
                        <CommandEmpty_Shadcn_>未找到表</CommandEmpty_Shadcn_>
                      )}
                      {!searchInput && (
                        <CommandItem_Shadcn_
                          key="all-tables"
                          className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                          onSelect={() => {
                            onSelectTable('*', undefined)
                            setOpen(false)
                          }}
                          onClick={() => {
                            onSelectTable('*', undefined)
                            setOpen(false)
                          }}
                        >
                          <span>所有表</span>
                          {selectedSchemaName === '*' && (
                            <Check className="text-brand" strokeWidth={2} />
                          )}
                        </CommandItem_Shadcn_>
                      )}
                      {entities?.map((table) => (
                        <CommandItem_Shadcn_
                          key={table.id}
                          className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                          onSelect={() => {
                            onSelectTable(table.name, table.id)
                            setOpen(false)
                          }}
                          onClick={() => {
                            onSelectTable(table.name, table.id)
                            setOpen(false)
                          }}
                        >
                          <span>
                            {table.name}
                            <span className="block w-60 text-muted font-normal truncate">{table.comment}</span>
                          </span>
                          {selectedSchemaName === table.name && (
                            <Check className="text-brand" strokeWidth={2} />
                          )}
                        </CommandItem_Shadcn_>
                      ))}
                    </ScrollArea>
                  </CommandGroup_Shadcn_>
                </>
              )}
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default TableSelector
