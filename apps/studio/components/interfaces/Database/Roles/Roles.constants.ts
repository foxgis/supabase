export const SUPABASE_ROLES = [
  'anon',
  'service_role',
  'authenticated',
  'authenticator',
  'dashboard_user',
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_functions_admin',
  'supabase_read_only_user',
  'supabase_realtime_admin',
  'supabase_replication_admin',
  'supabase_storage_admin',
  'pgbouncer',
  'pgsodium_keyholder',
  'pgsodium_keyiduser',
  'pgsodium_keymaker',
  'pgtle_admin',
] as const

// [Joshen] This was originally in the Roles mobx store
// Just keeping it for now in case we need to differ it from ^ SUPABASE_ROLES
export const SYSTEM_ROLES = [
  'postgres',
  'pgbouncer',
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'dashboard_user',
  'authenticator',
  'pg_database_owner',
  'pg_read_all_data',
  'pg_write_all_data',
] as const

export const ROLE_PERMISSIONS = {
  canLogin: {
    disabled: false,
    description: '用户可登录',
    grant_by_dashboard: true,
  },
  canCreateRole: {
    disabled: false,
    description: '用户可创建角色',
    grant_by_dashboard: true,
  },
  canCreateDb: {
    disabled: false,
    description: '用户可创建数据库',
    grant_by_dashboard: true,
  },
  canBypassRls: {
    disabled: false,
    description: '用户可绕过所有行级安全策略',
    grant_by_dashboard: true,
  },
  isSuperuser: {
    disabled: true,
    description: '超级用户',
    grant_by_dashboard: false,
  },
  isReplicationRole: {
    disabled: false,
    description:
      '用户可发起流式复制并将系统置于备份模式',
    grant_by_dashboard: true,
  },
} as const
