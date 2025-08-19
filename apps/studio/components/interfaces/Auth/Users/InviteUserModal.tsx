import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useUserInviteMutation } from 'data/auth/user-invite-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, Form, Input, Modal } from 'ui'

export type InviteUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const InviteUserModal = ({ visible, setVisible }: InviteUserModalProps) => {
  const { ref: projectRef } = useParams()

  const handleToggle = () => setVisible(!visible)
  const { mutate: inviteUser, isLoading: isInviting } = useUserInviteMutation({
    onSuccess: (_, variables) => {
      toast.success(`向 ${variables.email} 发送确认邮件`)
      setVisible(false)
    },
  })
  const { can: canInviteUsers } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'invite_user'
  )

  const validate = (values: any) => {
    const errors: any = {}
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    if (values.email.length === 0) {
      errors.email = '请输入有效的电子邮件'
    } else if (!emailValidateRegex.test(values.email)) {
      errors.email = `${values.email} 不是有效的电子邮件`
    }

    return errors
  }

  const onInviteUser = async (values: any) => {
    if (!projectRef) return console.error('未找到项目号')
    inviteUser({ projectRef, email: values.email })
  }

  return (
    <Modal
      hideFooter
      size="small"
      key="invite-user-modal"
      visible={visible}
      header="邀请新用户"
      onCancel={handleToggle}
    >
      <Form
        validateOnBlur={false}
        initialValues={{ email: '' }}
        validate={validate}
        onSubmit={onInviteUser}
      >
        {() => (
          <>
            <Modal.Content>
              <Input
                id="email"
                className="w-full"
                label="电子邮件"
                icon={<Mail />}
                type="email"
                name="email"
                placeholder="电子邮件"
              />
            </Modal.Content>

            <Modal.Content>
              <Button
                block
                size="small"
                htmlType="submit"
                loading={isInviting}
                disabled={!canInviteUsers || isInviting}
              >
                邀请用户
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default InviteUserModal
