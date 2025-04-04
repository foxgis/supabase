import { useState } from 'react'

import { PostgrestRole } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { DropdownMenuSeparator, cn } from 'ui'
import { AnonIcon, AuthenticatedIcon, ServiceRoleIcon } from './Icons'
import RoleImpersonationRadio from './RoleImpersonationRadio'
import UserImpersonationSelector from './UserImpersonationSelector'

export interface RoleImpersonationSelectorProps {
  serviceRoleLabel?: string
  padded?: boolean
}

const RoleImpersonationSelector = ({
  serviceRoleLabel,
  padded = true,
}: RoleImpersonationSelectorProps) => {
  const state = useRoleImpersonationStateSnapshot()

  const [selectedOption, setSelectedOption] = useState<PostgrestRole | undefined>(() => {
    if (
      state.role?.type === 'postgrest' &&
      (state.role.role === 'anon' || state.role.role === 'authenticated')
    ) {
      return state.role.role
    }

    return 'service_role'
  })

  const isAuthenticatedOptionFullySelected = Boolean(
    selectedOption === 'authenticated' &&
      state.role?.type === 'postgrest' &&
      state.role.role === 'authenticated' &&
      (('user' in state.role && state.role.user) ||
        ('externalAuth' in state.role && state.role.externalAuth)) // Check for either auth type
  )

  function onSelectedChange(value: PostgrestRole) {
    if (value === 'service_role') {
      // do not set a role for service role
      // as the default role is the "service role"
      state.setRole(undefined)
    }

    if (value === 'anon') {
      state.setRole({
        type: 'postgrest',
        role: value,
      })
    }

    setSelectedOption(value)
  }

  return (
    <>
      <div className={cn('flex flex-col gap-3', padded ? 'p-5' : 'pb-5')}>
        <h2 className="text-foreground text-base">数据库角色设置</h2>

        <form
          onSubmit={(e) => {
            // don't allow form submission
            e.preventDefault()
          }}
        >
          <fieldset className="flex gap-3">
            <RoleImpersonationRadio
              value="service_role"
              isSelected={selectedOption === 'service_role'}
              onSelectedChange={onSelectedChange}
              label={serviceRoleLabel}
              icon={<ServiceRoleIcon isSelected={selectedOption === 'service_role'} />}
            />

            <RoleImpersonationRadio
              value="anon"
              isSelected={selectedOption === 'anon'}
              onSelectedChange={onSelectedChange}
              icon={<AnonIcon isSelected={selectedOption === 'anon'} />}
            />

            <RoleImpersonationRadio
              value="authenticated"
              isSelected={
                selectedOption === 'authenticated' &&
                (isAuthenticatedOptionFullySelected || 'partially')
              }
              onSelectedChange={onSelectedChange}
              icon={<AuthenticatedIcon isSelected={selectedOption === 'authenticated'} />}
            />
          </fieldset>
        </form>

        {selectedOption === 'service_role' && (
          <p className="text-foreground-light text-sm">
            默认的 postgres/superuser 角色。此角色具有管理员权限。
            <br />
            它会绕过行级安全策略（RLS）。
          </p>
        )}

        {selectedOption === 'anon' && (
          <p className="text-foreground-light text-sm">
            用于“匿名访问”。此角色是 REST 接口服务在用户未登录时使用的角色。
            <br />
            它将遵守行级安全策略（RLS）。
          </p>
        )}

        {selectedOption === 'authenticated' && (
          <p className="text-foreground-light text-sm">
            用于“已认证访问”。此角色是 REST 接口服务在用户登录时使用的角色。
            <br />
            它将遵守行级安全策略（RLS）。
          </p>
        )}
      </div>

      {selectedOption === 'authenticated' && (
        <>
          <DropdownMenuSeparator />
          <div className={cn('py-5', padded && 'px-5')}>
            <UserImpersonationSelector />
          </div>
        </>
      )}
    </>
  )
}

export default RoleImpersonationSelector
