export const INDEX_TYPES = [
  {
    name: 'B-Tree',
    value: 'btree',
    description:
      '用于查询具有等值或范围条件的列的数据。这是 Postgres 所使用的默认索引类型。',
  },
  {
    name: 'Hash',
    value: 'hash',
    description: '用于查询精确匹配的列的数据',
  },
  {
    name: 'GiST',
    value: 'gist',
    description: '用于查询复杂数据类型或自定义运算符的数据',
  },
  {
    name: 'SP-GiST',
    value: 'spgist',
    description: '类似于 GiST，但更专门化和定制化',
  },
  {
    name: 'GIN',
    value: 'gin',
    description: '用于查询多值数据，如数组或全文搜索场景的数据',
  },
  {
    name: 'BRIN',
    value: 'brin',
    description: '用于查询大型表中的已排序数据',
  },
]
