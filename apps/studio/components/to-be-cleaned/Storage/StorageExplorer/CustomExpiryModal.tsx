import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { Button, Form, Input, Listbox, Modal } from 'ui'

import { DATETIME_FORMAT } from 'lib/constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { useCopyUrl } from './useCopyUrl'

const unitMap = {
  days: 3600 * 24,
  weeks: 3600 * 24 * 7,
  months: 3600 * 24 * 30,
  years: 3600 * 24 * 365,
}

const CustomExpiryModal = () => {
  const storageExplorerStore = useStorageStore()
  const { onCopyUrl } = useCopyUrl()
  const { selectedFileCustomExpiry, setSelectedFileCustomExpiry } = storageExplorerStore

  const visible = selectedFileCustomExpiry !== undefined
  const onClose = () => setSelectedFileCustomExpiry(undefined)

  return (
    <Modal
      hideFooter
      size="small"
      header="自定义签名 URL 的过期时间"
      visible={visible}
      alignFooter="right"
      confirmText="获取 URL"
      onCancel={() => onClose()}
    >
      <Form
        validateOnBlur
        initialValues={{ expiresIn: '', units: '天' }}
        onSubmit={async (values: any, { setSubmitting }: any) => {
          setSubmitting(true)
          await onCopyUrl(
            selectedFileCustomExpiry!.name,
            values.expiresIn * unitMap[values.units as 'days' | 'weeks' | 'months' | 'years']
          )
          setSubmitting(false)
          onClose()
        }}
        validate={(values: any) => {
          const errors: any = {}
          if (values.expiresIn !== '' && values.expiresIn <= 0) {
            errors.expiresIn = '过期时间不能小于 0'
          }
          return errors
        }}
      >
        {({ values, isSubmitting }: { values: any; isSubmitting: boolean }) => (
          <>
            <Modal.Content>
              <p className="text-sm text-foreground-light mb-2">
                输入 URL 的有效时长：
              </p>
              <div className="flex items-center space-x-2">
                <Input disabled={isSubmitting} type="number" id="expiresIn" className="w-full" />
                <Listbox id="units" className="w-[150px]">
                  <Listbox.Option id="days" label="天" value="days">
                    天
                  </Listbox.Option>
                  <Listbox.Option id="weeks" label="周" value="weeks">
                    周
                  </Listbox.Option>
                  <Listbox.Option id="months" label="月" value="months">
                    月
                  </Listbox.Option>
                  <Listbox.Option id="years" label="年" value="years">
                    年
                  </Listbox.Option>
                </Listbox>
              </div>
              {values.expiresIn !== '' && (
                <p className="text-sm text-foreground-light mt-2">
                  URL 将在{' '}
                  {dayjs().add(values.expiresIn, values.units).format(DATETIME_FORMAT)} 过期
                </p>
              )}
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center justify-end space-x-2">
              <Button type="default" onClick={() => onClose()}>
                取消
              </Button>
              <Button
                disabled={values.expiresIn === '' || isSubmitting}
                loading={isSubmitting}
                htmlType="submit"
                type="primary"
              >
                获取签名 URL
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default observer(CustomExpiryModal)
