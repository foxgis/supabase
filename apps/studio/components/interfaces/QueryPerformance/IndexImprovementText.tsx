import { HTMLAttributes } from 'react'

import { cn } from 'ui'
import { calculateImprovement } from './index-advisor.utils'

interface IndexImprovementTextProps extends HTMLAttributes<HTMLParagraphElement> {
  indexStatements: string[]
  totalCostBefore: number
  totalCostAfter: number
}

export const IndexImprovementText = ({
  indexStatements,
  totalCostBefore,
  totalCostAfter,
  className,
  ...props
}: IndexImprovementTextProps) => {
  const improvement = calculateImprovement(totalCostBefore, totalCostAfter)

  return (
    <p className={cn('text-sm text-foreground-light', className)} {...props}>
      通过创建以下{indexStatements.length > 1 ? '索引' : '索引'}，
      查询性能可以提升
      <span className="text-brand">{improvement.toFixed(2)}%</span>
    </p>
  )
}
