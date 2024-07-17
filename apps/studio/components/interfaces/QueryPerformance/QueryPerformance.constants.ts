export enum QUERY_PERFORMANCE_REPORT_TYPES {
  MOST_TIME_CONSUMING = 'most_time_consuming',
  MOST_FREQUENT = 'most_frequent',
  SLOWEST_EXECUTION = 'slowest_execution',
}

export const QUERY_PERFORMANCE_REPORTS = {
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING]: [
    { id: 'query', name: '查询', description: undefined, minWidth: 600 },
    { id: 'rolname', name: '调用角色', description: undefined, minWidth: undefined },
    { id: 'calls', name: '调用次数', description: undefined, minWidth: undefined },
    { id: 'total_time', name: '总耗时', description: '延迟', minWidth: 180 },
    { id: 'prop_total_time', name: '耗时占比', description: undefined, minWidth: 150 },
  ],
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT]: [
    { id: 'query', name: '查询', description: undefined, minWidth: 600 },
    { id: 'rolname', name: '调用角色', description: undefined, minWidth: undefined },
    { id: 'avg_rows', name: '平均行数', description: undefined, minWidth: undefined },
    { id: 'calls', name: '调用次数', description: undefined, minWidth: undefined },
    { id: 'max_time', name: '最长时间', description: undefined, minWidth: undefined },
    { id: 'mean_time', name: '平均时间', description: undefined, minWidth: undefined },
    { id: 'min_time', name: '最短时间', description: undefined, minWidth: undefined },
    { id: 'total_time', name: '总时间', description: '延迟', minWidth: 180 },
  ],
  [QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION]: [
    { id: 'query', name: '查询', description: undefined, minWidth: 600 },
    { id: 'rolname', name: '调用角色', description: undefined, minWidth: undefined },
    { id: 'avg_rows', name: '平均行数', description: undefined, minWidth: undefined },
    { id: 'calls', name: '调用次数', description: undefined, minWidth: undefined },
    { id: 'max_time', name: '最长时间', description: undefined, minWidth: undefined },
    { id: 'mean_time', name: '平均时间', description: undefined, minWidth: undefined },
    { id: 'min_time', name: '最短时间', description: undefined, minWidth: undefined },
    { id: 'total_time', name: '总时间', description: '延迟', minWidth: 180 },
  ],
} as const
