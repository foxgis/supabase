import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useUserCreateMutation } from 'data/auth/user-create-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'

export type CreateUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const CreateUserFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
  autoConfirmUser: z.boolean(),
})

const CreateUserModal = ({ visible, setVisible }: CreateUserModalProps) => {
  const { ref: projectRef } = useParams()
  const { can: canCreateUsers } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'create_user'
  )

  const { mutate: createUser, isLoading: isCreatingUser } = useUserCreateMutation({
    onSuccess(res) {
      toast.success(`成功创建了用户：${res.email}`)
      form.reset({ email: '', password: '', autoConfirmUser: true })
      setVisible(false)
    },
  })

  const onCreateUser = async (values: any) => {
    if (!projectRef) return console.error('未找到项目号')

    createUser({ projectRef, user: values })
  }

  const form = useForm<z.infer<typeof CreateUserFormSchema>>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { email: '', password: '', autoConfirmUser: true },
  })

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>创建新用户</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form
            id="create-user"
            className="flex flex-col gap-y-4 p-6"
            onSubmit={form.handleSubmit(onCreateUser)}
          >
            <FormField_Shadcn_
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>电子邮件地址</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="items-center relative">
                      <Mail
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        type="email"
                        name="email"
                        placeholder="user@example.com"
                        disabled={isCreatingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>密码</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="items-center relative">
                      <Lock
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        {...field}
                        autoComplete="new-password"
                        type="password"
                        name="password"
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        disabled={isCreatingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              name="autoConfirmUser"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex items-center gap-x-2">
                  <FormControl_Shadcn_>
                    <Checkbox_Shadcn_
                      checked={field.value}
                      onCheckedChange={(value) => field.onChange(value)}
                    />
                  </FormControl_Shadcn_>
                  <FormLabel_Shadcn_>自动确认用户？</FormLabel_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />

            <FormLabel_Shadcn_>
              <p className="text-sm text-foreground-lighter">
                通过此表单创建用户时，不会发送确认电子邮件。
              </p>
            </FormLabel_Shadcn_>

            <Button
              block
              size="small"
              htmlType="submit"
              loading={isCreatingUser}
              disabled={!canCreateUsers || isCreatingUser}
            >
              创建用户
            </Button>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

export default CreateUserModal
