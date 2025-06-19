import { EdgeFunction } from 'data/edge-functions/edge-function-query'

export const generateCLICommands = ({
  selectedFunction,
  functionUrl,
  anonKey,
}: {
  selectedFunction?: EdgeFunction
  functionUrl: string
  anonKey: string
}) => {
  const managementCommands: any = [
    {
      command: `supabase functions deploy ${selectedFunction?.slug}`,
      description: '此操作将会使用新云函数覆盖已部署的云函数',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> functions deploy{' '}
            {selectedFunction?.slug}
          </>
        )
      },
      comment: '部署新版本',
    },
    {
      command: `supabase functions delete ${selectedFunction?.slug}`,
      description: '此操作将删除云函数及其关联的所有日志',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> functions delete{' '}
            {selectedFunction?.slug}
          </>
        )
      },
      comment: '删除云函数',
    },
  ]

  const secretCommands: any = [
    {
      command: `supabase secrets list`,
      description: '此操作将列出所有密钥',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> secrets list
          </>
        )
      },
      comment: '查看所有密钥',
    },
    {
      command: `supabase secrets set NAME1=VALUE1 NAME2=VALUE2`,
      description: '此操作将设置密钥',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> secrets set NAME1=VALUE1 NAME2=VALUE2
          </>
        )
      },
      comment: '设置密钥',
    },
    {
      command: `supabase secrets unset NAME1 NAME2 `,
      description: '此操作将删除密钥',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> secrets unset NAME1 NAME2
          </>
        )
      },
      comment: '删除密钥',
    },
  ]

  const invokeCommands: any = [
    {
      command: `curl -L -X POST '${functionUrl}' -H 'Authorization: Bearer ${
        anonKey ?? '[YOUR ANON KEY]'
      }' --data '{"name":"Functions"}'`,
      description: '调用云函数',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">curl</span> -L -X POST '{functionUrl}'{' '}
            {selectedFunction?.verify_jwt
              ? `-H
            'Authorization: Bearer [YOUR ANON KEY]' `
              : ''}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: '调用云函数',
    },
  ]

  return { managementCommands, secretCommands, invokeCommands }
}
