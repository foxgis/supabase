export interface SingleTheme {
  name: string
  value: string
}

export const singleThemes = [
  { name: '暗黑', value: 'dark' }, // Classic Supabase dark
  { name: '明亮', value: 'light' }, // Classic Supabase light
  { name: '深黑', value: 'classic-dark' }, // Deep Dark Supabase dark
  { name: '系统', value: 'system' }, // Classic Supabase light
]
