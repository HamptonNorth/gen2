import { singleDelete1, singleDelete2, readFile, writeFile } from '../utils/index.js'
import { doGenerateDocs } from './docsGeneration.js'
import { doGenerateTests } from './testsGeneration.js'
import * as fs from 'fs/promises'

export const doDeleteRoute = async (thisRoute, gen) => {
  let routeName = thisRoute.name
  let method = thisRoute.method
  let methodLowerCase = method.toLowerCase()
  let methodWithCapital = methodLowerCase[0].toUpperCase() + methodLowerCase.substring(1)
  let targetRootDir = gen.targetRoot
  let route = thisRoute.name.toLowerCase()
  let expressRoute = route

  // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
  // parameter pass type - none | url | querystring
  let parameterType = 'none'
  let message = ''
  let passedObjectKeys = ''

  // check for URL route parameter - anything after '/:'
  if (routeName.indexOf('/:') !== -1) {
    route = routeName.substring(0, routeName.indexOf('/:'))
    parameterType = 'url'
    // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
    message = ' route parameter: ' + routeName.substring(routeName.indexOf('/:'))
    // build object keys to pass from controller layer to service and database layers
    // e.g route of /item/:branch/:bin gives object keys: branch, bin
    passedObjectKeys = parseObjectKeys(method, routeName.substring(routeName.indexOf('/:')), parameterType)
  }

  // check for URL query string paraneters
  if (routeName.indexOf('?') !== -1) {
    route = routeName.substring(0, routeName.indexOf('?'))
    expressRoute = route
    parameterType = 'queryString'
    message = ' URL query parameter: ' + routeName.substring(routeName.indexOf('?'))
    // build object keys to pass from controller layer to service and database layers
    // e.g route of /search?name=Jones&postcode=CH1 gives object keys: name, postcode
    passedObjectKeys = parseObjectKeys(method, routeName.substring(routeName.indexOf('?')), parameterType)
  }
  if (routeName.indexOf('/:') === -1 && routeName.indexOf('?') === -1) {
    message = ' none'
  }
  if (routeName.indexOf('/:') !== -1 && routeName.indexOf('?') !== -1) {
    console.log(
      'ERROR - route has both route parameter and URL query parameter - not supported! Check the .env file setting'
    )
    process.exit(1)
  }

  if (method === 'POST') {
    parameterType = 'postBody'
    // passedObjectKeys = parseObjectKeys(method, thisRoute.requestbody[0], parameterType)
    passedObjectKeys = Object.keys(thisRoute.requestbody[0]).join(', ')
    message = ' with POST body keys of: ' + passedObjectKeys
  }
  if (method === 'PUT') {
    parameterType = 'postBody'
    // passedObjectKeys = parseObjectKeys(method, thisRoute.requestbody[0], parameterType)
    passedObjectKeys = Object.keys(thisRoute.requestbody[0]).join(', ')
    message = ' with PUT body keys of: ' + passedObjectKeys
  }
  if (method === 'DELETE') {
    parameterType = 'postBody'
    // passedObjectKeys = parseObjectKeys(method, thisRoute.requestbody[0], parameterType)
    passedObjectKeys = Object.keys(thisRoute.requestbody[0]).join(', ')
    message = ' with DELETE body keys of: ' + passedObjectKeys
  }
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)

  // **************************************************************************************************

  // WARNING - the singleDelete1() and singleDelete2() WILL FAIL IF any spaces between routeFind1/2 and newline
  //  check in routeGeneration steps 1,2 and 6
  //
  // *** Step 1 - delete express route statements from routes/index.js *******************************************
  let routeFind1 = `const {  ${route}  } = require('../controllers')`

  let routeFind2 = `router.${methodLowerCase}('/${expressRoute.toLowerCase()}', ${route}.${methodLowerCase}${routeWithCapital})`

  // console.log('routeFind1: ', routeFind1, ' routeFind2: ', routeFind2)

  let content = await readFile(targetRootDir + '/routes/index.js')
  // check if route already exists
  if (content.indexOf('/' + thisRoute.name.toLowerCase()) !== -1) {
    // console.log('Route exists \nroutes/index.js ', 'routeFind1: ', routeFind1, ' routeFind2: ', routeFind2)
    // }
  }

  let result1 = await singleDelete1(routeFind1, content)
  let result2 = await singleDelete2(routeFind2, result1)

  await writeFile(1, targetRootDir + '/routes/index.js', result2)

  // *** Step 2 - delete route fromcontrollers/index.js***********************************************
  routeFind1 = `const ${route} = require('./${route}-${methodLowerCase}.controller')`
  routeFind2 = `${route},`

  content = await readFile(targetRootDir + '/controllers/index.js')
  result1 = await singleDelete1(routeFind1, content)
  result2 = await singleDelete2(routeFind2, result1)
  await writeFile(2, targetRootDir + '/controllers/index.js', result2)

  // *** Step 3 - delete route from db/index.js *******************************************************
  routeFind1 = `const { ${route}Db } = require('./${route}-${methodLowerCase}.db')`
  routeFind2 = `${route}Db,`
  // console.log('db/index.js ', 'routeFind1: ', routeFind1, ' routeFind2: ', routeFind2)
  content = await readFile(targetRootDir + '/db/index.js')
  result1 = await singleDelete1(routeFind1, content)
  result2 = await singleDelete2(routeFind2, result1)
  await writeFile(3, targetRootDir + '/db/index.js', result2)

  // *** Step 4 - delete controller and db js files *****************************
  let controllerFileName = targetRootDir + `/controllers/${route}-${methodLowerCase}.controller.js`
  let dbFileName = targetRootDir + `/db/${route}-${methodLowerCase}.db.js`
  await fs.rm(controllerFileName, { recursive: true, force: true })
  await fs.rm(dbFileName, { recursive: true, force: true })
  console.log('Route deleted: ', route)
  return

  function parseObjectKeys(method, s, parameterType) {
    if (parameterType === 'url') {
      return s.substring(2).split('/:').join()
    } else if (parameterType === 'queryString') {
      let a = s.substring(1).split('&')
      for (let i = 0; i < a.length; i++) {
        a[i] = a[i].substring(0, a[i].indexOf('='))
      }
      return a.join()
    } else if (parameterType === 'postBody') {
    } else {
      return ''
    }
  }
}
