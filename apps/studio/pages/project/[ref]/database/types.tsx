import { ExternalLink } from 'lucide-react'

import { EnumeratedTypes } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { DocsButton } from 'components/ui/DocsButton'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent className="!col-span-12">
          <FormHeader
            className="!mb-0"
            title="数据库枚举类型"
            description="您可以在数据库表或函数中使用的自定义数据类型。"
          />
        </ScaffoldSectionContent>
        <div className="col-span-12 mt-3">
          <EnumeratedTypes />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseEnumeratedTypes.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseEnumeratedTypes
