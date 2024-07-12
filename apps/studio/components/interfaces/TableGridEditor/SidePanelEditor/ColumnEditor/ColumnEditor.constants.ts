import type { Dictionary } from 'types'
import type { Suggestion } from './ColumnEditor.types'

const defaultTimeBasedExpressions: Suggestion[] = [
  {
    name: 'now()',
    value: 'now()',
    description: '返回当前的日期和时间',
  },
  {
    name: "(now() at time zone 'utc')",
    value: "(now() at time zone 'utc')",
    description: '返回指定时区的当前日期和时间。',
  },
]

const defaultTextBasedValues: Suggestion[] = [
  {
    name: '设为 NULL',
    value: null,
    description: '将默认值设为 NULL',
  },
  {
    name: '设为空字符串',
    value: '',
    description: '将默认值设为空字符串',
  },
]

// [Joshen] For now this is a curate mapping, ideally we could look into
// using meta-store's extensions to generate this partially on top of vanilla expressions
export const typeExpressionSuggestions: Dictionary<Suggestion[]> = {
  uuid: [
    {
      name: 'auth.uid()',
      value: 'auth.uid()',
      description: "返回当通过 API 添加或更新行时该用户的 ID",
    },
    {
      name: 'gen_random_uuid()',
      value: 'gen_random_uuid()',
      description: '生成一个 v4 版本的 UUID',
    },
  ],
  time: [...defaultTimeBasedExpressions],
  timetz: [...defaultTimeBasedExpressions],
  timestamp: [...defaultTimeBasedExpressions],
  timestamptz: [...defaultTimeBasedExpressions],
  text: [...defaultTextBasedValues],
  varchar: [...defaultTextBasedValues],
}
