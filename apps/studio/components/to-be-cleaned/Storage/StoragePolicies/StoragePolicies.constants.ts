/**
 * ----------------------------------------------------------------
 * PostgreSQL policy templates for the storage dashboard
 * ----------------------------------------------------------------
 * id: Unique identifier for the monaco editor to dynamically refresh
 * templateName: As a display for a more descriptive title for the policy
 * description: Additional details about the template and how to make it yours
 * statement: SQL statement template for the policy
 *
 * name: Actual policy name that will be used in the editor
 * definition: Actual policy definition that will be used in the editor
 * allowedOperations: Operations to create policies for
 */

export const STORAGE_POLICY_TEMPLATES = [
  {
    id: 'policy-1',
    templateName: '允许匿名用户访问 public 文件夹中的 JPG 图像',
    description:
      '此策略使用了原生 PostgreSQL 函数、auth 和 storage 模式中的函数',
    name: '授予匿名用户对特定文件夹中 JPG 图像的访问权限',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
  -- 限制 bucket
  bucket_id = {bucket_name}
  -- 只允许访问 jpg 文件
  AND storage."extension"(name) = 'jpg'
  -- 在 public 文件夹中
  AND LOWER((storage.foldername(name))[1]) = 'public'
  -- 匿名用户
  AND auth.role() = 'anon'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND storage."extension"(name) = 'jpg' AND LOWER((storage.foldername(name))[1]) = 'public' AND auth.role() = 'anon'`,
    allowedOperations: [],
  },
  {
    id: 'policy-2',
    templateName: '允许用户仅可访问以自己的 uid 命名的顶层文件夹',
    description:
      '例如，uid 为 d7bed83c-44a0-4a4f-925f-efc384ea1e50 的用户可以访问位于 d7bed83c-44a0-4a4f-925f-efc384ea1e50 文件夹下的任何内容',
    name: '授予用户对自己的文件夹的访问权限',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
    -- 限制存储桶
    bucket_id = {bucket_name}
    and (select auth.uid()::text) = (storage.foldername(name))[1]
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND (select auth.uid()::text) = (storage.foldername(name))[1]`,
    allowedOperations: [],
  },
  {
    id: 'policy-3',
    templateName: '仅允许认证的用户访问一个文件夹',
    description:
      '此策略仅允许认证的用户访问一个文件夹（如private）',
    name: '授予认证的用户对文件夹的访问权限',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
    -- 限制存储桶
    bucket_id = {bucket_name}
    AND (storage.foldername(name))[1] = 'private'
    AND (select auth.role()) = 'authenticated'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND (storage.foldername(name))[1] = 'private' AND auth.role() = 'authenticated'`,
    allowedOperations: [],
  },
  {
    id: 'policy-4',
    templateName: '仅给特定用户授予对嵌套文件夹 admin/assets 的访问权限',
    description:
      '此策略仅允许特定的用户访问嵌套文件夹 admin/assets',
    name: '授予特定用户对特定文件夹的访问权限',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
    -- 限制存储桶
    bucket_id = {bucket_name}
    AND (storage.foldername(name))[1] = 'admin' AND (storage.foldername(name))[2] = 'assets'
    AND (select auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND (storage.foldername(name))[1] = 'admin' AND (storage.foldername(name))[2] = 'assets' AND (select auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'`,
    allowedOperations: [],
  },
  {
    id: 'policy-5',
    templateName: '授予特定用户对特定文件的访问权限',
    description: '此策略授予特定用户对特定文件的访问权限',
    name: '授予特定用户对特定文件的访问权限',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
	  -- 限制存储桶
    bucket_id = {bucket_name}
    AND name = 'admin/assets/Costa Rican Frog.jpg'
    AND (select auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND name = 'admin/assets/Costa Rican Frog.jpg' AND (select auth.uid()::text) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'`,
    allowedOperations: [],
  },
]
