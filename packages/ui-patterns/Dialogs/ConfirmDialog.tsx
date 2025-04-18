'use client'

import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'ui'

// [Joshen] As of 280222, let's just use ConfirmationModal as the one and only confirmation modal (Deprecate this)

interface ConfirmModalProps {
  visible: boolean
  danger?: boolean
  title: string
  description: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  buttonLabel: string
  buttonLoadingLabel?: string
  onSelectCancel: () => void
  onSelectConfirm: () => void
}

/** @deprecated use ConfirmationModal instead */
const ConfirmModal = ({
  visible = false,
  danger = false,
  title = '',
  description = '',
  size = 'small',
  buttonLabel = '',
  buttonLoadingLabel = '',
  onSelectCancel = () => {},
  onSelectConfirm = () => {},
}: ConfirmModalProps) => {
  useEffect(() => {
    if (visible) {
      setLoading(false)
    }
  }, [visible])

  const [loading, setLoading] = useState(false)

  const onConfirm = () => {
    setLoading(true)
    onSelectConfirm()
  }

  return (
    <Modal
      header={title}
      visible={visible}
      title={title}
      description={description}
      size={size}
      hideFooter
      onCancel={onSelectCancel}
    >
      <Form
        initialValues={{}}
        validateOnBlur
        onSubmit={() => onConfirm()}
        validate={() => {
          return []
        }}
      >
        {() => {
          return (
            <>
              <Modal.Content>
                <div className="flex items-center gap-2">
                  <Button
                    block
                    htmlType="button"
                    type="default"
                    onClick={onSelectCancel}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button
                    htmlType="submit"
                    block
                    type={danger ? 'danger' : 'primary'}
                    disabled={loading}
                    loading={loading}
                  >
                    {buttonLoadingLabel && loading
                      ? buttonLoadingLabel
                      : buttonLabel
                        ? buttonLabel
                        : '确定'}
                  </Button>
                </div>
              </Modal.Content>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default ConfirmModal
