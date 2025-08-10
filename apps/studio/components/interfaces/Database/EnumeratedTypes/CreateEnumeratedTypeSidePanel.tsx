import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useEnumeratedTypeCreateMutation } from 'data/enumerated-types/enumerated-type-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SidePanel,
  cn,
} from 'ui'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'
import { NATIVE_POSTGRES_TYPES } from './EnumeratedTypes.constants'

interface CreateEnumeratedTypeSidePanelProps {
  visible: boolean
  onClose: () => void
  schema: string
}

const CreateEnumeratedTypeSidePanel = ({
  visible,
  onClose,
  schema,
}: CreateEnumeratedTypeSidePanelProps) => {
  const initialValues = { name: '', description: '', values: [{ value: '' }] }
  const submitRef = useRef<HTMLButtonElement>(null)
  const { data: project } = useSelectedProjectQuery()
  const { mutate: createEnumeratedType, isLoading: isCreating } = useEnumeratedTypeCreateMutation({
    onSuccess: (res, vars) => {
      toast.success(`成功创建了类型 "${vars.name}"`)
      closePanel()
    },
  })

  useEffect(() => {
    form.reset(initialValues)
  }, [visible])

  const FormSchema = z.object({
    name: z
      .string()
      .min(1, '请为您的枚举类型提供一个名称')
      .refine((value) => !NATIVE_POSTGRES_TYPES.includes(value), {
        message: '名称不能是 Postgres 原生的数据类型',
      })
      .default(''),
    description: z.string().default('').optional(),
    values: z
      .object({ value: z.string().min(1, '请提供一个值') })
      .array()
      .default([]),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const { fields, append, remove, move } = useFieldArray({
    name: 'values',
    control: form.control,
  })

  const updateOrder = (result: any) => {
    // Dropped outside of the list
    if (!result.destination) return
    move(result.source.index, result.destination.index)
  }

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (project?.ref === undefined) return console.error('未找到项目')
    if (project?.connectionString === undefined)
      return console.error('未找到项目连接字符串')

    createEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      schema,
      name: data.name,
      description: data.description?.replaceAll("'", "''"),
      values: data.values.filter((x) => x.value.length > 0).map((x) => x.value.trim()),
    })
  }

  const closePanel = () => {
    form.reset(initialValues)
    onClose()
  }

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={closePanel}
      header="创建新的枚举类型"
      confirmText="创建类型"
      onConfirm={() => {
        if (submitRef.current) submitRef.current.click()
      }}
    >
      <SidePanel.Content className="py-4">
        <Form_Shadcn_ {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>名称</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>描述</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                  <FormDescription_Shadcn_>可选的</FormDescription_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />

            <DragDropContext onDragEnd={(result: any) => updateOrder(result)}>
              <Droppable droppableId="enum_type_values_droppable">
                {(droppableProvided: DroppableProvided) => (
                  <div ref={droppableProvided.innerRef}>
                    {fields.map((field, index) => (
                      <FormField_Shadcn_
                        control={form.control}
                        key={field.id}
                        name={`values.${index}.value`}
                        render={({ field: inputField }) => (
                          <FormItem_Shadcn_>
                            <FormLabel_Shadcn_ className={cn(index !== 0 && 'sr-only')}>
                              值列表
                            </FormLabel_Shadcn_>
                            {index === 0 && (
                              <Alert_Shadcn_>
                                <AlertCircle strokeWidth={1.5} />
                                <AlertTitle_Shadcn_>
                                  值一旦就不能删除或重新排序
                                </AlertTitle_Shadcn_>
                                <AlertDescription_Shadcn_>
                                  <p className="!leading-normal track">
                                    您需要删除并重新创建枚举类型，然后才能使用更新的值。
                                  </p>
                                  <Button
                                    asChild
                                    type="default"
                                    icon={<ExternalLink strokeWidth={1.5} />}
                                    className="mt-2"
                                  >
                                    <Link
                                      href="https://www.postgresql.org/message-id/21012.1459434338%40sss.pgh.pa.us"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      了解更多
                                    </Link>
                                  </Button>
                                </AlertDescription_Shadcn_>
                              </Alert_Shadcn_>
                            )}
                            <FormControl_Shadcn_>
                              <EnumeratedTypeValueRow
                                index={index}
                                id={field.id}
                                field={inputField}
                                isDisabled={fields.length < 2}
                                onRemoveValue={() => remove(index)}
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ className="ml-6" />
                          </FormItem_Shadcn_>
                        )}
                      />
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button
              type="default"
              icon={<Plus strokeWidth={1.5} />}
              onClick={() => append({ value: '' })}
            >
              添加值
            </Button>

            <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
              更新
            </Button>
          </form>
        </Form_Shadcn_>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CreateEnumeratedTypeSidePanel
