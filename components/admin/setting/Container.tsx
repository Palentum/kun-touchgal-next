'use client'

import { RedirectSetting } from './RedirectSetting'

export const AdminSetting = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">网站设置</h1>
      </div>

      <RedirectSetting />
    </div>
  )
}
