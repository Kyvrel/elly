import { spawn } from 'node:child_process'

function run(command, args) {
  const child = spawn(command, args, { stdio: 'inherit', shell: true })
  return child
}

const children = [run('pnpm', ['run', 'devtools']), run('pnpm', ['run', 'dev:app'])]

let exiting = false
function shutdown(exitCode = 0) {
  if (exiting) return
  exiting = true

  for (const child of children) child.kill('SIGINT')

  setTimeout(() => process.exit(exitCode), 250)
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (signal) shutdown(1)
    shutdown(code ?? 1)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
