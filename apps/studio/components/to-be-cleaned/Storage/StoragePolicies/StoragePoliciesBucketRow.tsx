import Panel from 'components/ui/Panel'
import { isEmpty } from 'lodash'
import { Archive, Edit, MoreVertical, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface PolicyRowProps {
  policy: any
  table: any
  bucketName: string
  onSelectPolicyEdit: (p: any, s: string, t: any) => void
  onSelectPolicyDelete: (s: string) => void
}

const PolicyRow = ({
  policy,
  table,
  bucketName,
  onSelectPolicyEdit = () => {},
  onSelectPolicyDelete = () => {},
}: PolicyRowProps) => {
  const { name, command } = policy
  return (
    <div className="group">
      <Panel.Content className="flex justify-between gap-2 border-b border-overlay py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="font-mono text-xs text-foreground-lighter">{command}</div>
          <div className="flex flex-col gap-2 lg:flex-row">
            <span className="truncate text-sm text-foreground">{name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button type="default" className="px-1.5" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              className="gap-x-2"
              onClick={() => onSelectPolicyEdit(policy, bucketName, table)}
            >
              <Edit size={14} />
              <p>编辑</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-x-2" onClick={() => onSelectPolicyDelete(policy)}>
              <Trash size={14} />
              <p>删除</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Panel.Content>
    </div>
  )
}

const StoragePoliciesBucketRow = ({
  table = '',
  label = '',
  bucket = {},
  policies = [],
  onSelectPolicyAdd = () => {},
  onSelectPolicyEdit = () => {},
  onSelectPolicyDelete = () => {},
}: any) => {
  const getFooterLabel = () => {
    if (isEmpty(bucket))
      return table === 'objects'
        ? `有${policies.length} 条策略${
            policies.length > 1 ? '' : ''
          }未绑定任何存储桶`
        : `有${policies.length} 条策略${policies.length > 1 ? '' : ''}关联到您的存储桶`
    return `在 ${bucket.name} 中有 ${policies.length} 条策略${policies.length > 1 ? '' : ''}`
  }

  return (
    <Panel
      title={[
        <div key={label} className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-4">
            <Archive className="text-foreground-light" size={14} />
            <h4 className="m-0 text-lg">
              <span>{label}</span>
            </h4>
            {bucket.public && <Badge variant="warning">公开</Badge>}
          </div>
          <Button type="outline" onClick={() => onSelectPolicyAdd(bucket.name, table)}>
            新建策略
          </Button>
        </div>,
      ]}
    >
      {policies.length === 0 ? (
        <div className="p-4 px-6">
          <p className="text-sm text-foreground-lighter">还未创建策略</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y [[data-theme*=dark]_&]:divide-dark">
          {policies.map((policy: any) => (
            <PolicyRow
              key={policy.name}
              policy={policy}
              table={table}
              bucketName={bucket.name}
              onSelectPolicyEdit={onSelectPolicyEdit}
              onSelectPolicyDelete={onSelectPolicyDelete}
            />
          ))}
          {policies.length !== 0 ? (
            <div className="px-6 py-2">
              <p className="text-sm text-foreground-light">{getFooterLabel()}</p>
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}

export default StoragePoliciesBucketRow
