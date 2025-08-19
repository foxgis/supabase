import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Trash } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { ProjectSecret } from 'data/secrets/secrets-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { TableCell, TableRow } from 'ui'
import { TimestampInfo } from 'ui-patterns'

interface EdgeFunctionSecretProps {
  secret: ProjectSecret
  onSelectDelete: () => void
}

const EdgeFunctionSecret = ({ secret, onSelectDelete }: EdgeFunctionSecretProps) => {
  const { can: canUpdateSecrets } = useAsyncCheckProjectPermissions(
    PermissionAction.SECRETS_WRITE,
    '*'
  )
  // [Joshen] Following API's validation:
  // https://github.com/supabase/infrastructure/blob/develop/api/src/routes/v1/projects/ref/secrets/secrets.controller.ts#L106
  const isReservedSecret = !!secret.name.match(/^(SUPABASE_).*/)

  return (
    <TableRow>
      <TableCell>
        <p className="truncate py-2">{secret.name}</p>
      </TableCell>
      <TableCell>
        <p
          className="font-mono text-sm max-w-96 truncate text-foreground-light"
          title={secret.value}
        >
          {secret.value}
        </p>
      </TableCell>
      <TableCell>
        {!!secret.updated_at ? (
          <TimestampInfo
            displayAs="local"
            utcTimestamp={secret.updated_at}
            labelFormat="YYYY/MM/DD HH:mm:ss (ZZ)"
            className="!text-sm text-foreground-light"
          />
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end">
          <ButtonTooltip
            type="text"
            icon={<Trash />}
            className="px-1"
            disabled={!canUpdateSecrets || isReservedSecret}
            onClick={() => onSelectDelete()}
            tooltip={{
              content: {
                side: 'bottom',
                text: isReservedSecret
                  ? '此密钥是保留密钥，无法删除'
                  : !canUpdateSecrets
                    ? '您需要额外的权限才能删除云函数密钥'
                    : undefined,
              },
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

export default EdgeFunctionSecret
