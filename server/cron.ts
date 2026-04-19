import { flushPatchViewsTask } from './tasks/flushPatchViewsTask'
import { resetDailyTask } from './tasks/resetDailyTask'
import { setCleanupTask } from './tasks/setCleanupTask'
import { syncKunPatchTypeTask } from './tasks/syncKunPatchTypeTask'

export const setKUNGalgameTask = () => {
  resetDailyTask
  setCleanupTask
  syncKunPatchTypeTask
  flushPatchViewsTask
}
