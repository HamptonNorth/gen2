import { writeFile } from '../utils/index.js'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import { doValidateRouteConfigs } from './validateRoutesConfigs.js'
export const doGenerateScaffold = async (gen) => {
  // console.log('gen:', gen)

  if (existsSync(gen.targetRoot + '/app.js')) {
    console.log('app.js exists. Use --purge first before scaffolding new project')
    process.exit(1)
  }

  // Create all directories ----------------------------------------------------------
  for (let i = 0; i < gen.dirs.length; i++) {
    let path = gen.targetRoot + '/' + gen.dirs[i]

    await fs.mkdir(path),
      (err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
      }
    console.log(' ' + gen.targetDir + '/' + gen.dirs[i] + ' directory created')
  }

  // Step 1 - generate app.js skeleton code ----------------------------------------------------------
  let appJSCode = `const express = require('express')
const bodyParser = require('body-parser')
try{
  require('multer')
}catch{
  console.log('*** ERROR *** - install multer, npm i multer')
  process.exit(1)
}
const app = express()
const cors = require('cors')
const routes = require('./routes')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
var corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.get('/', (req, res) => res.status(200).send('Generated REST API app is working'))
app.use('/api', routes)

module.exports =  app
`
  await writeFile(1, gen.targetRoot + '/app.js', appJSCode)

  // Step 2 - generate server.js skeleton code ----------------------------------------------------------
  process.exitCode = 1
  let serverJSCode = `const app = require('./app')

app.listen(${gen.port}, () => {
  console.log('Generated REST API server app listening on port ${gen.port}')
})
`
  await writeFile(2, gen.targetRoot + '/server.js', serverJSCode)

  // Step 3 - create skeleton code for routes/index.js ----------------------------------------------------------
  let routesIndexJSCode = `const express = require('express')
const multer = require('multer')
const uploadImage = multer({ limits: { fieldSize: 25 * 1024 * 1024 } })
// server always includes POST route /upload
const { upload } = require('../controllers')

//@insert1
const router = express.Router()
//@insert2
router.post('/upload', uploadImage.single(), upload.postUpload)
module.exports = router`
  writeFile(3, gen.targetRoot + '/routes/index.js', routesIndexJSCode)

  // Step 4 - create skeleton code for contollers/index.js ----------------------------------------------------------
  let controllersIndexJSCode = `
const upload = require('./upload-post.controller')

//@insert1

module.exports = {
upload,
    //@insert2
  }`
  await writeFile(4, gen.targetRoot + '/controllers/index.js', controllersIndexJSCode)

  // Step 5 - create skeleton code for services/index.js ----------- commented out - v2 has no service layer -------
  //   let servicesIndexJSCode = `
  // //@insert1

  // module.exports = {
  //     //@insert2
  //   }`
  //   await writeFile(5, gen.targetRoot + '/services/index.js', servicesIndexJSCode)

  // Step 6 - create skeleton code for db/index.js ----------------------------------------------------------
  let dbIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`
  writeFile(6, gen.targetRoot + '/db/index.js', dbIndexJSCode)

  //  Step 7 - db config /configs/dbconfigs.js file ----------------------------------------------------------
  let dbConfigJSCode = ''
  if (process.env.DATABASEPROVIDER === 'MYSQL') {
    dbConfigJSCode = `module.exports = {
        HOST: '${process.env.DATABASEHOST}',
        USER: '${process.env.DATABASEUSER}',
        PASSWORD: 'set_password_here',
        DB: '${process.env.DATABASENAME}',
        WAITFORCONNECTIONS: '${process.env.DATABASEWAITFORCONNECTIONS}',
        CONNECTIONLIMIT: '${process.env.DATABASECONNECTIONLIMIT}',
        QUEUELIMIT:'${process.env.DATABASEQUEUELIMIT}',
        
      }
      `
  } else {
    console.log('ERROR - invalid DB provider! - Check the .env file setting ')
  }

  if (!existsSync(gen.targetRoot + '/configs/dbconfig.js')) {
    console.log(gen.targetRoot + '/configs/dbconfig.js' + ' does not exist')
    await writeFile(7, gen.targetRoot + '/configs/dbconfig.js', dbConfigJSCode)
  }

  // Step 8 - create individual db connection /db/db.js ----------------------------------------------------------
  let dbDbJSCode = `
const mysql = require('mysql2')
const dbConfig = require('../configs/dbconfig.js')

// Create a connection to the database
const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
})

