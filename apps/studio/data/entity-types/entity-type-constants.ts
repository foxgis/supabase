export enum ENTITY_TYPE {
  TABLE = 'r',
  VIEW = 'v',
  MATERIALIZED_VIEW = 'm',
  FOREIGN_TABLE = 'f',
  PARTITIONED_TABLE = 'p',
}

export const ENTITY_TYPE_LABELS: Record<ENTITY_TYPE, string> = {
  r: '表',
  v: '视图',
  m: '物化视图',
  f: '外部表',
  p: '分区表',
}
