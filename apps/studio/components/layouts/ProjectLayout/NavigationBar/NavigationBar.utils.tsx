import type { Route } from 'components/ui/ui.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import {
  Auth,
  Database,
  EdgeFunctions,
  Realtime,
  Reports,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { ICON_SIZE, ICON_STROKE_WIDTH } from './NavigationBar'
import { Settings, FileText, List, Lightbulb, Waypoints, Map } from 'lucide-react'

export const generateToolRoutes = (ref?: string, project?: Project): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  return [
    {
      key: 'editor',
      label: '数据表',
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
    },
    {
      key: 'sql',
      label: 'SQL查询',
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: !IS_PLATFORM
        ? `/project/${ref}/sql/1`
        : ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql/new`),
    },
  ]
}
export const generateProductRoutes = (
  ref?: string,
  project?: Project,
  features?: { auth?: boolean; edgeFunctions?: boolean; storage?: boolean; realtime?: boolean }
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  return [
    {
      key: 'maps',
      label: '地图服务',
      icon: <Map size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: '/pg_tileserv/index.html',
      target: '_blank',
    },
    {
      key: 'features',
      label: '要素服务',
      icon: <Waypoints size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: '/pg_featureserv/index.html',
      target: '_blank',
    },
    {
      key: 'database',
      label: '数据库',
      icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/database/tables`),
    },
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: '文件存储',
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/buckets`),
          },
        ]
      : []),
    ...(IS_PLATFORM && edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: '云函数',
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/functions`),
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: '实时消息',
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`),
          },
        ]
      : []),
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: '授权认证',
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/auth/users`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (ref?: string, project?: Project): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}/building`

  return [
    {
      key: 'advisors',
      label: '优化助手',
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/advisors/security`),
    },
    ...(IS_PLATFORM
      ? [
          {
            key: 'reports',
            label: '报告',
            icon: <Reports size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/reports`),
          },
        ]
      : []),
    {
      key: 'logs',
      label: '日志',
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/logs/explorer`),
    },
    {
      key: 'api',
      label: 'API文档',
      icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/api`),
    },
  ]
}

export const generateSettingsRoutes = (ref?: string, project?: Project): Route[] => {
  return [
    ...(IS_PLATFORM
      ? [
          {
            key: 'settings',
            label: '设置',
            icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && `/project/${ref}/settings/general`,
          },
        ]
      : []),
  ]
}
