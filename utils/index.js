import * as fs from 'fs/promises'
import { existsSync } from 'fs'
export let singleReplace1 = async (routeReplacement1, content) => {
  try {
    return content.replace(/\/\/@insert1/, routeReplacement1)
  } catch (err) {
    console.log('Error in singleReplace1()', err)
  }
}
export let singleReplace2 = async (routeReplacement2, res) => {
  try {
    return res.replace(/\/\/@insert2/, routeReplacement2)
  } catch (err) {
    console.log('Error in singleReplace2()', err)
  }
}
export let singleDelete1 = async (routeFind1, content) => {
  try {
    // console.log('\n-----------------------------------------------------------------------------------------------')
    // console.log(content)
    // console.log('\n\nsingleDelete1: \n', content.replace(routeFind1 + '\n', ''))
    return content.replace(routeFind1 + '\n', '')
  } catch (err) {
    console.log('Error in singleDelete1()', err)
  }
}
export let singleDelete2 = async (routeFind2, res) => {
  try {
    // console.log('\n-----------------------------------------------------------------------------------------------')
    // console.log(res)
    // console.log('\n\nsingleDelete2: \n', res.replace(routeFind2 + '\n', ''))
    return res.replace(routeFind2 + '\n', '')
  } catch (err) {
    console.log('Error in singleDelete2()', err)
  }
}
export let readFile = async (fullPath) => {
  try {
    const data = await fs.readFile(fullPath, 'utf8')
    return data
  } catch (err) {
    console.log(`error reading ' + ${fullPath}`, err)
  }
}

export let writeFile = async (step, fullPath, content) => {
  try {
    await fs.writeFile(fullPath, content)
    return
    // console.log(`Generation step ${step} -  ${fullPath} written successfully`)
  } catch (err) {
    console.log(`error writing ' + ${fullPath}`, err)
  }
}
