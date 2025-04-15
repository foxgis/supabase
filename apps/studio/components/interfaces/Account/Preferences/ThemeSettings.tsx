import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'

import Panel from 'components/ui/Panel'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH, LOCAL_STORAGE_KEYS } from 'lib/constants'
import {
  Label_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupLargeItem_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  singleThemes,
  Theme,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DEFAULT_SIDEBAR_BEHAVIOR } from 'components/interfaces/Sidebar'

export const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const [sidebarBehaviour, setSidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )
  /**
   * Avoid Hydration Mismatch
   * https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
   */
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  function SingleThemeSelection() {
    return (
      <form>
        <RadioGroup_Shadcn_
          name="theme"
          onValueChange={setTheme}
          aria-label="Choose a theme"
          defaultValue={theme}
          value={theme}
          className="flex flex-wrap gap-2 md:gap-5"
        >
          {singleThemes.map((theme: Theme) => (
            <RadioGroupLargeItem_Shadcn_
              className="grow p-3"
              key={theme.value}
              value={theme.value}
              label={theme.name}
            >
              <SVG src={`${BASE_PATH}/img/themes/${theme.value}.svg?v=2`} />
            </RadioGroupLargeItem_Shadcn_>
          ))}
        </RadioGroup_Shadcn_>
      </form>
    )
  }

  return (
    <Panel title={<h5 key="panel-title">外观</h5>}>
      <Panel.Content className="grid gap-8 !py-5">
        <div className="grid grid-cols-12">
          <div className="col-span-full md:col-span-4 flex flex-col gap-5">
            <Label_Shadcn_ htmlFor="theme" className="text-light">
              界面风格
            </Label_Shadcn_>
            <p className="text-sm text-foreground-light max-w-[220px]">
              设置数据中间件界面的外观风格，可以选择一个主题，或者使用系统主题。
            </p>
          </div>

          <div className="col-span-full md:col-span-8 flex flex-col gap-4">
            <p className="text-sm text-light">数据中间件将使用您选定的主题</p>
            <SingleThemeSelection />
          </div>
        </div>
      </Panel.Content>
      <Separator />
      <Panel.Content>
        <FormItemLayout
          isReactForm={false}
          label="侧边栏设置"
          layout="flex-row-reverse"
          description="设置侧边栏行为：展开、折叠或鼠标悬停时自动展开。"
        >
          <Select_Shadcn_
            value={sidebarBehaviour}
            onValueChange={setSidebarBehaviour}
            aria-label="选择"
          >
            <SelectTrigger_Shadcn_>
              <SelectValue_Shadcn_ placeholder="选择" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="open">展开</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="closed">折叠</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="expandable">自动展开</SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormItemLayout>
      </Panel.Content>
    </Panel>
  )
}
