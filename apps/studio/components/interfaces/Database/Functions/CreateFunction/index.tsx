import { zodResolver } from '@hookform/resolvers/zod'
import { isEmpty, isNull, keyBy, mapValues, partition } from 'lodash'
import { Plus, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { POSTGRES_DATA_TYPES } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useDatabaseFunctionCreateMutation } from 'data/database-functions/database-functions-create-mutation'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useDatabaseFunctionUpdateMutation } from 'data/database-functions/database-functions-update-mutation'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import type { FormSchema } from 'types'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Radio,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetSection,
  Toggle,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { convertArgumentTypes, convertConfigParams } from '../Functions.utils'
import { CreateFunctionHeader } from './CreateFunctionHeader'
import { FunctionEditor } from './FunctionEditor'

const FORM_ID = 'create-function-sidepanel'

interface CreateFunctionProps {
  func?: DatabaseFunction
  visible: boolean
  setVisible: (value: boolean) => void
}

const FormSchema = z.object({
  name: z.string().trim().min(1),
  schema: z.string().trim().min(1),
  args: z.array(z.object({ name: z.string().trim().min(1), type: z.string().trim() })),
  behavior: z.enum(['IMMUTABLE', 'STABLE', 'VOLATILE']),
  definition: z.string().trim().min(1),
  language: z.string().trim(),
  return_type: z.string().trim(),
  security_definer: z.boolean(),
  config_params: z
    .array(z.object({ name: z.string().trim().min(1), value: z.string().trim().min(1) }))
    .optional(),
})

