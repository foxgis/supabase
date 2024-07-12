import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'

export const FOREIGN_KEY_CASCADE_OPTIONS = [
  { key: 'no-action', label: '无操作', value: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION },
  { key: 'cascade', label: '级联操作', value: FOREIGN_KEY_CASCADE_ACTION.CASCADE },
  { key: 'restrict', label: '限制操作', value: FOREIGN_KEY_CASCADE_ACTION.RESTRICT },
  { key: 'set-default', label: '设为默认值', value: FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT },
  { key: 'set-null', label: '设为 NULL', value: FOREIGN_KEY_CASCADE_ACTION.SET_NULL },
]
