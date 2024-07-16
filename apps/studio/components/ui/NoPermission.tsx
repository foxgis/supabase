import { IconAlertCircle } from 'ui'

interface NoPermissionProps {
  resourceText: string
  isFullPage?: boolean
}

const NoPermission = ({ resourceText, isFullPage = false }: NoPermissionProps) => {
  const NoPermissionMessage = () => (
    <div
      className={[
        'block w-full rounded border border-opacity-20 py-4 px-6',
        'border-overlay bg-surface-200',
      ].join(' ')}
    >
      <div className="flex space-x-3">
        <div className="mt-1">
          <IconAlertCircle size="large" />
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">您需要额外的权限才能 {resourceText}</p>
            <div>
              <p className="text-sm text-foreground-light">
                请联系您的组织所有者或管理员寻求帮助。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isFullPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-[550px]">
          <NoPermissionMessage />
        </div>
      </div>
    )
  } else {
    return <NoPermissionMessage />
  }
}

export default NoPermission
