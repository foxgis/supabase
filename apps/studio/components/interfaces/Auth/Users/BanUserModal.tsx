import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useUserUpdateMutation } from 'data/auth/user-update-mutation'
import { User } from 'data/auth/users-infinite-query'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface BanUserModalProps {
  visible: boolean
  user: User
  onClose: () => void
}

const units = {
  days: '天',
  hours: '小时',
}

export const BanUserModal = ({ visible, user, onClose }: BanUserModalProps) => {
  const { ref: projectRef } = useParams()

  const { mutate: updateUser, isLoading: isBanningUser } = useUserUpdateMutation({
    onSuccess: (_, vars) => {
      const bannedUntil = dayjs()
        .add(Number(vars.banDuration), 'hours')
        .format('YYYY/MM/DD HH:mm (ZZ)')
      toast.success(`成功封禁用户到 ${bannedUntil}`)
      onClose()
    },
  })

  const FormSchema = z.object({
    value: z.string().min(1, { message: '请提供封禁时间' }),
    unit: z.enum(['hours', 'days']),
  })
  type FormType = z.infer<typeof FormSchema>
  const defaultValues: FormType = { value: '24', unit: 'hours' }
  const form = useForm<FormType>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { value, unit } = form.watch()
  const bannedUntil = dayjs().add(Number(value), unit).format('YYYY/MM/DD HH:mm (ZZ)')

  const onSubmit = (data: FormType) => {
    if (projectRef === undefined) return console.error('未找到项目号')
    if (user.id === undefined) {
      return toast.error(`封禁用户失败：未找到用户 ID`)
    }

    const durationHours = data.unit === 'hours' ? Number(data.value) : Number(data.value) * 24

    updateUser({
      projectRef,
      userId: user.id,
      banDuration: durationHours,
    })
  }

  useEffect(() => {
    if (visible) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="small"
      header="确认封禁用户"
      onCancel={() => onClose()}
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content className="flex flex-col gap-y-3">
            <p className="text-sm">
              本操作将在指定的时间内撤销用户对项目的访问权限以及禁止登录。
            </p>
            <div className="flex items-start gap-x-2 [&>div:first-child]:flex-grow">
              <FormField_Shadcn_
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItemLayout className="[&>div>div]:mt-0" label="设置封禁时间">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItemLayout className="[&>div>div]:mt-0 mt-[33px]">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        {...field}
                        value={field.value}
                        onValueChange={(value) => form.setValue('unit', value as 'hours' | 'days')}
                      >
                        <SelectTrigger_Shadcn_ className="capitalize w-24">
                          {units[field.value]}
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="hours">小时</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="days">天</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>

            <div>
              <p className="text-sm text-foreground-lighter">
                用户在此时间之前将无法登录：
              </p>
              <p className={cn('text-sm', !value && 'text-foreground-light')}>
                {!!value ? bannedUntil : '无效的封禁时间'}
              </p>
            </div>
          </Modal.Content>
          <Separator />
          <Modal.Content className="flex justify-end gap-2">
            <Button type="default" disabled={isBanningUser} onClick={() => onClose()}>
              取消
            </Button>
            <Button type="warning" htmlType="submit" loading={isBanningUser}>
              确认封禁
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
