import { noop } from 'lodash'
import { PropsWithChildren, useState } from 'react'
import { Button } from 'ui'

interface ActionBarProps {
  loading?: boolean
  disableApply?: boolean
  hideApply?: boolean
  applyButtonLabel?: string
  backButtonLabel?: string
  applyFunction?: (resolve: any) => void
  closePanel: () => void
  formId?: string
}

const ActionBar = ({
  loading = false,
  disableApply = false,
  hideApply = false,
  children = undefined,
  applyButtonLabel = '应用',
  backButtonLabel = '返回',
  applyFunction = undefined,
  closePanel = noop,
  formId,
}: PropsWithChildren<ActionBarProps>) => {
  const [isRunning, setIsRunning] = useState(false)

  // @ts-ignore
  const applyCallback = () => new Promise((resolve) => applyFunction(resolve))

  const onSelectApply = async () => {
    setIsRunning(true)
    await applyCallback()
    setIsRunning(false)
  }

  return (
    <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
      <Button type="default" htmlType="button" onClick={closePanel} disabled={isRunning || loading}>
        {backButtonLabel}
      </Button>

      {children}

      {applyFunction !== undefined ? (
        // Old solution, necessary when loading is handled by this component itself
        <Button
          onClick={onSelectApply}
          disabled={disableApply || isRunning || loading}
          loading={isRunning || loading}
        >
          {applyButtonLabel}
        </Button>
      ) : !hideApply ? (
        // New solution, when using the Form component, loading is handled by the Form itself
        // Does not require applyFunction() callback
        <Button
          disabled={loading || disableApply}
          loading={loading}
          data-testid="action-bar-save-row"
          htmlType="submit"
          form={formId}
        >
          {applyButtonLabel}
        </Button>
      ) : (
        <div />
      )}
    </div>
  )
}
export default ActionBar
