export const purgeCloudflareCache = async (files: string[]) => {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.KUN_CF_CACHE_ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KUN_CF_CACHE_PURGE_API_TOKEN}`
      },
      body: JSON.stringify({ files })
    }
  )

  return { status: res.status }
}
