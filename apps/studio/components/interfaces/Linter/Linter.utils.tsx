import { Box, Clock, Eye, Lock, Ruler, Table2, TextSearch, Unlock, User } from 'lucide-react'
import Link from 'next/link'

import { LINTER_LEVELS, LintInfo } from 'components/interfaces/Linter/Linter.constants'
import { LINT_TYPES, Lint } from 'data/lint/lint-query'
import { Badge, Button } from 'ui'

export const lintInfoMap: LintInfo[] = [
  {
    name: 'unindexed_foreign_keys',
    title: '未索引的外键',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}`,
    linkText: '创建索引',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0001_unindexed_foreign_keys',
  },
  {
    name: 'auth_users_exposed',
    title: '暴露的认证用户',
    icon: <Lock className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: ({ projectRef }) => `/project/${projectRef}/editor`,
    linkText: '查看数据表',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0002_auth_users_exposed',
  },
  {
    name: 'auth_rls_initplan',
    title: '认证 RLS 初始化计划',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/policies`,
    linkText: '查看策略',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0003_auth_rls_initplan',
  },
  {
    name: 'no_primary_key',
    title: '无主键',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/editor`,
    linkText: '查看数据表',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0004_no_primary_key',
  },
  {
    name: 'unused_index',
    title: '未使用的索引',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: '查看索引',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0005_unused_index',
  },
  {
    name: 'multiple_permissive_policies',
    title: '多个允许性策略',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: '查看策略',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0006_multiple_permissive_policies',
  },
  {
    name: 'policy_exists_rls_disabled',
    title: '策略存在但 RLS 未启用',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: '查看策略',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0007_policy_exists_rls_disabled',
  },
  {
    name: 'rls_enabled_no_policy',
    title: 'RLS 已启用但没有策略',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: '查看数据表',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0008_rls_enabled_no_policy',
  },
  {
    name: 'duplicate_index',
    title: '重复索引',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: '查看索引',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0009_duplicate_index',
  },
  {
    name: 'security_definer_view',
    title: 'Security Definer 视图',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0010_security_definer_view',
    linkText: '查看文档',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0010_security_definer_view',
  },
  {
    name: 'function_search_path_mutable',
    title: '函数搜索路径可变',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/functions?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: '查看函数',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0011_function_search_path_mutable',
  },
  {
    name: 'rls_disabled_in_public',
    title: '在 public 模式中未启用 RLS',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: '查看策略',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0013_rls_disabled_in_public',
  },
  {
    name: 'extension_in_public',
    title: 'public 模式中的扩展',
    icon: <Unlock className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/extensions?filter=${metadata?.name}`,
    linkText: '查看扩展',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0014_extension_in_public',
  },
  {
    name: 'auth_otp_long_expiry',
    title: '身份认证验证码（OTP）过期时间过长',
    icon: <Clock className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers`,
    linkText: '查看设置',
    docsLink: 'https://supabase.com/docs/guides/platform/going-into-prod#security',
  },
  {
    name: 'auth_otp_short_length',
    title: '身份认证验证码（OTP）长度太短',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/going-into-prod#security',
  },
  {
    name: 'rls_references_user_metadata',
    title: 'RLS 引用用户元数据',
    icon: <User className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/policies`,
    linkText: '查看策略',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0015_rls_references_user_metadata',
  },
  {
    name: 'materialized_view_in_api',
    title: 'API 中的物化视图',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `https://supabase.com/docs/guides/database/database-advisors?lint=0016_materialized_view_in_api`,
    linkText: '查看文档',
    docsLink:
      'https://supabase.com/docs/guides/database/database-advisors?lint=0016_materialized_view_in_api',
  },
  {
    name: 'foreign_table_in_api',
    title: 'API 中的外部表',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api`,
    linkText: '查看文档',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api',
  },
  {
    name: 'unsupported_reg_types',
    title: 'Unsupported reg types',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `https://supabase.com/docs/guides/database/database-advisors?lint=0018_unsupported_reg_types&queryGroups=lint`,
    linkText: 'View docs',
    docsLink:
      'https://supabase.com/docs/guides/database/database-advisors?lint=0018_unsupported_reg_types&queryGroups=lint',
  },
  {
    name: 'ssl_not_enforced',
    title: 'SSL not enforced',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/settings/database`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/ssl-enforcement',
  },
  {
    name: 'network_restrictions_not_set',
    title: 'No network restrictions',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/settings/database`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/network-restrictions',
  },
  {
    name: 'pitr_not_enabled',
    title: 'PITR not enabled',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/database/backups/pitr`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/backups#point-in-time-recovery',
  },
  {
    name: 'password_requirements_min_length',
    title: 'Minimum password length not set or inadequate',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/settings/auth`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/going-into-prod#security',
  },
]

export const LintCTA = ({
  title,
  projectRef,
  metadata,
}: {
  title: LINT_TYPES
  projectRef: string
  metadata: Lint['metadata']
}) => {
  const lintInfo = lintInfoMap.find((item) => item.name === title)

  if (!lintInfo) {
    return null
  }

  const link = lintInfo.link({ projectRef, metadata })
  const linkText = lintInfo.linkText

  return (
    <Button asChild type="default">
      <Link href={link} target="_blank" rel="noreferrer" className="no-underline">
        {linkText}
      </Link>
    </Button>
  )
}

export const EntityTypeIcon = ({ type }: { type: string | undefined }) => {
  switch (type) {
    case 'table':
      return <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />
    case 'view':
      return <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />
    case 'auth':
      return <Lock className="text-foreground-muted" size={15} strokeWidth={1.5} />
    default:
      return <Box className="text-foreground-muted" size={15} strokeWidth={1.5} />
  }
}

export const LintEntity = ({ metadata }: { metadata: Lint['metadata'] }) => {
  return (
    (metadata &&
      (metadata.entity ||
        (metadata.schema && metadata.name && `${metadata.schema}.${metadata.name}`))) ??
    undefined
  )
}

export const LintCategoryBadge = ({ category }: { category: string }) => {
  return (
    <Badge variant={category === 'SECURITY' ? 'destructive' : 'warning'} className="capitalize">
      {category.toLowerCase()}
    </Badge>
  )
}

export const NoIssuesFound = ({ level }: { level: string }) => {
  const noun = level === LINTER_LEVELS.ERROR ? '错误' : '警告'
  return (
    <div className="absolute top-28 px-6 flex flex-col items-center justify-center w-full gap-y-2">
      <TextSearch className="text-foreground-muted" strokeWidth={1} />
      <div className="text-center">
        <p className="text-foreground">未检测到{noun}</p>
        <p className="text-foreground-light">
          恭喜！此数据库未检测到任何{noun}
        </p>
      </div>
    </div>
  )
}
