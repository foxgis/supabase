import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import toast from 'react-hot-toast'

import { useUserCreateMutation } from 'data/auth/user-create-mutation'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, Checkbox, Form, IconLock, IconMail, Input, Loading, Modal } from 'ui'

export type CreateUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const CreateUserModal = ({ visible, setVisible }: CreateUserModalProps) => {
  const { ref: projectRef } = useParams()

  const { data, isLoading, isSuccess } = useProjectApiQuery({ projectRef }, { enabled: visible })

  const handleToggle = () => setVisible(!visible)
  const canCreateUsers = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'create_user')

  const validate = (values: any) => {
    const errors: any = {}
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    if (values.email.length === 0) {
      errors.email = '请输入有效的电子邮件'
    } else if (!emailValidateRegex.test(values.email)) {
      errors.email = `${values.email} 不是一个有效的电子邮件`
    }

    if (!values.password?.trim()) {
      errors.password = '请输入密码'
    }

    return errors
  }

  const { mutate: createUser, isLoading: isCreatingUser } = useUserCreateMutation({
    async onSuccess(res) {
      toast.success(`成功创建了用户：${res.email}`)
      setVisible(false)
    },
  })

  const onCreateUser = async (values: any) => {
    if (!isSuccess) {
      return toast.error(`创建用户失败：加载项目配置失败`)
    }
    const { protocol, endpoint, serviceApiKey } = data.autoApiService
    createUser({ projectRef, endpoint, protocol, serviceApiKey, user: values })
  }

  return (
    <Modal
      hideFooter
      size="small"
      key="create-user-modal"
      visible={visible}
      header="创建新用户"
      onCancel={handleToggle}
      loading={true}
    >
      <Form
        validateOnBlur={false}
        initialValues={{ email: '', password: '', autoConfirmUser: true }}
        validate={validate}
        onSubmit={onCreateUser}
      >
        {() => (
          <Loading active={isLoading}>
            <Modal.Content className="space-y-4">
              <Input
                id="email"
                autoComplete="off"
                label="用户的电子邮件"
                icon={<IconMail />}
                type="email"
                name="email"
                placeholder="user@example.com"
                disabled={isCreatingUser || isLoading}
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="用户密码"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                icon={<IconLock />}
                disabled={isCreatingUser || isLoading}
                autoComplete="new-password"
              />

              <Checkbox
                value="true"
                id="autoConfirmUser"
                name="autoConfirmUser"
                label="自动确认用户？"
                size="medium"
                disabled={isCreatingUser || isLoading}
              />
              <p className="text-sm text-foreground-lighter">
                通过此表单创建用户时，不会发送确认电子邮件。
              </p>
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <Button
                block
                size="small"
                htmlType="submit"
                loading={isCreatingUser}
                disabled={!canCreateUsers || isCreatingUser || isLoading}
              >
                创建用户
              </Button>
            </Modal.Content>
          </Loading>
        )}
      </Form>
    </Modal>
  )
}

export default CreateUserModal
