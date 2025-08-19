import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeleteMutation } from 'data/edge-functions/edge-functions-delete-mutation'
import { useEdgeFunctionUpdateMutation } from 'data/edge-functions/edge-functions-update-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  CodeBlock,
  CriticalIcon,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  Switch,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import CommandRender from '../CommandRender'
import { INVOCATION_TABS } from './EdgeFunctionDetails.constants'
import { generateCLICommands } from './EdgeFunctionDetails.utils'

const FormSchema = z.object({
  name: z.string().min(0, 'Name is required'),
  verify_jwt: z.boolean(),
})

export const EdgeFunctionDetails = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { can: canUpdateEdgeFunction } = useAsyncCheckProjectPermissions(
    PermissionAction.FUNCTIONS_WRITE,
    '*'
  )

  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const {
    data: selectedFunction,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })

  const { mutate: updateEdgeFunction, isLoading: isUpdating } = useEdgeFunctionUpdateMutation()
  const { mutate: deleteEdgeFunction, isLoading: isDeleting } = useEdgeFunctionDeleteMutation({
    onSuccess: () => {
      toast.success(`成功删除了“${selectedFunction?.name}”`)
      router.push(`/project/${projectRef}/functions`)
    },
  })

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', verify_jwt: false },
  })

  const { anonKey, publishableKey } = getKeys(apiKeys)
  const apiKey = publishableKey?.api_key ?? anonKey?.api_key ?? '[YOUR ANON KEY]'

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const functionUrl =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}/functions/v1/${selectedFunction?.slug}`
      : `${protocol}://${endpoint}/functions/v1/${selectedFunction?.slug}`
  const hasImportMap = useMemo(
    () => selectedFunction?.import_map || selectedFunction?.import_map_path,
    [selectedFunction]
  )
  const { managementCommands } = generateCLICommands({
    selectedFunction,
    functionUrl,
    anonKey: apiKey,
  })

  const onUpdateFunction: SubmitHandler<z.infer<typeof FormSchema>> = async (values: any) => {
    if (!projectRef) return console.error('未找到项目号')
    if (selectedFunction === undefined) return console.error('未选中任何云函数')

    updateEdgeFunction(
      {
        projectRef,
        slug: selectedFunction.slug,
        payload: values,
      },
      {
        onSuccess: () => {
          toast.success(`成功更新了云函数`)
        },
      }
    )
  }

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (selectedFunction === undefined) return console.error('未选中任何云函数')
    deleteEdgeFunction({ projectRef, slug: selectedFunction.slug })
  }

  useEffect(() => {
    if (selectedFunction) {
      form.reset({
        name: selectedFunction.name,
        verify_jwt: selectedFunction.verify_jwt,
      })
    }
  }, [selectedFunction])

  return (
    <div className="mx-auto flex flex-col-reverse 2xl:flex-row gap-8 pb-8">
      <div className="flex-1 min-w-0 overflow-hidden">
        <ScaffoldSection isFullWidth className="!pt-0 2xl:first:!pt-12">
          <ScaffoldSectionTitle className="mb-4">云函数配置</ScaffoldSectionTitle>
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onUpdateFunction)}>
              <Card>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout
                        label="名称"
                        layout="flex-row-reverse"
                        description="您的 URL 标识段将使用相同的名称"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            className="w-64"
                            disabled={!canUpdateEdgeFunction}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="verify_jwt"
                    render={({ field }) => (
                      <FormItemLayout
                        label="使用旧密钥验证 JWT"
                        layout="flex-row-reverse"
                        description={
                          <>
                            要求在<code>Authorization</code>头中包含的 JWT <em className="text-brand not-italic">仅由旧密钥签名</em>。
                            可使用<code>anon</code>密钥满足此要求。
                            建议：关闭此选项，在函数代码中使用 JWT 实现自定义认证逻辑。
                          </>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdateEdgeFunction}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button type="default" onClick={() => form.reset()}>
                      取消
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!canUpdateEdgeFunction || !form.formState.isDirty}
                  >
                    保存变更
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </ScaffoldSection>
        <ScaffoldSection isFullWidth>
          <ScaffoldSectionTitle className="mb-4">调用云函数</ScaffoldSectionTitle>
          <Card>
            <CardContent>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="flex flex-wrap gap-4">
                  {INVOCATION_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {INVOCATION_TABS.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-4">
                    <div className="overflow-x-auto">
                      <CodeBlock
                        language={tab.language}
                        hideLineNumbers={tab.hideLineNumbers}
                        className="p-0 text-xs !mt-0 border-none"
                        value={tab.code(functionUrl, selectedFunction?.name ?? '', apiKey)}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </ScaffoldSection>
        <ScaffoldSection isFullWidth>
          <ScaffoldSectionTitle className="mb-4">本地开发</ScaffoldSectionTitle>
          <div className="rounded border bg-surface-100 px-6 py-4 drop-shadow-sm">
            <div className="space-y-6">
              <CommandRender
                commands={[
                  {
                    command: `supabase functions download ${selectedFunction?.name}`,
                    description: '将函数下载到本地机器',
                    jsx: () => (
                      <>
                        <span className="text-brand-600">supabase</span> functions download{' '}
                        {selectedFunction?.name}
                      </>
                    ),
                    comment: '1. 下载函数',
                  },
                ]}
              />
              <CommandRender commands={[managementCommands[0]]} />
              <CommandRender commands={[managementCommands[1]]} />
            </div>
          </div>
        </ScaffoldSection>
        <ScaffoldSection isFullWidth>
          <ScaffoldSectionTitle className="mb-4">删除云函数</ScaffoldSectionTitle>
          <Alert_Shadcn_ variant="destructive">
            <CriticalIcon />
            <AlertTitle_Shadcn_>
              云函数一旦删除将无法恢复
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              如果想要恢复云函数，请确保已备份云函数
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3">
              <Button
                type="danger"
                disabled={!canUpdateEdgeFunction}
                loading={selectedFunction?.id === undefined}
                onClick={() => setShowDeleteModal(true)}
              >
                删除云函数
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </ScaffoldSection>

        <ConfirmationModal
          visible={showDeleteModal}
          loading={isDeleting}
          variant="destructive"
          confirmLabel="删除"
          confirmLabelLoading="正在删除"
          title={`确认删除 ${selectedFunction?.name}`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={onConfirmDelete}
          alert={{
            base: { variant: 'destructive' },
            title: '此操作无法撤销',
            description: '如果想要恢复云函数，请确保已备份云函数',
          }}
        />
      </div>

      <div className="w-full 2xl:max-w-[600px] shrink-0">
        <ScaffoldSection isFullWidth className="!pt-6 2xl:first:!pt-12">
          <Card>
            <CardHeader>
              <CardTitle>详情</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoading && <GenericSkeletonLoader />}
              {isError && (
                <AlertError error={error} subject="获取云函数详情失败" />
              )}
              {isSuccess && (
                <dl className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-y-4 xl:gap-y-6 gap-x-10">
                  <dt className="text-sm text-foreground-light">标识符</dt>
                  <dd className="text-sm lg:text-left">{selectedFunction?.slug}</dd>

                  <dt className="text-sm text-foreground-light">URL 地址</dt>
                  <dd className="text-sm lg:text-left">
                    <Input
                      className="font-mono input-mono"
                      disabled
                      copy
                      size="small"
                      value={functionUrl}
                    />
                  </dd>

                  <dt className="text-sm text-foreground-light">区域</dt>
                  <dd className="text-sm lg:text-left">所有云函数全球部署</dd>

                  <dt className="text-sm text-foreground-light">创建时间</dt>
                  <dd className="text-sm lg:text-left">
                    {dayjs(selectedFunction?.created_at ?? 0).format('YYYY/MM/DD h:mm A')}
                  </dd>

                  <dt className="text-sm text-foreground-light">最近更新时间</dt>
                  <dd className="text-sm lg:text-left">
                    {dayjs(selectedFunction?.updated_at ?? 0).format('YYYY/MM/DD h:mm A')}
                  </dd>

                  <dt className="text-sm text-foreground-light">部署次数</dt>
                  <dd className="text-sm lg:text-left">{selectedFunction?.version ?? 0}</dd>

                  <dt className="text-sm text-foreground-light">Import Maps</dt>
                  <dd className="text-sm lg:text-left">
                    <p>
                      此云函数
                      <span className={cn(hasImportMap ? 'text-brand' : 'text-amber-900')}>
                        {hasImportMap ? '使用了' : '未使用'}
                      </span>{' '}
                      import maps
                    </p>
                    <p className="text-foreground-light mt-1">
                      Import Maps 允许在云函数中使用指示符，而不是显式的导入完整 URL
                    </p>
                    <div className="mt-4">
                      <Button
                        asChild
                        type="default"
                        size="tiny"
                        icon={<ExternalLink strokeWidth={1.5} />}
                      >
                        <Link
                          href="https://supabase.com/docs/guides/functions/import-maps"
                          target="_blank"
                          rel="noreferrer"
                        >
                          更多关于 Import Maps
                        </Link>
                      </Button>
                    </div>
                  </dd>
                </dl>
              )}
            </CardContent>
          </Card>
        </ScaffoldSection>
      </div>
    </div>
  )
}
