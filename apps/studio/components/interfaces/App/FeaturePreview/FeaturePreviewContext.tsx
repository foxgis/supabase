import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { EMPTY_OBJ } from 'lib/void'
import { FEATURE_PREVIEWS } from './FeaturePreview.constants'

type FeaturePreviewContextType = {
  flags: { [key: string]: boolean }
  onUpdateFlag: (key: string, value: boolean) => void
}

const FeaturePreviewContext = createContext<FeaturePreviewContextType>({
  flags: EMPTY_OBJ,
  onUpdateFlag: noop,
})

export const useFeaturePreviewContext = () => useContext(FeaturePreviewContext)

export const FeaturePreviewContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const { hasLoaded } = useContext(FeatureFlagContext)

  // [Joshen] Similar logic to feature flagging previews, we can use flags to default opt in previews
  const isDefaultOptIn = (feature: (typeof FEATURE_PREVIEWS)[number]) => {
    switch (feature.key) {
      default:
        return false
    }
  }

  const [flags, setFlags] = useState(() =>
    FEATURE_PREVIEWS.reduce((a, b) => {
      return { ...a, [b.key]: false }
    }, {})
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFlags(
        FEATURE_PREVIEWS.reduce((a, b) => {
          const defaultOptIn = isDefaultOptIn(b)
          const localStorageValue = localStorage.getItem(b.key)
          return {
            ...a,
            [b.key]: !localStorageValue ? defaultOptIn : localStorageValue === 'true',
          }
        }, {})
      )
    }
  }, [hasLoaded])

  const value = {
    flags,
    onUpdateFlag: (key: string, value: boolean) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value.toString())
      }
      const updatedFlags = { ...flags, [key]: value }
      setFlags(updatedFlags)
    },
  }

  return <FeaturePreviewContext.Provider value={value}>{children}</FeaturePreviewContext.Provider>
}

// Helpers

export const useIsAPIDocsSidePanelEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  // return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL]
  return true
}

export const useIsColumnLevelPrivilegesEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS]
}

export const useIsInlineEditorEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  // return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR]
  return true
}

export const useIsRealtimeSettingsEnabled = () => {
  const { flags } = useFeaturePreviewContext()
  return flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_REALTIME_SETTINGS]
}
