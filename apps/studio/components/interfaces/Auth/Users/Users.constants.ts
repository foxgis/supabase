import { BASE_PATH } from 'lib/constants'
import { PROVIDER_PHONE, PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'

export const PANEL_PADDING = 'px-5 py-5'

// [Joshen] Temporary fix as bulk delete will fire n requests since Auth + API do not have a bulk delete endpoint yet
export const MAX_BULK_DELETE = 20

export const PROVIDER_FILTER_OPTIONS = PROVIDERS_SCHEMAS.map((provider) => ({
  name: provider.title,
  value: 'key' in provider ? provider.key : provider.title.toLowerCase(),
  icon: `${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`,
  iconClass: provider.title === 'GitHub' ? 'dark:invert' : '',
})).concat(
  PROVIDER_PHONE.properties.SMS_PROVIDER.enum.map((x) => ({
    name: x.label,
    value: x.value,
    icon: `${BASE_PATH}/img/icons/${x.icon}`,
    iconClass: '',
  }))
)

export type UsersTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}
export type ColumnConfiguration = { id: string; width?: number }
export const USERS_TABLE_COLUMNS: UsersTableColumn[] = [
  { id: 'img', name: '', minWidth: 95, width: 95, resizable: false },
  { id: 'id', name: '用户 ID', width: 280 },
  { id: 'name', name: '名称', minWidth: 0, width: 150 },
  { id: 'email', name: '邮箱', width: 300 },
  { id: 'phone', name: '电话' },
  { id: 'providers', name: '认证服务', minWidth: 150 },
  { id: 'provider_type', name: '认证方式', minWidth: 150 },
  { id: 'created_at', name: '创建时间', width: 260 },
  { id: 'last_sign_in_at', name: '最近登录时间', width: 260 },
]
