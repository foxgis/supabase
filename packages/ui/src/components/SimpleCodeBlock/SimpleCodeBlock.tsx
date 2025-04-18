'use client'
/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useTheme } from 'next-themes'
import { Highlight, Language, Prism, themes } from 'prism-react-renderer'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Button } from './../Button'
import { cn } from './../../lib/utils/cn'
import { copyToClipboard } from '../../lib/utils'
import { dart } from './prism'

dart(Prism)

const prism = {
  defaultLanguage: 'js',
  plugins: ['line-numbers', 'show-language'],
}

interface SimpleCodeBlockProps {
  parentClassName?: string
  className?: string
  showCopy?: boolean
}

export const SimpleCodeBlock = ({
  children,
  parentClassName,
  className: languageClassName,
  showCopy = true,
}: PropsWithChildren<SimpleCodeBlockProps>) => {
  const { resolvedTheme } = useTheme()
  const [showCopied, setShowCopied] = useState(false)
  const target = useRef(null)
  let highlightLines: any = []

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  let language = languageClassName && languageClassName.replace(/language-/, '')

  if (!language && prism.defaultLanguage) {
    language = prism.defaultLanguage
  }

  const handleCopyCode = (code: any) => {
    copyToClipboard(code, () => setShowCopied(true))
  }

  return (
    <Highlight
      theme={resolvedTheme === 'dark' ? themes.nightOwl : themes.nightOwlLight}
      code={(children as string)?.trim() ?? ''}
      language={language as Language}
    >
      {({ className, tokens, getLineProps, getTokenProps }) => {
        return (
          <div className="Code codeBlockWrapper group">
            <pre ref={target} className={cn('codeBlock', className, parentClassName)}>
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i })

                if (highlightLines.includes(i + 1)) {
                  lineProps.className = `${lineProps.className} docusaurus-highlight-code-line`
                }

                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                )
              })}
            </pre>
            {showCopy && (
              <div className="invisible absolute right-0 top-0 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                <Button size="tiny" type="default" onClick={() => handleCopyCode(children)}>
                  {showCopied ? '已复制' : '复制'}
                </Button>
              </div>
            )}
          </div>
        )
      }}
    </Highlight>
  )
}
