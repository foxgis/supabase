import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  RadioGroupLargeItem_Shadcn_,
  RadioGroup_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'

interface PolicyDetailsV2Props {
  schema: string
  searchString?: string
  selectedTable?: string
  isEditing: boolean
  form: UseFormReturn<{
    name: string
    table: string
    behavior: string
    command: string
    roles: string
  }>
  onUpdateCommand: (command: string) => void
  authContext: 'database' | 'realtime'
}

export const PolicyDetailsV2 = ({
  schema,
  searchString,
  selectedTable,
  isEditing,
  form,
  onUpdateCommand,
  authContext,
}: PolicyDetailsV2Props) => {
  const { data: project } = useSelectedProjectQuery()
  const [open, setOpen] = useState(false)
  const canUpdatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const { data: tables, isSuccess: isSuccessTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: schema,
    sortByProperty: 'name',
    includeColumns: true,
  })

  const { data: dbRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const formattedRoles = (dbRoles ?? [])
    .map((role) => {
      return {
        id: role.id,
        name: role.name,
        value: role.name,
        disabled: false,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    if (!isEditing && selectedTable === undefined) {
      const table = tables?.find(
        (table) =>
          table.schema === schema &&
          (table.id.toString() === searchString || table.name === searchString)
      )
      if (table) {
        form.setValue('table', table.name)
      } else if (isSuccessTables && tables.length > 0) {
        form.setValue('table', tables[0].name)
      }
    }
  }, [isEditing, form, searchString, tables, isSuccessTables, selectedTable])

  return (
    <>
      <div className="px-5 py-5 flex flex-col gap-y-4 border-b">
        <div className="items-start justify-between gap-4 grid grid-cols-12">
          <FormField_Shadcn_
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem_Shadcn_ className="col-span-6 flex flex-col gap-y-1">
                <FormLabel_Shadcn_>策略名称</FormLabel_Shadcn_>
                <FormControl_Shadcn_>
                  <Input_Shadcn_
                    {...field}
                    disabled={!canUpdatePolicies}
                    className="bg-control border-control"
                    placeholder="为您的策略提供一个名称"
                  />
                </FormControl_Shadcn_>
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />

          <FormField_Shadcn_
            control={form.control}
            name="table"
            render={({ field }) => (
              <FormItem_Shadcn_ className="col-span-6 flex flex-col gap-y-1">
                <FormLabel_Shadcn_ className="flex items-center gap-x-4">
                  <p className="text-foreground-light text-sm">表</p>
                  <p className="text-foreground-light text-sm">
                    <code className="text-xs">on</code> 子句
                  </p>
                </FormLabel_Shadcn_>
                {authContext === 'database' && (
                  <FormControl_Shadcn_>
                    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
                      <PopoverTrigger_Shadcn_ asChild>
                        <Button
                          type="default"
                          disabled={!canUpdatePolicies}
                          className="w-full [&>span]:w-full h-[38px] text-sm"
                          iconRight={
                            <ChevronsUpDown
                              className="text-foreground-muted"
                              strokeWidth={2}
                              size={14}
                            />
                          }
                        >
                          <div className="w-full flex gap-1">
                            <span className="text-foreground">
                              {schema}.{field.value}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger_Shadcn_>

                      <PopoverContent_Shadcn_
                        className="p-0"
                        side="bottom"
                        align="start"
                        sameWidthAsTrigger
                      >
                        <Command_Shadcn_>
                          <CommandInput_Shadcn_ placeholder="查找表..." />
                          <CommandList_Shadcn_>
                            <CommandEmpty_Shadcn_>未找到表</CommandEmpty_Shadcn_>
                            <CommandGroup_Shadcn_>
                              <ScrollArea className={(tables ?? []).length > 7 ? 'h-[200px]' : ''}>
                                {(tables ?? []).map((table) => (
                                  <CommandItem_Shadcn_
                                    key={table.id}
                                    className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                                    onSelect={() => {
                                      form.setValue('table', table.name)
                                      setOpen(false)
                                    }}
                                    onClick={() => {
                                      form.setValue('table', table.name)
                                      setOpen(false)
                                    }}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {field.value === table.name ? <Check size={13} /> : ''}
                                      <span>
                                        {table.name}
                                        <span className="block text-muted font-normal truncate">{table.comment}</span>
                                      </span>
                                    </span>
                                  </CommandItem_Shadcn_>
                                ))}
                              </ScrollArea>
                            </CommandGroup_Shadcn_>
                          </CommandList_Shadcn_>
                        </Command_Shadcn_>
                      </PopoverContent_Shadcn_>
                    </Popover_Shadcn_>
                  </FormControl_Shadcn_>
                )}
                {authContext === 'realtime' && (
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      disabled
                      value="messages.realtime"
                      className="bg-control border-control"
                    />
                  </FormControl_Shadcn_>
                )}

                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />

          <FormField_Shadcn_
            control={form.control}
            name="behavior"
            render={({ field }) => (
              <FormItem_Shadcn_ className="col-span-6 flex flex-col gap-y-1">
                <FormLabel_Shadcn_ className="flex items-center gap-x-4">
                  <p className="text-foreground-light text-sm">策略行为</p>
                  <p className="text-foreground-light text-sm">
                    <code className="text-xs">as</code> 子句
                  </p>
                </FormLabel_Shadcn_>
                <FormControl_Shadcn_>
                  <Select_Shadcn_
                    disabled={isEditing}
                    value={field.value}
                    onValueChange={(value) => form.setValue('behavior', value)}
                  >
                    <SelectTrigger_Shadcn_ className="text-sm h-10 capitalize">
                      {field.value}
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_ value="permissive" className="text-sm">
                          <p>允许</p>
                          <p className="text-foreground-light text-xs">
                            策略组合使用“OR”布尔运算符
                          </p>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="restrictive" className="text-sm">
                          <p>限制</p>
                          <p className="text-foreground-light text-xs">
                          策略组合使用“AND”布尔运算符
                          </p>
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormControl_Shadcn_>
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />
          <FormField_Shadcn_
            control={form.control}
            name="command"
            render={({ field }) => (
              <FormItem_Shadcn_ className="col-span-12 flex flex-col gap-y-1">
                <FormLabel_Shadcn_ className="flex items-center gap-x-4">
                  <p className="text-foreground-light text-sm">策略命令</p>
                  <p className="text-foreground-light text-sm">
                    <code className="text-xs">for</code> 子句
                  </p>
                </FormLabel_Shadcn_>
                <FormControl_Shadcn_>
                  <RadioGroup_Shadcn_
                    disabled={isEditing}
                    value={field.value}
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      form.setValue('command', value)
                      onUpdateCommand(value)
                    }}
                    className={`grid grid-cols-10 gap-3 ${isEditing ? 'opacity-50' : ''}`}
                  >
                    {[
                      'select',
                      'insert',
                      ...(authContext === 'database' ? ['update', 'delete', 'all'] : []),
                    ].map((x) => (
                      <RadioGroupLargeItem_Shadcn_
                        key={x}
                        value={x}
                        disabled={isEditing}
                        label={x.toLocaleUpperCase()}
                        className={`col-span-2 w-auto ${isEditing ? 'cursor-not-allowed' : ''}`}
                      />
                    ))}
                  </RadioGroup_Shadcn_>
                </FormControl_Shadcn_>
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />
          <FormField_Shadcn_
            control={form.control}
            name="roles"
            render={({ field }) => (
              <FormItem_Shadcn_ className="col-span-12 flex flex-col gap-y-1">
                <FormLabel_Shadcn_ className="flex items-center gap-x-4">
                  <p className="text-foreground-light text-sm">目标角色</p>
                  <p className="text-foreground-light text-sm">
                    <code className="text-xs">to</code> 子句
                  </p>
                </FormLabel_Shadcn_>
                <FormControl_Shadcn_>
                  <MultiSelectV2
                    disabled={!canUpdatePolicies}
                    options={formattedRoles}
                    value={field.value.length === 0 ? [] : field.value?.split(', ')}
                    placeholder="如果未选择角色则默认为所有角色（public）"
                    searchPlaceholder="查找角色"
                    onChange={(roles) => form.setValue('roles', roles.join(', '))}
                  />
                </FormControl_Shadcn_>
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />
        </div>
      </div>
    </>
  )
}
