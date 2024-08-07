import { useParams } from 'common'
import { GridFooter } from 'components/ui/GridFooter'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import useEntityType from 'hooks/misc/useEntityType'
import useTable from 'hooks/misc/useTable'
import { useUrlState } from 'hooks/ui/useUrlState'
import RefreshButton from '../header/RefreshButton'
import { Pagination } from './pagination'

export interface FooterProps {
  isRefetching?: boolean
}

const Footer = ({ isRefetching }: FooterProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: selectedTable } = useTable(id)
  const entityType = useEntityType(selectedTable?.id)

  const [{ view: selectedView = '数据' }, setUrlState] = useUrlState()

  const setSelectedView = (view: string) => {
    if (view === '数据') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  const isViewSelected =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
  const isTableSelected = entityType?.type === ENTITY_TYPE.TABLE

  return (
    <GridFooter>
      {selectedView === '数据' && <Pagination />}

      <div className="ml-auto flex items-center gap-x-2">
        {selectedTable && selectedView === '数据' && (
          <RefreshButton table={selectedTable} isRefetching={isRefetching} />
        )}

        {(isViewSelected || isTableSelected) && (
          <TwoOptionToggle
            width={75}
            options={['定义', '数据']}
            activeOption={selectedView}
            borderOverride="border"
            onClickOption={setSelectedView}
          />
        )}
      </div>
    </GridFooter>
  )
}

export default Footer
