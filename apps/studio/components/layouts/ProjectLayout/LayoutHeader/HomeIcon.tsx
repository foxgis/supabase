import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'

export const HomeIcon = () => {
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations } = useOrganizationsQuery()

  const router = useRouter()
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const getDefaultOrgRedirect = () => {
    if (lastVisitedOrganization) return `/org/${lastVisitedOrganization}`
    if (selectedOrganization?.slug) return `/org/${selectedOrganization.slug}`
    if (organizations && organizations.length > 0) return `/org/${organizations[0].slug}`
    return '/organizations'
  }

  const href = IS_PLATFORM ? getDefaultOrgRedirect() : '/project/default'

  return (
    <Link href={href} className="items-center justify-center flex-shrink-0 hidden md:flex">
      <Image
        alt="数据中间件"
        src={`${router.basePath}/img/dbware-logo.png`}
        width={32}
        height={32}
        className="w-[32px] h-[32px]"
      />
    </Link>
  )
}
