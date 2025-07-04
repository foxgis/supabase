import { ChevronDown, Plus, Trash } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'

import { useParams } from 'common'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  SheetSection,
} from 'ui'
import { CreateCronJobForm } from './CreateCronJobSheet'

interface HTTPHeaderFieldsSectionProps {
  variant: 'edge_function' | 'http_request'
}

export const HTTPHeaderFieldsSection = ({ variant }: HTTPHeaderFieldsSectionProps) => {
  // gets the fields through form context
  const { fields, append, remove } = useFieldArray<CreateCronJobForm>({
    name: 'values.httpHeaders',
  })

  const { ref } = useParams()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const { serviceKey } = getAPIKeys(settings)
  const apiKey = serviceKey?.api_key ?? '[YOUR API KEY]'

  return (
    <SheetSection>
      <FormLabel_Shadcn_>HTTP 请求头</FormLabel_Shadcn_>
      <div className="space-y-3 mt-1">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <FormField_Shadcn_
              name={`values.httpHeaders.${index}.name`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      size="small"
                      className="w-full"
                      placeholder="请求头名称"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              name={`values.httpHeaders.${index}.value`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      value={field.value}
                      size="small"
                      className="w-full"
                      placeholder="请求头的值"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              type="default"
              icon={<Trash size={12} />}
              onClick={() => remove(index)}
              className="h-[34px] w-[34px]"
            />
          </div>
        ))}
        <div className="flex items-center">
          <Button
            type="default"
            size="tiny"
            icon={<Plus />}
            className={cn(variant === 'edge_function' && 'rounded-r-none px-3 border-r-0')}
            onClick={() => append({ name: '', value: '' })}
          >
            添加新的请求头
          </Button>
          {variant === 'edge_function' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" className="rounded-l-none px-[4px] py-[5px]">
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem
                  key="add-auth-header"
                  onClick={() =>
                    append({
                      name: 'Authorization',
                      value: `Bearer ${apiKey}`,
                    })
                  }
                >
                  <div className="space-y-1">
                    <p className="block text-foreground">添加授权请求头</p>
                    <p className="text-foreground-light">
                      当云函数需要 JWT 验证时，必须添加此请求头
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  key="add-source-header"
                  onClick={() =>
                    append({
                      name: 'x-supabase-webhook-source',
                      value: `[Use a secret value]`,
                    })
                  }
                >
                  <div className="space-y-1">
                    <p className="block text-foreground">添加自定义源请求头</p>
                    <p className="text-foreground-light">
                      此请求头可用于验证云函数是否是从此 Webhook 触发的
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </SheetSection>
  )
}
