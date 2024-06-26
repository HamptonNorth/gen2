import dotenv from 'dotenv'
dotenv.config()

import * as fs from 'fs/promises'
import { readFileSync, existsSync } from 'fs'

import { doPurge } from './src/setup.js'
import { doGenerateScaffold } from './src/scaffoldGeneration.js'
import { doGenerateRoute } from './src/routeGeneration.js'
import { doDeleteRoute } from './src/deleteRoutes.js'
import { doValidateRouteConfigs } from './src/validateRoutesConfigs.js'
// // const getRoutesGeneration = require('./src/getRoutesGeneration')
// const getRoutesGeneration = require('./src/getRoutesGenerationAwait')
import { dotest_APIExport } from './src/testAPIExport.js'
// const { exit } = require('node:process')

// process command line options

const scaffold = process.argv.indexOf('--scaffold') > -1 ? true : false
const route = process.argv.indexOf('--route') > -1 ? true : false
// const docs = process.argv.indexOf('--docs') > -1 ? true : false
const help = process.argv.indexOf('--help') > -1 ? true : false
const version = process.argv.indexOf('--version') > -1 ? true : false
const purge = process.argv.indexOf('--purge') > -1 ? true : false
const validate = process.argv.indexOf('--validate') > -1 ? true : false
const deleteRoute = process.argv.indexOf('--delete_route') > -1 ? true : false
const test_APIExport = process.argv.indexOf('--test_API_export') > -1 ? true : false

// must be one of skeleton, route, docs, help or version
if (!scaffold && !route && !help && !version && !purge && !validate && !deleteRoute && !test_APIExport) {
  commandLineHelp('no option set or option is invalid')
}

let gen = {}

gen.port = process.env.PORT
gen.targetDir = process.env.APPDIR
gen.targetRoot = process.env.APPPATH + process.env.APPDIR
// gen.dirs = ['configs', 'controllers', 'db', 'docs', 'routes', 'services', 'tests']

// do not speicify 'configs' in gen.dirs array. If /configs does not exist it is always created in scaffold generation
gen.dirs = ['controllers', 'db', 'docs', 'routes', 'tests']

if (purge) {
  console.log('Deleting all existing directories and content: ')
  doPurge(gen)
  // process.exit(1)
}

if (scaffold) {
  console.log('Generating scaffold dir/files for app: /' + gen.targetDir)
  doGenerateScaffold(gen)
}

// if (docs) {
//   console.log('Generating API documentation - stub')
// }

if (help) {
  commandLineHelp('')
}

if (version) {
  let package_json = JSON.parse(readFileSync('./package.json', 'utf8'))
  console.log('gen version =', package_json.version)
  console.log('node version =', process.versions.node)
  process.exit(1)
}

if (validate) {
  console.log('\n' + (await doValidateRouteConfigs()))
}

// Checks for --route and if it has a routeID [string] and routeID is valid
// --route 2            valid & gets single route definition with id = 1
// --route 1,2,3,5-8    valid and expands to 1,2,3,4,5,6,7,8
// -- route all         get all ids from the routes-config to auto build the routeID string
if (route) {
  const routeIndex = process.argv.indexOf('--route')
  let routeArg
  let commaListRouteArg

  if (routeIndex > -1) {
    // Retrieve the value after --route
    routeArg = process.argv[3]
    // console.log('--route arg passed:', routeArg)
    if (typeof routeArg === 'undefined') {
      commandLineHelp('route option set but no route id provided')
    }
    if (typeof process.argv[4] === 'string') {
      commandLineHelp('route option set but too many arguements (hint: check for spaces e.g --route 1, 3)')
    }
    if (routeArg.slice(-1) === ',') {
      commandLineHelp('route option set but arguement string has trailing comma or an embedded space')
    }

    if (routeArg.toLowerCase() === 'all') {
      // if routeArg contains range(s) expand to comma seprated list
      console.log('all routes set')
      await idsFromFile().then((commaListRouteArg) => {
        // console.log('commaListRouteArg', commaListRouteArg)
        genRoutes(commaListRouteArg)
        if (typeof commaListRouteArg.length == 0) {
          commandLineHelp('getting array of ids from config file failed')
        }
      })
    } else {
      // if routeArg contains range(s) expand to comma seprated list
      commaListRouteArg = await expandRange(routeArg)
      await genRoutes(commaListRouteArg)
      // console.log(
      //   'commaListRouteArg:',
      //   commaListRouteArg,
      //   'typeof:',
      //   typeof commaListRouteArg,
      //   'length:',
      //   commaListRouteArg.length,
      //   'is array?:',
      //   Array.isArray(commaListRouteArg)
      // )
    }
  }
}

if (deleteRoute) {
  const deleteRouteIndex = process.argv.indexOf('--delete_route')
  let deleteRouteArg
  let commaListDeleteRouteArg

  if (deleteRouteIndex > -1) {
    // Retrieve the value after --route
    deleteRouteArg = process.argv[3]
    // console.log('--route arg passed:', routeArg)
    if (typeof deleteRouteArg === 'undefined') {
      commandLineHelp('delete_route option set but no route id provided')
    }
    if (typeof process.argv[4] === 'string') {
      commandLineHelp('delete_route option set but too many arguements (hint: check for spaces e.g --route 1, 3)')
    }
    if (deleteRouteArg.slice(-1) === ',') {
      commandLineHelp('delete_route option set but arguement string has trailing comma or an embedded space')
    }

    if (deleteRouteArg.toLowerCase() === 'all') {
      // if routeArg contains range(s) expand to comma seprated list
      console.log('all delete_routes set')
      await idsFromFile().then((commaListDeleteRouteArg) => {
        // console.log('commaListRouteArg', commaListRouteArg)
        delRoutes(commaListDeleteRouteArg)
        if (typeof commaListDeleteRouteArg.length == 0) {
          commandLineHelp('getting array of ids from config file failed')
        }
      })
    } else {
      // if routeArg contains range(s) expand to comma seprated list
      commaListDeleteRouteArg = await expandRange(deleteRouteArg)
      await delRoutes(commaListDeleteRouteArg)
      // console.log(
      //   'commaListRouteArg:',
      //   commaListRouteArg,
      //   'typeof:',
      //   typeof commaListRouteArg,
      //   'length:',
      //   commaListRouteArg.length,
      //   'is array?:',
      //   Array.isArray(commaListRouteArg)
      // )
    }
  }
}

