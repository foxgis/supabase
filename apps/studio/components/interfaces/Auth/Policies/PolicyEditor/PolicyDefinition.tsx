import { noop } from 'lodash'
import { useEffect } from 'react'

import SqlEditor from 'components/ui/SqlEditor'
import { usePrevious } from 'hooks/deprecated'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface PolicyDefinitionProps {
  operation: string
  definition: string
  check: string
  onUpdatePolicyUsing: (using: string | undefined) => void
  onUpdatePolicyCheck: (check: string | undefined) => void
}

const PolicyDefinition = ({
  operation = '',
  definition = '',
  check = '',
  onUpdatePolicyUsing = noop,
  onUpdatePolicyCheck = noop,
}: PolicyDefinitionProps) => {
  const showUsing = (operation: string) =>
    ['SELECT', 'UPDATE', 'DELETE', 'ALL'].includes(operation) || !operation
  const showCheck = (operation: string) => ['INSERT', 'UPDATE', 'ALL'].includes(operation)

  const previousOperation = usePrevious(operation) || ''
  useEffect(() => {
    if (showUsing(previousOperation) && !showUsing(operation)) onUpdatePolicyUsing(undefined)
    if (showCheck(previousOperation) && !showCheck(operation)) onUpdatePolicyCheck(undefined)
  }, [operation])

  return (
    <div className="space-y-4">
      {showUsing(operation) && (
        <div className="flex space-x-12">
          <div className="flex w-1/3 flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-base text-foreground-light" htmlFor="policy-name">
                USING 表达式
              </label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="text-foreground-light" size={16} strokeWidth={1.5} />
                </TooltipTrigger>

                <TooltipContent side="bottom">
                  <div className="w-[300px] space-y-2">
                    <p className="text-xs text-foreground">
                      如果启用了行级安全性，此表达式将添加到对表的查询中。
                    </p>
                    <p className="text-xs text-foreground">
                      对于返回 true 的表达式的行对将用户可见。对于返回 false 或 null 的表达式的行，将对用户不可见
                      （SELECT 操作），并且也不能修改（UPDATE 或 DELETE操作）。
                    </p>
                    <p className="text-xs text-foreground">
                      这些行将被静默限制，不会报告任何错误。
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-foreground-lighter">
              提供一个返回布尔值的 SQL 条件表达式。
            </p>
          </div>
          <div className={`w-2/3 ${showCheck(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyUsing} />
          </div>
        </div>
      )}
      {showCheck(operation) && (
        <div className="flex space-x-12">
          <div className="flex w-1/3 flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-base text-foreground-light" htmlFor="policy-name">
                WITH CHECK 表达式
              </label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="text-foreground-light" size={16} strokeWidth={1.5} />
                </TooltipTrigger>

                <TooltipContent side="bottom">
                  <div className="w-[300px] space-y-2">
                    <p className="text-xs text-foreground">
                      如果启用行级安全性，
                      此表达式将在对表的 INSERT 和 UPDATE 查询中使用。
                    </p>
                    <p className="text-xs text-foreground">
                      只有对于表达式返回为 true 的行才会被允许操作。如果表达式返回为 false 或 null，
                      对于任何插入操作的新记录或者更新操作返回的记录将会抛出错误。
                    </p>
                    <p className="text-xs text-foreground">
                      请注意，此表达式是针对新行的数据进行求值，而不是旧行的数据。
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-foreground-lighter">
              提供一个返回布尔值的 SQL 条件表达式。
            </p>
          </div>
          <div className={`w-2/3 ${showUsing(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={check} onInputChange={onUpdatePolicyCheck} />
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyDefinition
