import { useEffect, useState } from 'react'

import GISLayout from 'components/layouts/GISLayout/GISLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const MapsPage: NextPageWithLayout = () => {

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader title="地图服务" />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

MapsPage.getLayout = (page) => <GISLayout title="地图服务">{page}</GISLayout>

export default MapsPage