if (test_APIExport) {
  console.log('test_API_export result: ', await dotest_APIExport(gen))
}

async function idsFromFile() {
  let path = gen.targetRoot + '/configs/routes-config.json'
  if (existsSync(path)) {
    let allIds = []
    const r = JSON.parse(
      readFileSync(path, {
        encoding: 'utf8',
        flag: 'r',
      })
    )
    r.forEach(function (thisRoute) {
      // console.log('this id: ', thisRoute.id)
      allIds.push(thisRoute.id)
    })
    return allIds
  } else {
    console.log('ERROR - failed to read ', path)
  }
}

async function genRoutes(commaListRouteArg, method) {
  console.log('------------------------------------------')
  console.log('Generating routes for configuration id(s):', commaListRouteArg.toString())
  console.log('Gen2')
  console.log('---\n')
  // check for duplicates
  let t = Array.from(new Set(commaListRouteArg))
  if (commaListRouteArg.length !== t.length) {
    commandLineHelp('resulting array of routes contained duplicates')
  }
  for (let i = 0; i < commaListRouteArg.length; i++) {
    let thisRoute = await getRouteDef(commaListRouteArg[i])
    if (thisRoute.length === 0) {
      console.log('Error - route does not exist!', commaListRouteArg[i])
    } else {
      // Generate this route
      if (
        thisRoute[0].method === 'GET' ||
        thisRoute[0].method === 'POST' ||
        thisRoute[0].method === 'PUT' ||
        thisRoute[0].method === 'DELETE'
      ) {
        await doGenerateRoute(thisRoute[0], gen)
      } else {
        console.log('Error - invalid method!', thisRoute[0].method)
      }
    }
  }
  console.log('\n---\nRoute generation done')
}

async function delRoutes(commaListRouteArg, method) {
  console.log('------------------------------------------')
  console.log('Deleting routes for configuration id(s):', commaListRouteArg.toString())
  console.log('Gen2')
  console.log('---\n')
  // check for duplicates
  let t = Array.from(new Set(commaListRouteArg))
  if (commaListRouteArg.length !== t.length) {
    commandLineHelp('resulting array of routes contained duplicates')
  }
  for (let i = 0; i < commaListRouteArg.length; i++) {
    let thisRoute = await getRouteDef(commaListRouteArg[i])
    if (thisRoute.length === 0) {
      console.log('Error - route does not exist!', commaListRouteArg[i])
    } else {
      // Generate this route
      if (
        thisRoute[0].method === 'GET' ||
        thisRoute[0].method === 'POST' ||
        thisRoute[0].method === 'PUT' ||
        thisRoute[0].method === 'DELETE'
      ) {
        await doDeleteRoute(thisRoute[0], gen)
      } else {
        console.log('Error - invalid method!', thisRoute[0].method)
      }
    }
  }
  console.log('\n---\nRoute deletion done')
}

async function expandRange(routeArg) {
  let argArray = routeArg.split(',')
  let res = []
  for (let i = 0; i < argArray.length; i++) {
    if (argArray[i].indexOf('-') === -1) {
      res.push(parseInt(argArray[i]))
    } else {
      let range = argArray[i].split('-')
      let x = 0
      for (let n = parseInt(range[0]); n < parseInt(range[1]) + 1; n++) {
        res.push(parseInt(n))
        x++
      }
      if (x === 0) {
        commandLineHelp("range expansion error (hint: check for 'to' > 'from' e.g. 5-3)")
      }
    }
  }
  // returns array of ints
  return res
}

async function getRouteDef(id) {
  const r = await JSON.parse(
    await fs.readFile(`${process.env.APPPATH}${process.env.APPDIR}/configs/routes-config.json`, {
      encoding: 'utf8',
      flag: 'r',
    })
  )
  return await r.filter((element) => element.id === id)
}

function commandLineHelp(e) {
  let fullPath = process.env.APPPATH + process.env.APPDIR + '/configs/routes-config.json'
  console.log('\nRoutes config: \x1b[32m', fullPath + '\x1B[0m\n')
  if (e !== '') {
    console.error('\x1B[91m*** ERROR *** -', e, '\x1B[0m\n')
  }
  console.log('Provide one from the following command line options : \n')
  console.log('\t  --purge\t\t deletes all generated directories and content')
  console.log('\t  --scaffold\t\t generate directories and new boilerplate code')
  console.log('\t  --route 1\t\t add route to a scaffold by id from configs/routes-config.json')
  console.log('\t  --route 1,5-7  \t add multiple routes id = 1,5,6,7')
  console.log('\t  --delete_route 1 \t delete multiple routes id = 1,5,6,7')
  console.log('\t  --delete_route 1,5-7\t delete multiple routes id = 1,5,6,7')
  console.log('\t  --test_API_export     \t create file with exported test_API statements')
  console.log('\t  --help     \t\t print this help')
  console.log('\t  --version  \t\t print version')
  console.log('\t  --validate  \t\t validate the route-configs.json')
  // console.log('\n')
  process.exit(1)
}
