import { Stats } from '~/components/admin/stats'
import { kunGetActions } from './actions'

export default async function Kun() {
  const stats = await kunGetActions()

  return <Stats stats={stats} />
}
