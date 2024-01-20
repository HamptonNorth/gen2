import * as fsp from 'fs/promises'
import * as fs from 'fs'
import readline from 'readline'
export const dotest_APIExport = async (gen) => {
  // *** step1 - delete test_API.txt file if exists ******************************************

  const test_APIFilePath = gen.targetRoot + '/docs/test_API.txt'

  try {
    await fsp.rm(test_APIFilePath, { force: true })
    console.log(test_APIFilePath, ' file deleted successfully')
  } catch (err) {
    console.error('Error deleting test_API file:', err)
  }

  // *** step2 - read/docs/API.docs.md and extract curl statements ******************************************
  let test_APIOut = ''
  let restClientOut = ''
  await processByLines(gen)

  async function processByLines(gen) {
    try {
      // const fileStream = fs.createReadStream('C:/Users/rcollins/code/aphserver/docs/API.docs.md')
      const fileStream = fs.createReadStream(gen.targetRoot + '/docs/API.docs.md')
      const rl = readline.createInterface({ input: fileStream })

      for await (const line of rl) {
        if (line.includes('curl ')) {
          test_APIOut = test_APIOut + line.trim() + ' \n'
          restClientOut = restClientOut + line.trim().replace('curl  -X', '').trim() + '\n\n### \n\n'
          // console.log(`Line from file: ${line}`)
        }
      }
    } catch (err) {
      console.log('Error reading /docs/API.docs.md file ', err)
    }
  }
  // *** step3 - write test_APIOut to new test_API.txt file ******************************************
  try {
    await fsp.writeFile(test_APIFilePath, test_APIOut + ' \n\n\n\n\n' + restClientOut)
    console.log('test_API File written successfully - path:  ', test_APIFilePath)
  } catch (err) {
    console.error('Error writing new test_API file- path:  ', test_APIFilePath, '\n err: ', err)
  }

  // console.log(test_APIOut)
  return test_APIFilePath
}
