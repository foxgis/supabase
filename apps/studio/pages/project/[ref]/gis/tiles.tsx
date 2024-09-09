import { useEffect, useState } from 'react'

import GISLayout from 'components/layouts/GISLayout/GISLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { TilesList } from 'components/interfaces/GIS'
import type { NextPageWithLayout } from 'types'

const TilesPage: NextPageWithLayout = () => {

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader title="瓦片服务" />
          <TilesList />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

TilesPage.getLayout = (page) => <GISLayout title="瓦片服务">{page}</GISLayout>

export default TilesPage
