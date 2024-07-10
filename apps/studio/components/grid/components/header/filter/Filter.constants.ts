export const FilterOperatorOptions = [
  { value: '=', label: '等于', preLabel: '[ = ]', abbrev: 'eq' },
  { value: '<>', label: '不等于', preLabel: '[ <> ]', abbrev: 'neq' },
  { value: '>', label: '大于', preLabel: '[ > ]', abbrev: 'gt' },
  { value: '<', label: '小于', preLabel: '[ < ]', abbrev: 'lt' },
  { value: '>=', label: '大于等于', preLabel: '[ >= ]', abbrev: 'gte' },
  { value: '<=', label: '小于等于', preLabel: '[ <= ]', abbrev: 'lte' },
  { value: '~~', label: '模糊匹配', preLabel: '[ ~~ ]', abbrev: 'like' },
  { value: '~~*', label: '不区分大小写的模糊匹配', preLabel: '[ ~~* ]', abbrev: 'ilike' },
  { value: 'in', label: '属于', preLabel: '[ in ]', abbrev: 'in' },
  {
    value: 'is',
    label: '检查是否为(null, not null, true, false)',
    preLabel: '[ is ]',
    abbrev: 'is',
  },
]
