import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSecretsDeleteMutation } from 'data/secrets/secrets-delete-mutation'
import { ProjectSecret, useSecretsQuery } from 'data/secrets/secrets-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import AddNewSecretForm from './AddNewSecretForm'
import EdgeFunctionSecret from './EdgeFunctionSecret'

const EdgeFunctionSecrets = () => {
  const { ref: projectRef } = useParams()
  const [searchString, setSearchString] = useState('')
  const [selectedSecret, setSelectedSecret] = useState<ProjectSecret>()

  const { can: canReadSecrets, isLoading: isLoadingPermissions } = useAsyncCheckProjectPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )
  const { can: canUpdateSecrets } = useAsyncCheckProjectPermissions(
    PermissionAction.SECRETS_WRITE,
    '*'
  )

  const { data, error, isLoading, isSuccess, isError } = useSecretsQuery({
    projectRef: projectRef,
  })

  const { mutate: deleteSecret, isLoading: isDeleting } = useSecretsDeleteMutation({
    onSuccess: () => {
      toast.success(`成功删除了 ${selectedSecret?.name}`)
      setSelectedSecret(undefined)
    },
  })

  const secrets =
    searchString.length > 0
      ? data?.filter((secret) => secret.name.toLowerCase().includes(searchString.toLowerCase())) ??
        []
      : data ?? []

  const headers = [
    <TableHead key="secret-name">名称</TableHead>,
    <TableHead key="secret-value" className="flex items-center gap-x-2">
      摘要{' '}
      <Badge color="scale" className="font-mono">
        SHA256
      </Badge>
    </TableHead>,
    <TableHead key="secret-updated-at">更新时间</TableHead>,
    <TableHead key="actions" />,
  ]

  return (
    <>
      {isLoading || isLoadingPermissions ? (
        <GenericSkeletonLoader />
      ) : (
        <>
          {isError && <AlertError error={error} subject="获取密钥失败" />}

          {isSuccess && (
            <>
              <div className="mb-6">
                {!canUpdateSecrets ? (
                  <NoPermission resourceText="管理密钥" />
                ) : (
                  <AddNewSecretForm />
                )}
              </div>
              {canUpdateSecrets && !canReadSecrets ? (
                <NoPermission resourceText="查看云函数的密钥" />
              ) : canReadSecrets ? (
                <div className="space-y-4 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <Input
                      size="small"
                      className="w-full md:w-80"
                      placeholder="Search for a secret"
                      value={searchString}
                      onChange={(e: any) => setSearchString(e.target.value)}
                      icon={<Search size={14} />}
                    />
                  </div>

                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>{headers}</TableRow>
                      </TableHeader>
                      <TableBody>
                        {secrets.length > 0 ? (
                          secrets.map((secret) => (
                            <EdgeFunctionSecret
                              key={secret.name}
                              secret={secret}
                              onSelectDelete={() => setSelectedSecret(secret)}
                            />
                          ))
                        ) : secrets.length === 0 && searchString.length > 0 ? (
                          <TableRow>
                            <TableCell colSpan={headers.length}>
                              <p className="text-sm text-foreground">未找到结果</p>
                              <p className="text-sm text-foreground-light">
                                您搜索的“{searchString}”未返回任何结果
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={headers.length}>
                              <p className="text-sm text-foreground">还未创建密钥</p>
                              <p className="text-sm text-foreground-light">
                                当前无密钥。
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      <ConfirmationModal
        variant="destructive"
        loading={isDeleting}
        visible={selectedSecret !== undefined}
        confirmLabel="删除密钥"
        confirmLabelLoading="正在删除密钥"
        title={`确认删除密钥“${selectedSecret?.name}”`}
        onCancel={() => setSelectedSecret(undefined)}
        onConfirm={() => {
          if (selectedSecret !== undefined) {
            deleteSecret({ projectRef, secrets: [selectedSecret.name] })
          }
        }}
      >
        <p className="text-sm">
          在移除此密钥之前，请确保没有任何云函数正在使用它。
          此操作无法撤销。
        </p>
      </ConfirmationModal>
    </>
  )
}

export default EdgeFunctionSecrets
