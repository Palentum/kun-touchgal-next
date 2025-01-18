module.exports = {
  apps: [
    {
      name: 'kun-touchgal-next',
      port: 3000,
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      script: './.next/standalone/server.js'
    }
  ]
}
