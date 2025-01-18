import path from 'path'
import { existsSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'

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
