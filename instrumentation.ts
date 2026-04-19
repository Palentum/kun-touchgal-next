export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setKUNGalgameTask } = await import('./server/cron')
    await setKUNGalgameTask()
  }
}
