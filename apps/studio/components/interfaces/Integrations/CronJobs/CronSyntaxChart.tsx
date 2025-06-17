export default function CronSyntaxChart() {
  return (
    <div>
      <pre className="text-xs font-mono text-foreground-light">
        {/* prettier-ignore */}
        {`
 ┌───────────── 分钟 (0 - 59)
 │  ┌───────────── 小时 (0 - 23)
 │  │  ┌───────────── 日 (1 - 31)
 │  │  │  ┌───────────── 月 (1 - 12)
 │  │  │  │  ┌───────────── 周 (0 - 7)
 │  │  │  │  │
 *  *  *  *  * `}
      </pre>
    </div>
  )
}
