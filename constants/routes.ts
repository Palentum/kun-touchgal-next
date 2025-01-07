export interface KunBreadcrumbItem {
  key: string
  label: string
  href: string
  icon?: string
}

const keyLabelMap: Record<string, string> = {
  '/': '主页',
  '/doc': '帮助文档',
  '/admin/comment': '评论管理',
  '/admin/creator': '创作者管理',
  '/admin/galgame': 'Galgame 管理',
  '/admin/log': '管理日志',
  '/admin': '管理页面',
  '/admin/resource': '下载资源管理',
  '/admin/setting': '管理系统设置',
  '/admin/user': '用户管理',
  '/apply': '创作者申请',
  '/apply/pending': '正在申请中',
  '/apply/success': '申请成功',
  '/auth/forgot': '忘记密码',
  '/comment': '评论',
  '/edit/create': '创建 Galgame',
  '/galgame': 'Galgame',
  '/login': '登录',
  '/message/follow': '关注消息',
  '/message/notice': '通知消息',
  '/message/system': '系统消息',
  '/register': '注册',
  '/resource': '资源下载',
  '/search': '搜索',
  '/settings/user': '用户设置',
  '/tag': '补丁标签'
}

export const getKunPathLabel = (pathname: string): string => {
  for (const key in keyLabelMap) {
    const regex = new RegExp(`^${key.replace(/\[id\]/g, '\\d+')}$`)
    if (regex.test(pathname)) {
      return keyLabelMap[key]
    }
  }

  return keyLabelMap[pathname]
}

export const isPatchPath = (pathname: string): boolean => {
  return /^\/patch\/\d+/.test(pathname)
}

export const isTagPath = (pathname: string): boolean => {
  return /^\/tag\/\d+/.test(pathname)
}

export const isUserPath = (pathname: string): boolean => {
  return /^\/user\/\d+/.test(pathname)
}
