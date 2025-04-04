import { concat, sortBy } from 'lodash'
import type { PostgresDataTypeOption } from './SidePanelEditor.types'

export const NUMERICAL_TYPES = [
  'int2',
  'int4',
  'int8',
  'float4',
  'float8',
  'numeric',
  'double precision',
]
export const JSON_TYPES = ['json', 'jsonb']
export const TEXT_TYPES = ['text', 'varchar']

export const TIMESTAMP_TYPES = ['timestamp', 'timestamptz']
export const DATE_TYPES = ['date']
export const TIME_TYPES = ['time', 'timetz']
export const DATETIME_TYPES = concat(TIMESTAMP_TYPES, DATE_TYPES, TIME_TYPES)

export const OTHER_DATA_TYPES = ['uuid', 'bool', 'vector', 'bytea']
export const POSTGRES_DATA_TYPES = sortBy(
  concat(NUMERICAL_TYPES, JSON_TYPES, TEXT_TYPES, DATETIME_TYPES, OTHER_DATA_TYPES)
)

export const RECOMMENDED_ALTERNATIVE_DATA_TYPE: {
  [key: string]: { alternative: string; reference: string }
} = {
  varchar: {
    alternative: 'text',
    reference:
      "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_varchar.28n.29_by_default",
  },
  json: {
    alternative: 'jsonb',
    reference: 'https://www.postgresql.org/docs/current/datatype-json.html',
  },
  timetz: {
    alternative: 'timestamptz',
    reference: "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timetz",
  },
  timestamp: {
    alternative: 'timestamptz',
    reference:
      "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29",
  },
}

export const POSTGRES_DATA_TYPE_OPTIONS: PostgresDataTypeOption[] = [
  {
    name: 'int2',
    description: '双字节有符号整数',
    type: 'number',
  },
  {
    name: 'int4',
    description: '四字节有符号整数',
    type: 'number',
  },
  {
    name: 'int8',
    description: '八字节有符号整数',
    type: 'number',
  },
  {
    name: 'float4',
    description: '单精度浮点数（4字节）',
    type: 'number',
  },
  {
    name: 'float8',
    description: '双精度浮点数（8字节）',
    type: 'number',
  },
  {
    name: 'numeric',
    description: '精确数值，可选择精度',
    type: 'number',
  },
  {
    name: 'json',
    description: '文本型 JSON 数据',
    type: 'json',
  },
  {
    name: 'jsonb',
    description: '二进制 JSON 数据',
    type: 'json',
  },
  {
    name: 'text',
    description: '可变长度字符串',
    type: 'text',
  },
  {
    name: 'varchar',
    description: '可变长度字符串',
    type: 'text',
  },
  {
    name: 'uuid',
    description: '通用唯一标识符',
    type: 'text',
  },
  {
    name: 'date',
    description: '日历日期（年、月、日）',
    type: 'time',
  },
  {
    name: 'time',
    description: '时间（无时区）',
    type: 'time',
  },
  {
    name: 'timetz',
    description: '时间，包括时区',
    type: 'time',
  },
  {
    name: 'timestamp',
    description: '日期和时间（无时区）',
    type: 'time',
  },
  {
    name: 'timestamptz',
    description: '日期和时间，包括时区',
    type: 'time',
  },
  {
    name: 'bool',
    description: '布尔值（true/false）',
    type: 'bool',
  },
  {
    name: 'bytea',
    description: 'Variable-length binary string',
    type: 'others',
  },
]
