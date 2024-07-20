import Link from 'next/link'
import { Button } from 'ui'
import { CriticalIcon } from 'ui-patterns/Icons/StatusIcons'

import { useProjectContext } from './ProjectContext'

const PauseFailedState = () => {
  const { project } = useProjectContext()

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-surface-100 border border-overlay rounded-md w-3/4 lg:w-1/2">
        <div className="space-y-6 pt-6">
          <div className="flex px-8 space-x-8">
            <div className="mt-1">
              <CriticalIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p>项目暂停失败</p>
              <p className="text-sm text-foreground-light">
                您的项目数据完好无损，但是由于暂停失败导致项目暂时无法访问。请联系技术支持寻求帮助。
              </p>
            </div>
          </div>

          <div className="border-t border-overlay flex items-center justify-end py-4 px-8">
            <Button asChild type="default">
              <Link
                href={`/support/new?category=Database_unresponsive&ref=${project?.ref}&subject=Restoration%20failed%20for%20project`}
              >
                联系技术支持
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PauseFailedState
