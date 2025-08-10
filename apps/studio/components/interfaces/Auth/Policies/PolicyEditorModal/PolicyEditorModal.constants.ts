import { PolicyTemplate } from '../PolicyTemplates/PolicyTemplates.constants'
/**
 * ----------------------------------------------------------------
 * PostgreSQL policy templates for the auth policies page
 * ----------------------------------------------------------------
 * id: Unique identifier for the monaco editor to dynamically refresh
 * templateName: As a display for a more descriptive title for the policy
 * description: Additional details about the template and how to make it yours
 * statement: SQL statement template for the policy
 *
 * name: Actual policy name that will be used in the editor
 * definition: Actual policy using expression that will be used in the editor
 * check: Actual policy with check expression that will be used in the editor
 * command: Operation to create policy for
 */

export const getGeneralPolicyTemplates = (schema: string, table: string): PolicyTemplate[] => [
  {
    id: 'policy-1',
    preview: false,
    templateName: '允许任何人读取表',
    description:
      '此策略允许所有用户通过 SELECT 操作读取您的表。',
    statement: `
create policy "Enable read access for all users"
on "${schema}"."${table}"
for select using (true);`.trim(),
    name: '允许所有用户读取表',
    definition: 'true',
    check: '',
    command: 'SELECT',
    roles: [],
  },
  {
    id: 'policy-2',
    preview: false,
    templateName: '仅允许经过身份验证的用户插入数据',
    description: '此策略仅允许经过身份验证的用户向您的表中插入数据。',
    statement: `
create policy "Enable insert for authenticated users only"
on "${schema}"."${table}"
for insert to authenticated
with check (true);`.trim(),
    name: '仅允许经过身份验证的用户插入数据',
    definition: '',
    check: 'true',
    command: 'INSERT',
    roles: ['authenticated'],
  },
  {
    id: 'policy-3',
    preview: false,
    templateName: '基于用户的 ID 允许用户删除数据',
    description:
      '此策略假定您的表有“user_id”列，只允许用户删除匹配其 ID 的行。',
    statement: `
create policy "Enable delete for users based on user_id"
on "${schema}"."${table}"
for delete using (
  (select auth.uid()) = user_id
);`.trim(),
    name: '基于 user_id 允许用户删除数据',
    definition: '(select auth.uid()) = user_id',
    check: '',
    command: 'DELETE',
    roles: [],
  },
  {
    id: 'policy-4',
    preview: false,
    templateName: '基于用户的 ID 允许用户插入数据 *',
    description:
      '此策略假定您的表有“user_id”列，只允许用户插入匹配其 ID 的行。',
    statement: `
create policy "Enable insert for users based on user_id"
on "${schema}"."${table}"
for insert with check (
  (select auth.uid()) = user_id
);`.trim(),
    name: '基于 user_id 允许用户插入数据',
    definition: '',
    check: '(select auth.uid()) = user_id',
    command: 'INSERT',
    roles: [],
  },
  {
    id: 'policy-5',
    preview: true,
    name: '使用表关联的策略',
    templateName: '使用表关联的策略',
    description: `
跨表查询以构建更高级的 RLS 规则

假定有两张表，分别称为 \`teams\` 和 \`members\`，您可以在策略中查询这两个表以控制对 members 表的访问权限。`,
    statement: `
create policy "Members can update team details if they belong to the team"
on teams for update using (
  (select auth.uid()) in (
    select user_id from members where team_id = id
  )
);
`.trim(),
    definition: `(select auth.uid()) in (select user_id from members where team_id = id)`,
    check: '',
    command: 'UPDATE',
    roles: [],
  },
  {
    id: 'policy-6',
    preview: true,
    templateName: '使用 security definer 函数的策略',
    description: `
在多对多的表关系中很有用，您希望限制对关联表的访问权限。

假定有两张表，分别称为 \`teams\` 和 \`members\`，您可以在策略中使用 security definer 函数来控制对 members 表的访问权限。`.trim(),
    statement: `
create or replace function get_teams_for_user(user_id uuid)
returns setof bigint as $$
  select team_id from members where user_id = $1
$$ stable language sql security definer;

create policy "Team members can update team members if they belong to the team"
on members
for all using (
  team_id in (select get_teams_for_user(auth.uid()))
);
`.trim(),
    name: '使用 security definer 函数的策略',
    definition: 'team_id in (select get_teams_for_user(auth.uid()))',
    check: '',
    command: 'ALL',
    roles: [],
  },
  {
    id: 'policy-7',
    preview: true,
    name: '实现 TTL 功能的策略',
    templateName: '实现 TTL 功能的策略',
    description: `
实现类似于 Instagram storie 或 Snapchat 中的消息在一天后过期的 TTL 功能。

表中的行仅在创建后 24 小时内可用。`,
    statement: `
create policy "Stories are live for a day"
on "${schema}"."${table}"
for select using (
  created_at > (current_timestamp - interval '1 day')
);
`.trim(),
    definition: `created_at > (current_timestamp - interval '1 day')`,
    check: '',
    command: 'SELECT',
    roles: [],
  },
  {
    id: 'policy-8',
    preview: false,
    templateName: '仅允许用户查看他们自己的数据',
    description: '限制用户仅查看自己的数据。',
    statement: `
create policy "Enable users to view their own data only"
on "${schema}"."${table}"
for select
to authenticated
using (
  (select auth.uid()) = user_id
);`.trim(),
    name: '仅允许用户查看他们自己的数据',
    definition: '(select auth.uid()) = user_id',
    check: '',
    command: 'SELECT',
    roles: ['authenticated'],
  },
]

