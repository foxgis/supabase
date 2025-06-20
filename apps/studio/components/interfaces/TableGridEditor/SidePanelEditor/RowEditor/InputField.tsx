import { includes, noop } from 'lodash'
import { Edit, Eye } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DATETIME_TYPES, JSON_TYPES, TEXT_TYPES } from '../SidePanelEditor.constants'
import { DateTimeInput } from './DateTimeInput'
import type { EditValue, RowField } from './RowEditor.types'
import { isValueTruncated } from './RowEditor.utils'

const TRUNCATE_DESCRIPTION =
  '注意：值太长无法在界面中显示，请展开编辑框以方便编辑值'

export interface InputFieldProps {
  field: RowField
  errors: any
  isEditable?: boolean
  onUpdateField?: (changes: object) => void
  onEditJson?: (data: any) => void
  onEditText?: (data: EditValue) => void
  onSelectForeignKey?: () => void
}

const InputField = ({
  field,
  errors,
  isEditable = true,
  onUpdateField = noop,
  onEditJson = noop,
  onEditText = noop,
  onSelectForeignKey = noop,
}: InputFieldProps) => {
  if (field.enums.length > 0) {
    const isArray = field.format[0] === '_'
    if (isArray) {
      return (
        <div className="text-area-text-sm">
          <Input.TextArea
            data-testid={`${field.name}-input`}
            layout="horizontal"
            label={field.name}
            className="text-sm"
            descriptionText={field.comment}
            labelOptional={field.format}
            disabled={!isEditable}
            error={errors[field.name]}
            rows={5}
            value={field.value ?? ''}
            placeholder={
              field.defaultValue === null
                ? ''
                : typeof field.defaultValue === 'string' && field.defaultValue.length === 0
                  ? '空字符'
                  : `默认值：${field.defaultValue}`
            }
            onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
          />
        </div>
      )
    } else {
      return (
        <Select
          size="medium"
          layout="horizontal"
          value={field.value ?? ''}
          label={field.name}
          labelOptional={field.format}
          descriptionText={field.comment}
          disabled={!isEditable}
          error={errors[field.name]}
          onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        >
          <Select.Option value="">---</Select.Option>
          {field.enums.map((value: string) => (
            <Select.Option key={value} value={value}>
              {value}
            </Select.Option>
          ))}
        </Select>
      )
    }
  }

  if (field.foreignKey !== undefined) {
    return (
      <Input
        data-testid={`${field.name}-input`}
        layout="horizontal"
        placeholder="NULL"
        label={field.name}
        value={field.value ?? ''}
        descriptionText={
          <>
            {field.comment && (
              <span className="text-sm text-foreground-lighter">{field.comment} </span>
            )}
            <span className="text-sm text-foreground-lighter">
              {field.comment && '（'}有外键关联到
            </span>
            <span className="text-code font-mono text-xs text-foreground-lighter">
              {field.foreignKey.target_table_schema}.{field.foreignKey.target_table_name}.
              {field.foreignKey.target_column_name}
            </span>
            {field.comment && <span className="text-sm text-foreground-lighter">{`）`}</span>}
          </>
        }
        labelOptional={field.format}
        disabled={!isEditable}
        error={errors[field.name]}
        onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        actions={
          isEditable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" icon={<Edit />} className="px-1.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                {field.isNullable && (
                  <DropdownMenuItem onClick={() => onUpdateField({ [field.name]: null })}>
                    设置为 NULL
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onSelectForeignKey}>选择记录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />
    )
  }

  if (includes(TEXT_TYPES, field.format)) {
    const isTruncated = isValueTruncated(field.value)

    return (
      <div className="text-area-text-sm">
        <Input.TextArea
          data-testid={`${field.name}-input`}
          layout="horizontal"
          label={field.name}
          className="input-sm"
          descriptionText={
            <>
              {field.comment && <p>{field.comment}</p>}
              {isTruncated && <p>{TRUNCATE_DESCRIPTION}</p>}
            </>
          }
          textAreaClassName="pr-8"
          labelOptional={field.format}
          disabled={!isEditable || isTruncated}
          error={errors[field.name]}
          rows={5}
          value={field.value ?? ''}
          placeholder={
            field.value === null && field.defaultValue === null
              ? 'NULL'
              : field.value === ''
                ? 'EMPTY'
                : typeof field.defaultValue === 'string' && field.defaultValue.length === 0
                  ? 'EMPTY'
                  : `NULL (Default: ${field.defaultValue})`
          }
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" icon={<Edit />} className="px-1.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                {isEditable && (
                  <DropdownMenuItem onClick={() => onUpdateField({ [field.name]: null })}>
                    设置为 NULL
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onEditText({ column: field.name, value: field.value || '' })}
                >
                  展开编辑器
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          onChange={(event) => onUpdateField({ [field.name]: event.target.value })}
        />
      </div>
    )
  }

  if (includes(JSON_TYPES, field.format)) {
    const isTruncated = isValueTruncated(field.value)

    return (
      <Input
        data-testid={`${field.name}-input`}
        layout="horizontal"
        value={field.value ?? ''}
        label={field.name}
        descriptionText={
          <>
            {field.comment && <p>{field.comment}</p>}
            {isTruncated && <p>{TRUNCATE_DESCRIPTION}</p>}
          </>
        }
        labelOptional={field.format}
        disabled={!isEditable || isTruncated}
        placeholder={field?.defaultValue ?? 'NULL'}
        error={errors[field.name]}
        onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
        actions={
          <Button
            type="default"
            htmlType="button"
            onClick={() => onEditJson({ column: field.name, value: field.value })}
            icon={isEditable ? <Edit /> : <Eye />}
          >
            {isEditable ? '编辑' : '查看 JSON'}
          </Button>
        }
      />
    )
  }

  if (includes(DATETIME_TYPES, field.format)) {
    return (
      <DateTimeInput
        name={field.name}
        format={field.format}
        value={field.value ?? ''}
        isNullable={field.isNullable}
        description={
          <>
            {field.defaultValue && <p>Default: {field.defaultValue}</p>}
            {field.comment && <p>{field.comment}</p>}
          </>
        }
        onChange={(value: any) => onUpdateField({ [field.name]: value })}
        disabled={!isEditable}
      />
    )
  }

  if (field.format === 'bool') {
    const options = [
      { value: 'true', label: 'TRUE' },
      { value: 'false', label: 'FALSE' },
      ...(field.isNullable ? [{ value: 'null', label: 'NULL' }] : []),
    ]

    const defaultValue = field.value === null ? undefined : field.value

    return (
      <FormItemLayout
        isReactForm={false}
        layout="horizontal"
        label={field.name}
        labelOptional={field.format}
        description={field.comment}
        className="[&>div:first-child>span]:text-foreground-lighter"
      >
        <Select_Shadcn_
          value={defaultValue === null ? 'null' : defaultValue}
          onValueChange={(value: string) => onUpdateField({ [field.name]: value })}
          disabled={!isEditable}
        >
          <SelectTrigger_Shadcn_>
            <SelectValue_Shadcn_ placeholder="Select a value" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            <SelectGroup_Shadcn_>
              {options.map((option) => (
                <SelectItem_Shadcn_ key={option.value} value={option.value}>
                  {option.label}
                </SelectItem_Shadcn_>
              ))}
            </SelectGroup_Shadcn_>
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </FormItemLayout>
    )
  }

  if (field.format === 'bytea') {
    return (
      <Input
        data-testid={`${field.name}-input`}
        layout="horizontal"
        label={field.name}
        descriptionText={
          <>
            {field.comment && <p>{field.comment}</p>}
            <p>Bytea columns are edited and displayed as hex in the dashboard</p>
          </>
        }
        labelOptional={field.format}
        error={errors[field.name]}
        value={field.value ?? ''}
        placeholder={`\\x`}
        disabled={!isEditable}
        onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
      />
    )
  }

  const isTruncated = isValueTruncated(field.value)

  return (
    <Input
      data-testid={`${field.name}-input`}
      layout="horizontal"
      label={field.name}
      descriptionText={
        <>
          {field.comment && <p>{field.comment}</p>}
          {isTruncated && <p>{TRUNCATE_DESCRIPTION}</p>}
        </>
      }
      labelOptional={field.format}
      error={errors[field.name]}
      value={field.value ?? ''}
      placeholder={
        field.isIdentity
          ? '自动生成的主键'
          : field.defaultValue !== null
            ? `默认值：${field.defaultValue}`
            : 'NULL'
      }
      disabled={!isEditable || isTruncated}
      onChange={(event: any) => onUpdateField({ [field.name]: event.target.value })}
      actions={
        isTruncated ? (
          <Button
            type="default"
            htmlType="button"
            onClick={() => onEditJson({ column: field.name, value: field.value })}
            icon={isEditable ? <Edit /> : <Eye />}
          >
            {isEditable ? 'Edit' : 'View'}
          </Button>
        ) : undefined
      }
    />
  )
}

export default InputField
