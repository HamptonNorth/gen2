import * as fs from 'fs/promises'

export const doPurge = async (gen) => {
  for (let i = 0; i < gen.dirs.length; i++) {
    let path = gen.targetRoot + '/' + gen.dirs[i]
    try {
      if (gen.dirs[i] !== 'configs') {
        await fs.rm(path, { recursive: true, force: true })
        console.log(`  ${gen.targetDir}/${gen.dirs[i]} deleted`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  try {
    await fs.rm(`${gen.targetRoot}/app.js`, { recursive: true, force: true })
    await fs.rm(`${gen.targetRoot}/server.js`, { recursive: true, force: true })
    console.log(`  ${gen.targetDir}/app.js and ${gen.targetDir}/server.js deleted`)
    await fs.rm(`${gen.targetRoot}/app.js`, { recursive: true, force: true })
    // await fs.rm(`${gen.targetRoot}/configs/routes-config.json`, { recursive: true, force: true })
    // console.log(`  ${gen.targetDir}/configs/routes-config.json deleted`)
  } catch {
    if (err) {
      console.error(err)
    }
  }
}