export const getRealtimePolicyTemplates = (): PolicyTemplate[] => {
  const results = [
    {
      id: 'policy-broadcast-1',
      preview: false,
      templateName: '仅允许通过身份验证的用户监听广播消息',
      description: '此策略仅允许通过身份验证的用户监听广播消息。',
      statement: `
create policy  "Allow listening for broadcasts for authenticated users only"
on realtime.messages for select
to authenticated
using ( realtime.messages.extension = 'broadcast' );`.trim(),
      name: '仅允许通过身份验证的用户监听广播消息',
      definition: "realtime.messages.extension = 'broadcast'",
      check: '',
      command: 'SELECT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-broadcast-2',
      preview: false,
      templateName: '仅允许通过身份验证的用户推送广播消息',
      description: '此策略仅允许通过身份验证的用户推送广播消息。',
      statement: `
create policy "Allow pushing broadcasts for authenticated users only"
ON realtime.messages for insert
TO authenticated
with check ( realtime.messages.extension = 'broadcast' );`.trim(),
      name: '仅允许通过身份验证的用户推送广播消息',
      definition: "realtime.messages.extension = 'broadcast'",
      check: "realtime.messages.extension = 'broadcast'",
      command: 'INSERT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-broadcast-3',
      preview: false,
      templateName: '仅允许从特定频道监听广播消息',
      description: '此策略仅允许从特定频道监听广播消息。',
      statement: `
create policy "Allow listening for broadcasts from a specific channel"
on realtime.messages for select
using ( realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name' );`.trim(),
      name: '仅允许从特定频道监听广播消息',
      definition: `realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name'`,
      check: '',
      command: 'SELECT',
      roles: [],
    },
    {
      id: 'policy-broadcast-4',
      preview: false,
      templateName: '仅允许向特定频道推送广播消息',
      description: '此策略仅允许向特定频道推送广播消息。',
      statement: `
create policy "Allow pushing broadcasts to specific channel"
ON realtime.messages for insert
with check ( realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name' );`.trim(),
      name: '仅允许向特定频道推送广播消息',
      definition: `realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name'`,
      check: `realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name'`,
      command: 'INSERT',
      roles: [],
    },
    {
      id: 'policy-presences-1',
      preview: false,
      templateName: '仅允许通过身份验证的用户监听所有频道的状态同步',
      description: '此策略仅允许通过身份验证的用户监听所有频道的状态同步。',
      statement: `
create policy "Allow listening for presences on all channels for authenticated users only"
on realtime.messages for select
to authenticated
using ( realtime.messages.extension = 'presence' );`.trim(),
      name: '仅允许通过身份验证的用户监听所有频道的状态同步',
      definition: "realtime.messages.extension = 'presence'",
      check: '',
      command: 'SELECT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-presences-2',
      preview: false,
      templateName: '仅允许通过身份验证的用户向所有频道广播状态同步',
      description: '此策略仅允许通过身份验证的用户向所有频道广播状态同步。',
      statement: `
create policy "Allow broadcasting presences on all channels for authenticated users only"
ON realtime.messages for insert
TO authenticated
with check ( realtime.messages.extension = 'presence' );
  ;`.trim(),
      name: '仅允许通过身份验证的用户向所有频道广播状态同步',
      definition: "realtime.messages.extension = 'presence'",
      check: "realtime.messages.extension = 'presence'",
      command: 'INSERT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-presences-3',
      preview: false,
      templateName: '仅允许从特定频道监听状态同步',
      description: '此策略仅允许从特定频道监听状态同步。',
      statement: `
create policy "Allow listening for presences from a specific channel"
on realtime.messages for select
using ( realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name' );`.trim(),
      name: '仅允许从特定频道监听状态同步',
      definition: `realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name'`,
      check: '',
      command: 'SELECT',
      roles: [],
    },
    {
      id: 'policy-presences-4',
      preview: false,
      templateName: '向特定频道发布状态同步',
      description: '此策略允许向特定频道发布状态同步。',
      statement: `
create policy "Publish presence to a specific channel"
ON realtime.messages for insert
with check ( realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name' );
  ;`.trim(),
      name: '向特定频道发布状态同步',
      definition: `realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name'`,
      check: `realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name'`,
      command: 'INSERT',
      roles: [],
    },
  ] as PolicyTemplate[]
  return results
}

export const getQueuePolicyTemplates = (): PolicyTemplate[] => {
  return [
    {
      id: 'policy-queues-1',
      preview: false,
      templateName: 'Allow access to queue',
      statement: ``.trim(),
      name: 'Allow anon and authenticated to access messages from queue',
      description:
        'Base policy to ensure that anon and authenticated can only access appropriate rows. USING and CHECK statements will need to be adjusted accordingly',
      definition: 'true',
      check: 'true',
      command: 'ALL',
      roles: ['anon', 'authenticated'],
    },
  ]
}
