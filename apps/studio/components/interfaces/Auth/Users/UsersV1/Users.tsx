import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RefreshCw, Search, X } from 'lucide-react'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import APIDocsButton from 'components/ui/APIDocsButton'
import NoPermission from 'components/ui/NoPermission'
import { authKeys } from 'data/auth/keys'
import { useUsersQuery } from 'data/auth/users-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Button, Input, Listbox } from 'ui'
import AddUserDropdown from '../AddUserDropdown'
import { UsersList } from './UsersList'

export const Users = () => {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterKeywords, setFilterKeywords] = useState('')
  type Filter = 'verified' | 'unverified' | 'anonymous'
  const [filter, setFilter] = useState<Filter>()

  const canReadUsers = useCheckPermissions(PermissionAction.TENANT_SQL_SELECT, 'auth.users')
  const isPermissionsLoaded = usePermissionsLoaded()

  const {
    data,
    isLoading,
    isSuccess,
    refetch,
    isRefetching,
    error,
    isPreviousData: isFetchingNextPage,
  } = useUsersQuery(
    {
      projectRef,
      page,
      keywords: filterKeywords,
      filter,
      connectionString: project?.connectionString!,
    },
    {
      keepPreviousData: true,
      onSuccess(data) {
        if (data.users.length <= 0 && data.total > 0) {
          queryClient.removeQueries(
            authKeys.users(projectRef, { page, keywords: filterKeywords, filter })
          )

          setPage((prev) => prev - 1)
        }
      },
    }
  )

  function onVerifiedFilterChange(val: Filter) {
    setFilter(val)
  }

  function clearSearch() {
    setSearch('')
    setFilterKeywords('')
    setFilter(undefined)
  }

  return (
    <div>
      <div className="justify-between px-6 pt-6 pb-2 md:flex">
        <div className="relative flex space-x-4">
          <Input
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.keyCode == 13) setFilterKeywords(search)
            }}
            className="min-w-[300px]"
            name="email"
            id="email"
            placeholder="通过电子邮件、电话号码或 UID 搜索"
            icon={<Search size={14} />}
            actions={[
              search && (
                <Button size="tiny" type="text" icon={<X />} onClick={() => clearSearch()} />
              ),
            ]}
          />
          <Listbox
            size="small"
            value={filter}
            onChange={onVerifiedFilterChange}
            name="verified"
            id="verified"
            className="w-[200px]"
          >
            <Listbox.Option label="所有用户" value="">
              所有用户
            </Listbox.Option>
            <Listbox.Option label="完成验证的用户" value="verified">
              完成验证的用户
            </Listbox.Option>
            <Listbox.Option label="未验证的用户" value="unverified">
              未验证的用户
            </Listbox.Option>
            <Listbox.Option label="匿名用户" value="anonymous">
              匿名用户
            </Listbox.Option>
          </Listbox>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
          <Button
            size="tiny"
            icon={<RefreshCw />}
            type="default"
            loading={isRefetching && !isFetchingNextPage}
            onClick={() => refetch()}
          >
            重新加载
          </Button>
          <AddUserDropdown projectKpsVersion={project?.kpsVersion} />
        </div>
      </div>
      <section className="thin-scrollbars mt-4 overflow-visible px-6">
        <div className="section-block--body relative overflow-x-auto rounded">
          <div className="inline-block min-w-full align-middle">
            {isPermissionsLoaded && !canReadUsers ? (
              <div className="mt-8">
                <NoPermission isFullPage resourceText="访问项目的用户" />
              </div>
            ) : (
              <UsersList
                page={page}
                setPage={setPage}
                keywords={filterKeywords}
                total={data?.total ?? 0}
                users={data?.users ?? []}
                isLoading={isLoading}
                isSuccess={isSuccess}
                isFetchingNextPage={isFetchingNextPage}
                error={error}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
