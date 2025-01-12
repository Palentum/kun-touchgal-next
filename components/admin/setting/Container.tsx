import { RedirectSetting } from './RedirectSetting'
import type { AdminRedirectConfig } from '~/types/api/admin'

interface Props {
  setting: AdminRedirectConfig
}

export const AdminSetting = ({ setting }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">网站设置</h1>
      </div>

      <RedirectSetting setting={setting} />
    </div>
  )
}
