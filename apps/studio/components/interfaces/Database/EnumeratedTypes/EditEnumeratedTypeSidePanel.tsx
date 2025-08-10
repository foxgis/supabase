import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useEnumeratedTypeUpdateMutation } from 'data/enumerated-types/enumerated-type-update-mutation'
import type { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
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

interface EditEnumeratedTypeSidePanelProps {
  visible: boolean
  selectedEnumeratedType?: EnumeratedType
  onClose: () => void
}

const EditEnumeratedTypeSidePanel = ({
  visible,
  selectedEnumeratedType,
  onClose,
}: EditEnumeratedTypeSidePanelProps) => {
  const submitRef = useRef<HTMLButtonElement>(null)
  const { data: project } = useSelectedProjectQuery()
  const { mutate: updateEnumeratedType, isLoading: isCreating } = useEnumeratedTypeUpdateMutation({
    onSuccess: (_, vars) => {
      toast.success(`成功更新了 "${vars.name.updated}"`)
      onClose()
    },
  })

  const FormSchema = z.object({
    name: z.string().min(1, '请为您的枚举类型提供一个名称').default(''),
    description: z.string().default('').optional(),
    values: z
      .object({
        isNew: z.boolean(),
        originalValue: z.string(),
        updatedValue: z.string().min(1, '请提供一个值'),
      })
      .array()
      .default([]),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      description: '',
      values: [{ isNew: true, originalValue: '', updatedValue: '' }],
    },
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

  const originalEnumeratedTypes = (selectedEnumeratedType?.enums ?? []).map((x) => ({
    isNew: false,
    originalValue: x,
    updatedValue: x,
  }))

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (project?.ref === undefined) return console.error('未找到项目号')
    if (project?.connectionString === undefined)
      return console.error('未找到项目连接字符串')
    if (selectedEnumeratedType === undefined)
      return console.error('未找到枚举类型')

    const payload: {
      schema: string
      name: { original: string; updated: string }
      values: { original: string; updated: string; isNew: boolean }[]
      description?: string
    } = {
      schema: selectedEnumeratedType.schema,
      name: { original: selectedEnumeratedType.name, updated: data.name },
      values: data.values
        .filter((x) => x.updatedValue.length !== 0)
        .map((x) => ({
          original: x.originalValue,
          updated: x.updatedValue.trim(),
          isNew: x.isNew,
        })),
      ...(data.description !== selectedEnumeratedType.comment
        ? { description: data.description?.replaceAll("'", "''") }
        : {}),
    }

    updateEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      ...payload,
    })
  }

  useEffect(() => {
    if (selectedEnumeratedType !== undefined) {
      form.reset({
        name: selectedEnumeratedType.name,
        description: selectedEnumeratedType.comment ?? '',
        values: originalEnumeratedTypes,
      })
    }

    if (selectedEnumeratedType == undefined) {
      form.reset({
        values: originalEnumeratedTypes,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnumeratedType])

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={onClose}
      header={`更新类型 "${selectedEnumeratedType?.name}"`}
      confirmText="更新类型"
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
                        name={`values.${index}.updatedValue`}
                        render={({ field: inputField }) => (
                          <FormItem_Shadcn_>
                            <FormLabel_Shadcn_ className={cn(index !== 0 && 'sr-only')}>
                              值列表
                            </FormLabel_Shadcn_>
                            {index === 0 && (
                              <Alert_Shadcn_>
                                <AlertCircle strokeWidth={1.5} />
                                <AlertTitle_Shadcn_>
                                  已存在的值不能删除或者重排序
                                </AlertTitle_Shadcn_>
                                <AlertDescription_Shadcn_>
                                  <p className="!leading-normal track">
                                    您需要删除并重新创建类型，然后才能使用更新后的值。
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
                                isDisabled={!field.isNew}
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
              onClick={() => append({ isNew: true, originalValue: '', updatedValue: '' })}
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

export default EditEnumeratedTypeSidePanel
