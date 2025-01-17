import { execSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runCommand = (command: string) => {
  try {
    console.log(`Running command: ${command}`)
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error(`Error running command: ${command}`)
    process.exit(1)
  }
}

runCommand('pnpm install')

runCommand('pnpx prisma db push')

const uploadsDir = path.join(__dirname, 'uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir)
}
runCommand('chmod 777 uploads')

const redirectJsonPath = path.join(__dirname, 'config', 'redirect.json')
const redirectJsonContent = {
  enabled: true,
  excludedDomains: ['touchgal.io', 'nav.kungal.com'],
  delaySeconds: 3
}

const configDir = path.dirname(redirectJsonPath)
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true })
}

writeFileSync(redirectJsonPath, JSON.stringify(redirectJsonContent, null, 2))

runCommand('chmod 777 config/redirect.json')

console.log('Deployment script executed successfully.')
