const path = require('path')

module.exports = {
  apps: [
    {
      name: 'touchgal-next',
      port: 3000,
      cwd: path.join(__dirname),
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      script: './.next/standalone/server.js'
    }
  ]
}
