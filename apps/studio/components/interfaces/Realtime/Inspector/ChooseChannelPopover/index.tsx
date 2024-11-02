import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Switch,
} from 'ui'
import { RealtimeConfig } from '../useRealtimeMessages'
import { DocsButton } from 'components/ui/DocsButton'

interface ChooseChannelPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

const FormSchema = z.object({ channel: z.string(), isPrivate: z.boolean() })

export const ChooseChannelPopover = ({ config, onChangeConfig }: ChooseChannelPopoverProps) => {
  const [open, setOpen] = useState(false)

  const { mutate: sendEvent } = useSendEventMutation()

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { channel: '', isPrivate: false },
  })

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      form.setValue('channel', config.channelName)
    }
    setOpen(v)
  }

  const onSubmit = () => {
    setOpen(false)
    sendEvent({
      category: 'realtime_inspector',
      action: 'started_listening_to_channel_in_input_channel_popover',
      label: 'realtime_inspector_config',
    })
    onChangeConfig({
      ...config,
      channelName: form.getValues('channel'),
      isChannelPrivate: form.getValues('isPrivate'),
      enabled: true,
    })
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={onOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button className="rounded-r-none" type="default" size="tiny" iconRight={<ChevronDown />}>
          <p
            className="max-w-[120px] truncate"
            title={config.channelName.length > 0 ? config.channelName : ''}
          >
            {config.channelName.length > 0 ? `频道：${config.channelName}` : '加入频道'}
          </p>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-[320px]" align="start">
        <div className="p-4 flex flex-col text-sm">
          {config.channelName.length === 0 ? (
            <>
              <Form_Shadcn_ {...form}>
                <form
                  id="realtime-channel"
                  onSubmit={form.handleSubmit(() => onSubmit())}
                  className="flex flex-col gap-y-4"
                >
                  <FormField_Shadcn_
                    name="channel"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <div className="flex flex-col gap-y-1">
                          <label className="text-foreground text-xs">频道名</label>
                          <div className="flex flex-row">
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                autoComplete="off"
                                className="rounded-r-none text-xs px-2.5 py-1 h-auto"
                                placeholder="输入频道名称"
                              />
                            </FormControl_Shadcn_>

                            <Button
                              type="primary"
                              className="rounded-l-none"
                              disabled={form.getValues().channel.length === 0}
                              onClick={() => onSubmit()}
                            >
                              监听频道
                            </Button>
                          </div>
                        </div>
                        <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                          通过 Supabase Realtime 客户端初始化的频道。到
                          <a
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-foreground transition"
                            href="https://supabase.com/docs/guides/realtime/concepts#channels"
                          >
                            文档
                          </a>
                          了解更多
                        </FormDescription_Shadcn_>
                      </FormItem_Shadcn_>
                    )}
                  />

                  <FormField_Shadcn_
                    key="isPrivate"
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="">
                        <div className="flex flex-row items-center gap-x-2">
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={field.disabled}
                            />
                          </FormControl_Shadcn_>
                          <FormLabel_Shadcn_ className="text-xs">
                            私有频道？
                          </FormLabel_Shadcn_>
                        </div>
                        <FormDescription_Shadcn_ className="text-xs text-foreground-lighter mt-2">
                          如果频道被标记为私有，将使用 RLS 策略过滤消息。
                        </FormDescription_Shadcn_>
                      </FormItem_Shadcn_>
                    )}
                  />

                  <DocsButton
                    abbrev={false}
                    className="w-min"
                    href="https://supabase.com/docs/guides/realtime/authorization"
                  />
                </form>
              </Form_Shadcn_>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-x-2">
                <p className="text-foreground text-xs">
                  Currently joined{' '}
                  <span className={config.isChannelPrivate ? 'text-brand' : 'text-warning'}>
                    {config.isChannelPrivate ? 'private' : 'public'}
                  </span>{' '}
                  channel:
                </p>
                <p className="text-xs border border-scale-600  py-0.5 px-1 rounded-md bg-surface-200">
                  {config.channelName}
                </p>
              </div>
              <p className="text-xs text-foreground-lighter mt-2">
                如果您离开频道，当前页面上弹出的所有消息都将消失
              </p>
              <Button
                type="default"
                onClick={() => onChangeConfig({ ...config, channelName: '', enabled: false })}
              >
                离开频道
              </Button>
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
