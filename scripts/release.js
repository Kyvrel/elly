#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch (error) {
    console.error(`Error executing command: ${command}`)
    console.error(error.message)
    process.exit(1)
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'))
  return packageJson.version
}

function bumpVersion(type = 'patch') {
  const currentVersion = getCurrentVersion()
  const parts = currentVersion.split('.').map(Number)

  if (type === 'major') {
    parts[0]++
    parts[1] = 0
    parts[2] = 0
  } else if (type === 'minor') {
    parts[1]++
    parts[2] = 0
  } else {
    parts[2]++
  }

  return parts.join('.')
}

function updatePackageVersion(version) {
  const packageJsonPath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  packageJson.version = version
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
}

function main() {
  const args = process.argv.slice(2)
  const versionType = args[0] || 'patch' // major, minor, or patch

  // Check if working directory is clean
  try {
    const status = exec('git status --porcelain')
    if (status) {
      console.error(
        'Error: Working directory is not clean. Please commit or stash your changes first.'
      )
      process.exit(1)
    }
  } catch (error) {
    console.error('Error checking git status')
    process.exit(1)
  }

  // Get current branch
  const currentBranch = exec('git rev-parse --abbrev-ref HEAD')

  // Bump version
  const newVersion = bumpVersion(versionType)
  console.log(`Bumping version to ${newVersion}`)

  // Update package.json
  updatePackageVersion(newVersion)

  // Commit version bump
  exec('git add package.json')
  exec(`git commit -m "chore: bump version to ${newVersion}"`)

  // Create git tag
  const tag = `v${newVersion}`
  exec(`git tag ${tag}`)

  console.log(`✅ Created tag ${tag}`)
  console.log('\nNext steps:')
  console.log(`1. Push the changes: git push origin ${currentBranch}`)
  console.log(`2. Push the tag: git push origin ${tag}`)
  console.log(`3. Trigger the release workflow on GitHub Actions with:`)
  console.log(`   - git_ref: ${tag}`)
  console.log(`   - version: ${tag}`)
  console.log('\nOr run:')
  console.log(`git push origin ${currentBranch} && git push origin ${tag}`)
}

main()
