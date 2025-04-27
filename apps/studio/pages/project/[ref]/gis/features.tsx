import { useEffect, useState } from 'react'

import DefaultLayout from 'components/layouts/DefaultLayout'
import GISLayout from 'components/layouts/GISLayout/GISLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { FeaturesList } from 'components/interfaces/GIS'

const FeaturesPage: NextPageWithLayout = () => {

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader title="要素服务" />
          <FeaturesList />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

FeaturesPage.getLayout = (page) => (
  <DefaultLayout>
    <GISLayout title="要素服务">{page}</GISLayout>
  </DefaultLayout>
)

export default FeaturesPage