const CreateFunction = ({ func, visible, setVisible }: CreateFunctionProps) => {
  const { project } = useProjectContext()
  const [isClosingPanel, setIsClosingPanel] = useState(false)
  const [advancedSettingsShown, setAdvancedSettingsShown] = useState(false)
  // For now, there's no AI assistant for functions
  const [assistantVisible, setAssistantVisible] = useState(false)
  const [focusedEditor, setFocusedEditor] = useState(false)

  const isEditing = !!func?.id

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })
  const language = form.watch('language')

  const { mutate: createDatabaseFunction, isLoading: isCreating } =
    useDatabaseFunctionCreateMutation()
  const { mutate: updateDatabaseFunction, isLoading: isUpdating } =
    useDatabaseFunctionUpdateMutation()

  function isClosingSidePanel() {
    form.formState.isDirty ? setIsClosingPanel(true) : setVisible(!visible)
  }

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!project) return console.error('未找到项目')
    const payload = {
      ...data,
      args: data.args.map((x) => `${x.name} ${x.type}`),
      config_params: mapValues(keyBy(data.config_params, 'name'), 'value') as Record<string, never>,
    }

    if (isEditing) {
      updateDatabaseFunction(
        {
          func,
          projectRef: project.ref,
          connectionString: project.connectionString,
          payload,
        },
        {
          onSuccess: () => {
            toast.success(`成功更新了函数 ${data.name}`)
            setVisible(!visible)
          },
        }
      )
    } else {
      createDatabaseFunction(
        {
          projectRef: project.ref,
          connectionString: project.connectionString,
          payload,
        },
        {
          onSuccess: () => {
            toast.success(`成功创建了函数 ${data.name}`)
            setVisible(!visible)
          },
        }
      )
    }
  }

  useEffect(() => {
    if (visible) {
      setFocusedEditor(false)
      form.reset({
        name: func?.name ?? '',
        schema: func?.schema ?? 'public',
        args: convertArgumentTypes(func?.argument_types || '').value,
        behavior: func?.behavior ?? 'VOLATILE',
        definition: func?.definition ?? '',
        language: func?.language ?? 'plpgsql',
        return_type: func?.return_type ?? 'void',
        security_definer: func?.security_definer ?? false,
        config_params: convertConfigParams(func?.config_params).value,
      })
    }
  }, [visible, func])

  return (
    <Sheet open={visible} onOpenChange={() => isClosingSidePanel()}>
      <SheetContent
        showClose={false}
        size={assistantVisible ? 'lg' : 'default'}
        className={cn(
          // 'bg-surface-200',
          'p-0 flex flex-row gap-0',
          assistantVisible ? '!min-w-screen lg:!min-w-[1200px]' : '!min-w-screen lg:!min-w-[600px]'
        )}
      >
        <div className={cn('flex flex-col grow w-full', assistantVisible && 'w-[60%]')}>
          <CreateFunctionHeader
            selectedFunction={func?.name}
            assistantVisible={assistantVisible}
            setAssistantVisible={setAssistantVisible}
          />
          <Separator />
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              className="flex-grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <SheetSection className={focusedEditor ? 'hidden' : ''}>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout
                      label="函数名称"
                      description="该名称也会在 postgres 中用作函数名称"
                      layout="horizontal"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={focusedEditor ? 'hidden' : 'space-y-4'}>
                <FormField_Shadcn_
                  control={form.control}
                  name="schema"
                  render={({ field }) => (
                    <FormItemLayout
                      label="模式"
                      description="在数据管理中创建的表将在 'public' 模式中"
                      layout="horizontal"
                    >
                      <FormControl_Shadcn_>
                        <SchemaSelector
                          portal={false}
                          selectedSchemaName={field.value}
                          excludedSchemas={PROTECTED_SCHEMAS}
                          size="small"
                          onSelectSchema={(name) => field.onChange(name)}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {!isEditing && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="return_type"
                    render={({ field }) => (
                      <FormItemLayout label="返回类型" layout="horizontal">
                        {/* Form selects don't need form controls, otherwise the CSS gets weird */}
                        <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger_Shadcn_ className="col-span-8">
                            <SelectValue_Shadcn_ />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <ScrollArea className="h-52">
                              {['void', 'record', 'trigger', 'integer', ...POSTGRES_DATA_TYPES].map(
                                (option) => (
                                  <SelectItem_Shadcn_ value={option} key={option}>
                                    {option}
                                  </SelectItem_Shadcn_>
                                )
                              )}
                            </ScrollArea>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                )}
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={focusedEditor ? 'hidden' : ''}>
                <FormFieldArgs readonly={isEditing} />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={`${focusedEditor ? 'h-full' : ''} !px-0`}>
                <FormField_Shadcn_
                  control={form.control}
                  name="definition"
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="space-y-4 flex flex-col h-full">
                      <div className="px-content">
                        <FormLabel_Shadcn_ className="text-base text-foreground">
                          定义函数体
                        </FormLabel_Shadcn_>
                        <FormDescription_Shadcn_ className="text-sm text-foreground-light">
                          <p>
                            下面的代码应该用 <code>{language}</code> 编写。
                          </p>
                          {!isEditing && (
                            <p>在高级设置中更改编程语言。</p>
                          )}
                        </FormDescription_Shadcn_>
                      </div>
                      <div
                        className={cn(
                          'border border-default flex',
                          focusedEditor ? 'flex-grow ' : 'h-72'
                        )}
                      >
                        <FunctionEditor
                          field={field}
                          language={language}
                          focused={focusedEditor}
                          setFocused={setFocusedEditor}
                        />
                      </div>

                      <FormMessage_Shadcn_ className="px-content" />
                    </FormItem_Shadcn_>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              {isEditing ? (
                <></>
              ) : (
                <>
                  <SheetSection className={focusedEditor ? 'hidden' : ''}>
                    <div className="space-y-8 rounded bg-studio py-4 px-6 border border-overlay">
                      <Toggle
                        onChange={() => setAdvancedSettingsShown(!advancedSettingsShown)}
                        label="显示高级设置"
                        checked={advancedSettingsShown}
                        labelOptional="这些是可能对 Postgres 开发者熟悉的设置"
                      />
                    </div>
                  </SheetSection>
                  {advancedSettingsShown && (
                    <>
                      <SheetSection className={focusedEditor ? 'hidden' : 'space-y-2 pt-0'}>
                        <FormFieldLanguage />
                        <FormField_Shadcn_
                          control={form.control}
                          name="behavior"
                          render={({ field }) => (
                            <FormItemLayout label="行为" layout="horizontal">
                              {/* Form selects don't need form controls, otherwise the CSS gets weird */}
                              <Select_Shadcn_
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger_Shadcn_ className="col-span-8">
                                  <SelectValue_Shadcn_ />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectItem_Shadcn_ value="IMMUTABLE" key="IMMUTABLE">
                                    immutable
                                  </SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="STABLE" key="STABLE">
                                    stable
                                  </SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="VOLATILE" key="VOLATILE">
                                    volatile
                                  </SelectItem_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </SheetSection>
                      <Separator className={focusedEditor ? 'hidden' : ''} />
                      <SheetSection className={focusedEditor ? 'hidden' : ''}>
                        <FormFieldConfigParams readonly={isEditing} />
                      </SheetSection>
                      <Separator className={focusedEditor ? 'hidden' : ''} />
                      <SheetSection className={focusedEditor ? 'hidden' : ''}>
                        <h5 className="text-base text-foreground mb-4">安全类型</h5>
                        <FormField_Shadcn_
                          control={form.control}
                          name="security_definer"
                          render={({ field }) => (
                            <FormItem_Shadcn_>
                              <FormControl_Shadcn_ className="col-span-8">
                                {/* TODO: This RadioGroup imports Formik state, replace it with a clean component */}
                                <Radio.Group
                                  type="cards"
                                  layout="vertical"
                                  onChange={(event) =>
                                    field.onChange(event.target.value == 'SECURITY_DEFINER')
                                  }
                                  value={field.value ? 'SECURITY_DEFINER' : 'SECURITY_INVOKER'}
                                >
                                  <Radio
                                    id="SECURITY_INVOKER"
                                    label="SECURITY INVOKER"
                                    value="SECURITY_INVOKER"
                                    checked={!field.value}
                                    description={
                                      <>
                                        函数将以<span className="text-foreground">调用者</span>的权限执行。
                                      </>
                                    }
                                  />
                                  <Radio
                                    id="SECURITY_DEFINER"
                                    label="SECURITY DEFINER"
                                    value="SECURITY_DEFINER"
                                    checked={field.value}
                                    description={
                                      <>
                                        函数将以<span className="text-foreground">创建者</span>的权限执行。
                                      </>
                                    }
                                  />
                                </Radio.Group>
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ />
                            </FormItem_Shadcn_>
                          )}
                        />
                      </SheetSection>
                    </>
                  )}
                </>
              )}
            </form>
          </Form_Shadcn_>
          <SheetFooter>
            <Button disabled={isCreating || isUpdating} type="default" onClick={isClosingSidePanel}>
              取消
            </Button>
            <Button
              form={FORM_ID}
              htmlType="submit"
              disabled={isCreating || isUpdating}
              loading={isCreating || isUpdating}
            >
              确认
            </Button>
          </SheetFooter>
        </div>
        {assistantVisible ? (
          <div className="border-l shadow-[rgba(0,0,0,0.13)_-4px_0px_6px_0px] z-10 w-[50%] bg-studio">
            {/* This is where the AI assistant would be added */}
          </div>
        ) : null}
        <ConfirmationModal
          visible={isClosingPanel}
          title="舍弃更改"
          confirmLabel="舍弃"
          onCancel={() => setIsClosingPanel(false)}
          onConfirm={() => {
            setIsClosingPanel(false)
            setVisible(!visible)
          }}
        >
          <p className="text-sm text-foreground-light">
            有未保存的更改。确定要关闭面板吗？您的更改将会丢失。
          </p>
        </ConfirmationModal>
      </SheetContent>
    </Sheet>
  )
}

export default CreateFunction

interface FormFieldConfigParamsProps {
  readonly?: boolean
}

const FormFieldArgs = ({ readonly }: FormFieldConfigParamsProps) => {
  const { fields, append, remove } = useFieldArray<z.infer<typeof FormSchema>>({
    name: 'args',
  })

  return (
    <>
      <div className="flex flex-col">
        <h5 className="text-base text-foreground">参数</h5>
        <p className="text-sm text-foreground-light">
          参数可在函数体中通过名称或者序号引用。
        </p>
      </div>
      <div className="space-y-2 pt-4">
        {readonly && isEmpty(fields) && (
          <span className="text-foreground-lighter">此函数无参数</span>
        )}
        {fields.map((field, index) => {
          return (
            <div className="flex flex-row space-x-1" key={field.id}>
              <FormField_Shadcn_
                name={`args.${index}.name`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} disabled={readonly} placeholder="argument_name" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                name={`args.${index}.type`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      {readonly ? (
                        <Input_Shadcn_ value={field.value} disabled readOnly className="h-auto" />
                      ) : (
                        <>
                          <Select_Shadcn_
                            disabled={readonly}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger_Shadcn_ className="h-[38px]">
                              <SelectValue_Shadcn_ />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <ScrollArea className="h-52">
                                {['integer', ...POSTGRES_DATA_TYPES].map((option) => (
                                  <SelectItem_Shadcn_ value={option} key={option}>
                                    {option}
                                  </SelectItem_Shadcn_>
                                ))}
                              </ScrollArea>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </>
                      )}
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              {!readonly && (
                <Button
                  type="danger"
                  icon={<Trash size={12} />}
                  onClick={() => remove(index)}
                  className="h-[38px] w-[38px]"
                />
              )}
            </div>
          )
        })}

        {!readonly && (
          <Button
            type="default"
            icon={<Plus size={12} />}
            onClick={() => append({ name: '', type: 'integer' })}
            disabled={readonly}
          >
            添加新参数
          </Button>
        )}
      </div>
    </>
  )
}

interface FormFieldConfigParamsProps {
  readonly?: boolean
}

const FormFieldConfigParams = ({ readonly }: FormFieldConfigParamsProps) => {
  const { fields, append, remove } = useFieldArray<z.infer<typeof FormSchema>>({
    name: 'config_params',
  })

  return (
    <>
      <h5 className="text-base text-foreground">配置参数</h5>
      <div className="space-y-2 pt-4">
        {readonly && isEmpty(fields) && (
          <span className="text-foreground-lighter">此函数无配置参数</span>
        )}
        {fields.map((field, index) => {
          return (
            <div className="flex flex-row space-x-1" key={field.id}>
              <FormField_Shadcn_
                name={`config_params.${index}.name`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="参数名称" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                name={`config_params.${index}.value`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="参数值" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              {!readonly && (
                <Button
                  type="danger"
                  icon={<Trash size={12} />}
                  onClick={() => remove(index)}
                  className="h-[38px] w-[38px]"
                />
              )}
            </div>
          )
        })}

        {!readonly && (
          <Button
            type="default"
            icon={<Plus size={12} />}
            onClick={() => append({ name: '', type: '' })}
            disabled={readonly}
          >
            添加新配置参数
          </Button>
        )}
      </div>
    </>
  )
}

const ALL_ALLOWED_LANGUAGES = ['plpgsql', 'sql', 'plcoffee', 'plv8', 'plls']

const FormFieldLanguage = () => {
  const { project } = useProjectContext()

  const { data: enabledExtensions } = useDatabaseExtensionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      select(data) {
        return partition(data, (ext) => !isNull(ext.installed_version))[0]
      },
    }
  )

  const allowedLanguages = useMemo(() => {
    return ALL_ALLOWED_LANGUAGES.filter((lang) => {
      if (lang.startsWith('pl')) {
        return enabledExtensions?.find((ex) => ex.name === lang) !== undefined
      }

      return true
    })
  }, [enabledExtensions])

  return (
    <FormField_Shadcn_
      name="language"
      render={({ field }) => (
        <FormItemLayout label="编程语言" layout="horizontal">
          {/* Form selects don't need form controls, otherwise the CSS gets weird */}
          <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger_Shadcn_ className="col-span-8">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {allowedLanguages.map((option) => (
                <SelectItem_Shadcn_ value={option} key={option}>
                  {option}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}
