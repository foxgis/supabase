import { Tabs } from 'ui'
import { useRouter } from 'next/router'

const FunctionsNav = ({ item }: any) => {
  const router = useRouter()
  const activeRoute = router.pathname.split('/')[5]
  const { ref } = router.query

  return (
    <Tabs
      defaultActiveId="1"
      type="underlined"
      size="medium"
      baseClassNames="!space-y-0"
      activeId={!activeRoute ? 'overview' : activeRoute}
      onChange={(e: string) => {
        if (item?.slug) {
          router.push(`/project/${ref}/functions/${item.slug}/${e === 'overview' ? '' : e}`)
        }
      }}
    >
      <Tabs.Panel id="overview" label="概览" />
      <Tabs.Panel id="invocations" label="调用次数" />
      <Tabs.Panel id="logs" label="日志" />
      <Tabs.Panel id="details" label="详情" />
    </Tabs>
  )
}

export default FunctionsNav
