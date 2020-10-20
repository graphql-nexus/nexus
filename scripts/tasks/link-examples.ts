/**
 * Links examples & website to local version of GraphQL Nexus
 */

import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import { allExamples } from './constants'

const execAsync = util.promisify(exec)

async function linkDir(dir: string, root: string) {
  await execAsync('yarn', {
    cwd: dir,
  })
  await execAsync('yarn link @nexus/schema', {
    cwd: dir,
  })
  await execAsync('rm -rf graphql', {
    cwd: path.join(dir, 'node_modules'),
  })
  await execAsync(`ln -s ${path.join(root, 'node_modules/graphql')} ./graphql`, {
    cwd: path.join(dir, 'node_modules'),
  })
}

const rootPath = path.join(__dirname, '../..')
export async function linkNexus() {
  const { stdout } = await execAsync('yarn link', {
    cwd: rootPath,
  })
  console.log(stdout)
}

export async function linkExamples() {
  await Promise.all(
    allExamples.map(async (exampleDir) => {
      const dir = path.join(rootPath, `examples/${exampleDir}`)
      console.log(`Linking ${exampleDir}`)
      try {
        await linkDir(dir, rootPath)
        console.log(`Finished linking ${exampleDir}`)
      } catch (e) {
        console.error(`Failed linking ${exampleDir}: ${e.message}`)
      }
    })
  )
}
