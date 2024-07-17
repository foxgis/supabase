import { SYSTEM_ROLES } from 'components/interfaces/Database/Roles/Roles.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'

import MultiSelect from 'ui-patterns/MultiSelectDeprecated'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { sortBy } from 'lodash'

interface PolicyRolesProps {
  selectedRoles: string[]
  onUpdateSelectedRoles: (roles: string[]) => void
}
type SystemRole = (typeof SYSTEM_ROLES)[number]

const PolicyRoles = ({ selectedRoles, onUpdateSelectedRoles }: PolicyRolesProps) => {
  const { project } = useProjectContext()
  const { data, error, isLoading, isError, isSuccess } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = sortBy(
    (data ?? []).filter((role) => !SYSTEM_ROLES.includes(role.name as SystemRole)),
    (r) => r.name.toLocaleLowerCase()
  )

  const formattedRoles = roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      value: role.name,
      disabled: false,
    }
  })

  return (
    <div className="flex space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-foreground-light text-base" htmlFor="policy-name">
          目标角色
        </label>
        <p className="text-foreground-lighter text-sm">将此策略应用于选定的角色</p>
      </div>
      <div className="relative w-2/3">
        {isLoading && <ShimmeringLoader className="py-4" />}
        {isError && <AlertError error={error as any} subject="获取数据库角色失败" />}
        {isSuccess && (
          <MultiSelect
            options={formattedRoles}
            value={selectedRoles}
            placeholder="如果未选择角色，默认为所有（public）角色"
            searchPlaceholder="查找角色"
            onChange={onUpdateSelectedRoles}
          />
        )}
      </div>
    </div>
  )
}

export default PolicyRoles
