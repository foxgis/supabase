export default function CronJobsEmptyState({ page }: { page: string }) {
  return (
    <div className="  text-center h-full w-full items-center justify-center rounded-md px-4 py-12  ">
      <p className="text-sm text-foreground">
        {page === 'jobs' ? '还未创建定时任务' : '定时任务还未执行'}
      </p>
      <p className="text-sm text-foreground-lighter">
        {page === 'jobs'
          ? '点击“创建定时任务”新建一个定时任务'
          : '检查定时任务的执行计划以查看定时任务何时运行'}
      </p>
    </div>
  )
}
