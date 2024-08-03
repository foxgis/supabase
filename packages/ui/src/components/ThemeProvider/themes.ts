export interface Theme {
  name: string
  value: string
}

export const themes = [
  { name: '系统', value: 'system' }, // Switches between dark and light
  { name: '暗黑', value: 'dark' }, // Classic Supabase dark
  { name: '深黑', value: 'classic-dark' }, // Deep Dark Supabase dark
  { name: '明亮', value: 'light' }, // Classic Supabase light
]
