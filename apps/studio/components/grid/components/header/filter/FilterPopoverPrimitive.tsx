import { isEqual } from 'lodash'
import { Filter as FilterIcon, Plus } from 'lucide-react'
import { KeyboardEvent, useCallback, useMemo, useState } from 'react'

import type { Filter } from 'components/grid/types'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import FilterRow from './FilterRow'

export interface FilterPopoverPrimitiveProps {
  buttonText?: string
  filters: Filter[]
  onApplyFilters: (filters: Filter[]) => void
  portal?: boolean
}

export const FilterPopoverPrimitive = ({
  buttonText,
  filters,
  onApplyFilters,
  portal = true,
}: FilterPopoverPrimitiveProps) => {
  const [open, setOpen] = useState(false)
  const snap = useTableEditorTableStateSnapshot()

  // Internal state management
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  // Update local state when filters prop changes
  useMemo(() => {
    setLocalFilters(filters)
  }, [filters])

  const displayButtonText =
    buttonText ??
    (filters.length > 0
      ? `已按 ${filters.length} 个条件${filters.length > 1 ? '' : ''}过滤`
      : '过滤')

  const onAddFilter = () => {
    const column = snap.table.columns[0]?.name
    if (column) {
      setLocalFilters([
        ...localFilters,
        {
          column,
          operator: '=',
          value: '',
        },
      ])
    }
  }

  const onChangeFilter = useCallback((index: number, filter: Filter) => {
    setLocalFilters((currentFilters) => [
      ...currentFilters.slice(0, index),
      filter,
      ...currentFilters.slice(index + 1),
    ])
  }, [])

  const onDeleteFilter = useCallback((index: number) => {
    setLocalFilters((currentFilters) => [
      ...currentFilters.slice(0, index),
      ...currentFilters.slice(index + 1),
    ])
  }, [])

  const onSelectApplyFilters = () => {
    // [Joshen] Trim empty spaces in input for only UUID type columns
    const formattedFilters = localFilters.map((f) => {
      const column = snap.table.columns.find((c) => c.name === f.column)
      if (column?.format === 'uuid') return { ...f, value: f.value.trim() }
      else return f
    })
    setLocalFilters(formattedFilters)
    onApplyFilters(formattedFilters)
  }

  function handleEnterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') onSelectApplyFilters()
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={filters.length > 0 ? 'link' : 'text'} icon={<FilterIcon />}>
          {displayButtonText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        <div className="space-y-2 py-2">
          <div className="space-y-2">
            {localFilters.map((filter, index) => (
              <FilterRow
                key={`filter-${filter.column}-${[index]}`}
                filter={filter}
                filterIdx={index}
                onChange={onChangeFilter}
                onDelete={onDeleteFilter}
                onKeyDown={handleEnterKeyDown}
              />
            ))}
            {localFilters.length == 0 && (
              <div className="space-y-1 px-3">
                <h5 className="text-sm text-foreground-light">当前视图未应用任何过滤条件</h5>
                <p className="text-xs text-foreground-lighter">
                  在下方添加一栏过滤视图中的数据
                </p>
              </div>
            )}
          </div>
          <PopoverSeparator_Shadcn_ />
          <div className="px-3 flex flex-row justify-between">
            <Button icon={<Plus />} type="text" onClick={onAddFilter}>
              添加过滤条件
            </Button>
            <Button
              disabled={isEqual(localFilters, filters)}
              type="default"
              onClick={() => onSelectApplyFilters()}
            >
              应用过滤条件
            </Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
