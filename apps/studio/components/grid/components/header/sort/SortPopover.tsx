import update from 'immutability-helper'
import { isEqual } from 'lodash'
import { ChevronDown, List } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { DropdownControl } from 'components/grid/components/common/DropdownControl'
import type { Sort } from 'components/grid/types'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import SortRow from './SortRow'

export interface SortPopoverProps {
  sorts: string[]
  portal?: boolean
  onApplySorts: (sorts: Sort[]) => void
}

const SortPopover = ({ sorts, portal = true, onApplySorts }: SortPopoverProps) => {
  const [open, setOpen] = useState(false)

  const btnText =
    (sorts || []).length > 0
      ? `已按${sorts.length}条规则排序`
      : '排序'

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={(sorts || []).length > 0 ? 'link' : 'text'} icon={<List />}>
          {btnText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        <SortOverlay sorts={sorts} onApplySorts={onApplySorts} />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default SortPopover

export interface SortOverlayProps {
  sorts: string[]
  onApplySorts: (sorts: Sort[]) => void
}

const SortOverlay = ({ sorts: sortsFromUrl, onApplySorts }: SortOverlayProps) => {
  const snap = useTableEditorTableStateSnapshot()

  const initialSorts = useMemo(
    () => formatSortURLParams(snap.table.name, sortsFromUrl ?? []),
    [snap.table.name, sortsFromUrl]
  )
  const [sorts, setSorts] = useState<Sort[]>(initialSorts)

  const columns = snap.table.columns.filter((x) => {
    // exclude json/jsonb columns from sorting. Sorting by json fields in PG is only possible if you provide key from
    // the JSON object.
    if (x.dataType === 'json' || x.dataType === 'jsonb') {
      return false
    }
    const found = sorts.find((y) => y.column == x.name)
    return !found
  })

  const dropdownOptions =
    columns?.map((x) => {
      return { value: x.name, label: x.name }
    }) || []

  function onAddSort(columnName: string | number) {
    setSorts([...sorts, { table: snap.table.name, column: columnName as string, ascending: true }])
  }

  const onDeleteSort = useCallback((column: string) => {
    setSorts((currentSorts) => currentSorts.filter((sort) => sort.column !== column))
  }, [])

  const onToggleSort = useCallback((column: string, ascending: boolean) => {
    setSorts((currentSorts) => {
      const idx = currentSorts.findIndex((x) => x.column === column)

      return update(currentSorts, {
        [idx]: {
          $merge: { ascending },
        },
      })
    })
  }, [])

  const onDragSort = useCallback((dragIndex: number, hoverIndex: number) => {
    setSorts((currentSort) =>
      update(currentSort, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, currentSort[dragIndex]],
        ],
      })
    )
  }, [])

  return (
    <div className="space-y-2 py-2">
      {sorts.map((sort, index) => (
        <SortRow
          key={sort.column}
          index={index}
          columnName={sort.column}
          sort={sort}
          onDelete={onDeleteSort}
          onToggle={onToggleSort}
          onDrag={onDragSort}
        />
      ))}
      {sorts.length === 0 && (
        <div className="space-y-1 px-3">
          <h5 className="text-sm text-foreground-light">此视图未应用任何排序规则</h5>
          <p className="text-xs text-foreground-lighter">在下方添加一列，对视图进行排序</p>
        </div>
      )}

      <PopoverSeparator_Shadcn_ />
      <div className="px-3 flex flex-row justify-between">
        {columns && columns.length > 0 ? (
          <DropdownControl
            options={dropdownOptions}
            onSelect={onAddSort}
            side="bottom"
            align="start"
          >
            <Button
              asChild
              type="text"
              iconRight={<ChevronDown size="14" className="text-foreground-light" />}
              className="sb-grid-dropdown__item-trigger"
              data-testid="table-editor-pick-column-to-sort-button"
            >
              <span>选择{sorts.length > 1 ? '另一列' : '一列'}对视图进行排序</span>
            </Button>
          </DropdownControl>
        ) : (
          <p className="text-sm text-foreground-light">所有列都已添加</p>
        )}
        <div className="flex items-center">
          <Button
            disabled={isEqual(sorts, initialSorts)}
            type="default"
            onClick={() => onApplySorts(sorts)}
          >
            应用排序规则
          </Button>
        </div>
      </div>
    </div>
  )
}
