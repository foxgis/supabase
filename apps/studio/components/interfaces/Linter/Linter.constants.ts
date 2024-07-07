import { Lint } from 'data/lint/lint-query'
export enum LINTER_LEVELS {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

export type LintInfo = {
  name: string
  title: string
  icon: JSX.Element
  link: (args: { projectRef: string; metadata: Lint['metadata'] }) => string
  linkText: string
  docsLink: string
}

export const LINT_TABS = [
  {
    id: LINTER_LEVELS.ERROR,
    label: '错误',
    description: '你应该将这些问题视为紧急问题，并尽快修复。',
  },
  {
    id: LINTER_LEVELS.WARN,
    label: '警告 ',
    description: '你应该尝试浏览这些问题，并在必要时进行修复。',
  },
  {
    id: LINTER_LEVELS.INFO,
    label: '建议 ',
    description: '你应该仔细阅读这些建议，并考虑实施它们。',
  },
]
