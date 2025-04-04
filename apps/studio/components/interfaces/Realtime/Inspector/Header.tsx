import * as Tooltip from '@radix-ui/react-tooltip'
import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TelemetryActions } from 'lib/constants/telemetry'
import { Button } from 'ui'
import { ChooseChannelPopover } from './ChooseChannelPopover'
import { RealtimeFilterPopover } from './RealtimeFilterPopover'
import { RealtimeTokensPopover } from './RealtimeTokensPopover'
import { RealtimeConfig } from './useRealtimeMessages'

interface HeaderProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const Header = ({ config, onChangeConfig }: HeaderProps) => {
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className="flex flex-row h-14 gap-2.5 items-center px-4">
      <div className="flex flex-row">
        <ChooseChannelPopover config={config} onChangeConfig={onChangeConfig} />
        <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button
              size="tiny"
              type={config.enabled ? 'warning' : 'primary'}
              className="rounded-l-none border-l-0"
              disabled={config.channelName.length === 0}
              icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
              onClick={() => {
                onChangeConfig({ ...config, enabled: !config.enabled })
                if (!config.enabled) {
                  // the user has clicked to start listening
                  sendEvent({ action: TelemetryActions.REALTIME_INSPECTOR_LISTEN_CHANNEL_CLICKED })
                }
              }}
            >
              {config.enabled ? `停止监听` : `开始监听`}
            </Button>
          </Tooltip.Trigger>
          {config.channelName.length === 0 && (
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">
                    您需要先加入一个频道
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </div>
      <RealtimeFilterPopover config={config} onChangeConfig={onChangeConfig} />
    </div>
  )
}