// open the MySQL connection
connection.connect((error) => {
  if (error) {
    console.log('******** Error connecting to MySQL single connection ', error.sqlMessage, ' ********')
    console.log('    **** Reminder - MySQL setting in file /configs/db.js')
  } else {
  console.log('Successfully connected to the database (new connection):', dbConfig.DB)
  }
})

module.exports = connection
`
  await writeFile(8, gen.targetRoot + '/db/db.js', dbDbJSCode)

  // Step 9 - create pooled db connection /db/db-pool.js ----------------------------------------------------------
  let dbPoolDbJSCode = `
 const mysql = require('mysql2')
 const dbConfig = require('../configs/dbconfig.js')
 
 // Create a connection to the database
 const pool = mysql.createPool({
   host: dbConfig.HOST,
   user: dbConfig.USER,
   password: dbConfig.PASSWORD,
   database: dbConfig.DB,
   waitForConnections: dbConfig.WAITFORCONNECTIONS,
  connectionLimit: dbConfig.CONNECTIONLIMIT,
  queueLimit: dbConfig.QUEUELIMIT,
 })
 
 // open the MySQL pool 
 pool.getConnection((error, connection) => {
   if (error) {
     console.log('******** Error connecting to MySQL ', error.sqlMessage, ' ********')
     console.log('    **** Reminder - MySQL setting in file /configs/db.js')
   } else {
    pool.releaseConnection(connection)
   console.log('Successfully connected to the database (connection pool):', dbConfig.DB)
   }
 })
 
 module.exports = pool
 `
  await writeFile(9, gen.targetRoot + '/db/db-pool.js', dbPoolDbJSCode)

  // Step 10 - create skeleton code for api-tests.test.js ----------------------------------------------------------
  let testScaffoldJSCode = `
  const request = require('supertest')
  const app = require('../app')
  const pool = require('../db/db-pool')

  beforeAll(() => {})

    //@insert1

  afterAll(() => {
  pool.end()
  })
`
  writeFile(10, gen.targetRoot + '/tests/api-tests.test.js', testScaffoldJSCode)

  // Step 11 - create skeleton code for docs/api.docs.md ----------------------------------------------------------
  let docsMDCode = `# ${process.env.APPDIR} server.js API docs
 ${process.env.SERVERDESC}
  <br><br>
  //@insert1
  `
  await writeFile(11, gen.targetRoot + '/docs/API.docs.md', docsMDCode)

  writeFile(10, gen.targetRoot + '/tests/api-tests.test.js', testScaffoldJSCode)

  // Step 12 - create upload-post-controller.js for fixed /upload POST route ---------------------------------------
  let uploadPostControllerCode = `

const fs = require('fs')

const postUpload = async (req, res, next) => {
  const file = req.body.file
  const file_name = req.body.file_name
  const r = saveFile(file, file_name)
  if (r) {
    return res.end('File uploaded successfully')
  } else {
    return res.end('Error Uploading File')
  }
}

async function saveFile(file, file_name) {
  let base64Data = file.replace(/^data:image\\/(jpeg;base64|png;base64|webp;base64),/, '')

  fs.writeFile('./content/media/uploads/' + file_name, base64Data, 'base64', function (err) {
    if (err) {
      console.log(err)
      return false
    } else {
      return true
    }
  })
}
module.exports = {
  postUpload,
}

  `
  await writeFile(12, gen.targetRoot + '/controllers/upload-post.controller.js', uploadPostControllerCode)

  console.log(
    '\nGenerating skeleton files for app: /' +
      gen.targetDir +
      ' completed successfully ------------------------------------'
  )
}
