import { ExternalLink } from 'lucide-react'

import { useParams } from 'common'
import { DeployEdgeFunctionButton } from 'components/interfaces/EdgeFunctions/DeployEdgeFunctionButton'
import { EdgeFunctionsListItem } from 'components/interfaces/Functions/EdgeFunctionsListItem'
import {
  FunctionsEmptyState,
  FunctionsEmptyStateLocal,
} from 'components/interfaces/Functions/FunctionsEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button, Table, TableHead, TableRow, TableHeader, TableBody, Card } from 'ui'

const EdgeFunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })

  const hasFunctions = (functions ?? []).length > 0

  const secondaryActions = [
    <DocsButton key="docs" href="https://supabase.com/docs/guides/functions" />,
    <Button asChild key="edge-function-examples" type="default" icon={<ExternalLink />}>
      <a
        target="_blank"
        rel="noreferrer"
        href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
      >
        示例
      </a>
    </Button>,
  ]

  return (
    <PageLayout
      size="large"
      title="云函数"
      subtitle="部署云函数处理复杂的业务逻辑"
      primaryActions={IS_PLATFORM ? <DeployEdgeFunctionButton /> : undefined}
      secondaryActions={secondaryActions}
    >
      <ScaffoldContainer size="large">
        <ScaffoldSection isFullWidth>
          {IS_PLATFORM ? (
            <>
              {isLoading && <GenericSkeletonLoader />}
              {isError && <AlertError error={error} subject="获取云函数失败" />}
              {isSuccess && (
                <>
                  {hasFunctions ? (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>名称</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="hidden 2xl:table-cell">创建时间</TableHead>
                            <TableHead className="lg:table-cell">更新时间</TableHead>
                            <TableHead className="lg:table-cell">部署次数</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          <>
                            {functions.length > 0 &&
                              functions.map((item) => (
                                <EdgeFunctionsListItem key={item.id} function={item} />
                              ))}
                          </>
                        </TableBody>
                      </Table>
                    </Card>
                  ) : (
                    <FunctionsEmptyState />
                  )}
                </>
              )}
            </>
          ) : (
            <FunctionsEmptyStateLocal />
          )}
        </ScaffoldSection>
      </ScaffoldContainer>
    </PageLayout>
  )
}

EdgeFunctionsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>{page}</EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default EdgeFunctionsPage
