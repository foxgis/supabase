import { noop } from 'lodash'
import { Select } from 'ui'

import type { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { POSTGRES_DATA_TYPES } from '../SidePanelEditor.constants'
import type { ColumnField } from '../SidePanelEditor.types'
import { typeExpressionSuggestions } from './ColumnEditor.constants'
import type { Suggestion } from './ColumnEditor.types'
import InputWithSuggestions from './InputWithSuggestions'

interface ColumnDefaultValueProps {
  columnFields: ColumnField
  enumTypes: EnumeratedType[]
  onUpdateField: (changes: Partial<ColumnField>) => void
}

const ColumnDefaultValue = ({
  columnFields,
  enumTypes = [],
  onUpdateField = noop,
}: ColumnDefaultValueProps) => {
  const suggestions: Suggestion[] = typeExpressionSuggestions?.[columnFields.format] ?? []

  // If selected column type is a user-defined enum, show a dropdown list of options
  const isEnum: boolean =
    !POSTGRES_DATA_TYPES.includes(columnFields.format) &&
    enumTypes.some((type) => type.name === columnFields.format)

  if (isEnum) {
    const enumType = enumTypes.find((type) => type.name === columnFields.format)
    const enumValues = enumType?.enums ?? []
    const originalDefaultValue = columnFields?.defaultValue ?? ''
    const formattedValue = originalDefaultValue.includes('::')
      ? originalDefaultValue.split('::')[0].slice(1, -1)
      : originalDefaultValue

    if (enumType !== undefined) {
      return (
        <Select
          label="默认值"
          layout="vertical"
          value={formattedValue}
          onChange={(event: any) => onUpdateField({ defaultValue: event.target.value })}
        >
          <Select.Option key="empty-enum" value="">
            NULL
          </Select.Option>
          {enumValues.map((value: string) => (
            <Select.Option key={value} value={value}>
              {value}
            </Select.Option>
          ))}
        </Select>
      )
    }
  }

  return (
    <InputWithSuggestions
      label="默认值"
      layout="vertical"
      description="可以是字面量或者表达式。当使用表达式时，请将您的表达式用英文括号括起来，例如 (gen_random_uuid())"
      placeholder={
        typeof columnFields.defaultValue === 'string' && columnFields.defaultValue.length === 0
          ? '空字符'
          : 'NULL'
      }
      value={columnFields?.defaultValue ?? ''}
      suggestions={suggestions}
      suggestionsHeader="建议的表达式"
      suggestionsTooltip="建议的表达式"
      onChange={(event: any) => onUpdateField({ defaultValue: event.target.value })}
      onSelectSuggestion={(suggestion: Suggestion) =>
        onUpdateField({ defaultValue: suggestion.value })
      }
    />
  )
}

export default ColumnDefaultValue
