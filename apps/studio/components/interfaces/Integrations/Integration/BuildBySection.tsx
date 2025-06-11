import { Book } from 'lucide-react'
import Link from 'next/link'
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'

import { cn } from 'ui'
import { IntegrationDefinition } from '../Landing/Integrations.constants'

interface BuiltBySectionProps extends ComponentPropsWithoutRef<'div'> {
  integration: IntegrationDefinition
}

export const BuiltBySection = forwardRef<ElementRef<'div'>, BuiltBySectionProps>(
  ({ integration, className, ...props }, ref) => {
    const { docsUrl } = integration
    const { name, websiteUrl } = integration?.author ?? {}

    if (!name && !docsUrl && !websiteUrl) return null

    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-8 md:gap-10 px-4 md:px-10', className)}
        {...props}
      >
        {name && (
          <div>
            <div className="text-foreground-lighter font-mono text-xs mb-1">开发者</div>
            <div className="text-foreground-light text-sm">{name}</div>
          </div>
        )}
        {docsUrl && (
          <div>
            <div className="text-foreground-lighter font-mono text-xs mb-1">文档</div>
            <Link
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-light hover:text-foreground text-sm flex items-center gap-2"
            >
              <Book size={16} />
              {docsUrl.includes('supabase.com/docs')
                ? '查看文档'
                : docsUrl.includes('github.com')
                  ? '查看文档'
                  : '查看文档'}
            </Link>
          </div>
        )}
        {websiteUrl && (
          <div>
            <div className="text-foreground-lighter font-mono text-xs mb-1">网站</div>
            <Link
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-light hover:text-foreground text-sm"
            >
              {websiteUrl.replace('https://', '')}
            </Link>
          </div>
        )}
      </div>
    )
  }
)

BuiltBySection.displayName = 'BuiltBySection'
