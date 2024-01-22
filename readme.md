# Generator version 2

This is a generator for Node + Express + MySQL which generates Rest like API code with consistent route, controller and data layers. Supports GET, POST, PUT and DELETE methods.

The server that code is being generated for is labelled as `server_name` in this readme.

The generation is driven by a JSON routes config file (`/server_name/routes.config.json`)

The simplest possible route config with the request response returning an empty array `[]` is:

```JSON
[
  {
    id: 1,
    name: 'users',
    method: 'GET',
    requestbody: '',
    requestresponse: {
      users: [],
    },
    description: 'returns collection of users',
    notes: '',
  },
]
```

If you want to develop your tests first, you can populate the request response as this example:

```JSON
[
  {
    id: 1,
    name: 'users',
    method: 'GET',
    requestbody: '',
    requestresponse: {
      users: [
        {
          id: 1,
          email: 'rcollins@redmug.co.uk',
          role: 'superuser',
        },
        {
          id: 2,
          email: 'jsmith@redmug.dev',
          role: 'user',
        },
      ],
    },
    description: 'returns collection of users',
    notes: 'This routes gets all users.',
  },
]
```

## Using

Two parts:

- The generator code script that generates the js code in for the target app
- Server app being generated (the directory where all the generated code gets written)

### Server app

To give a known starting point, from a given directory (in this example `server-name`):

Run init and set the access point to `server.js`

```bash
npm init
```

Install latest version of following `npm` packages:

```bash
npm i express mysql2 uuid bcryptjs jsonwebtoken cors dotenv  --save
```

The resulting `package.json` file should resemble:

```json
{
  "name": "gen-test",
  "version": "0.1.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": ""
  },
  "author": "RNC",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.17.3",
    "mysql2": "^2.3.3"
  },
  "devDependencies": {}
}
```

The target server directory is now ready for the generator to create the route, controllers etc

## generation

The gen2 app uses an `.env` set up. Here is an example:

```bash
# path to root of target directory
APPPATH="C:/Users/rcollins/code/"
# target directory for generation

# change line below to your server directory
APPDIR="server_name"
# origin - the web client that will access this server - Used in CORS setup
ORIGIN="http://localhost"

# port to listen on
PORT=3020

# Database provider, user and database name (add password using editor)
DATABASEPROVIDER=MYSQL
DATABASEHOST=127.0.0.1
DATABASEUSER=root
DATABASENAME=ph1
DATABASEWAITFORCONNECTIONS=true,
DATABASECONNECTIONLIMIT=10,
DATABASEQUEUELIMIT=0

SERVERDESC="Test server for version 2 of Server Generator (/code/gen2/app.js)"
```

The workflow might then be:

1. Delete any existing directories or files in the server target directorye.g. `server_name` by running `node app.js --purge`
2. Create the required directories and file scaffolds by running `node app.js --scaffold`
3. Edit the `server_name/configs/routes-config.json` to match the route/routes needed
4. Check the `/configs/routes-config.json` by running `node app.js --validate`
5. Generate a single route by running `node app.js --route 1` where 1 is the id. To run multiple routes e.g. `node app.js 1,2,3 6-9` use a mix off comma listed ids and/or ranges. To run all routes uses `node app.js --route all`
6. Set the database password in `server_name/configs/dbconfig.js`
7. Test the server and first route (e.g. users in above .env example) using the URL `loacalhost:3020/api/users` The browser should display whatever was set in the `thisRoute.requestresponse`. For example:

```json
{
  "status": "success",
  "data": {
    "users": [
      { "id": 1, "email": "someone@redmug.dev", "role": "superuser" },
      { "id": 2, "email": "support@redmug.dev", "role": "user" }
    ]
  }
}
```

You must manually delete a route using (e.g. `node app.js --delete_route 1`) before rerunning a route.

## Help with options

From the command line `node app.sj` or node app.js --help will print the help. For reference:

```
Provide one from the following command line options :

          --purge                deletes all generated directories and content
          --scaffold             generate directories and new boilerplate code
          --route 1              add route to a scaffold by id from configs/routes-config.json
          --route 1,5-7          add multiple routes id = 1,5,6,7
          --delete_route 1       delete multiple routes id = 1,5,6,7
          --delete_route 1,5-7   delete multiple routes id = 1,5,6,7
          --test_API_export              create file with exported test_API statements
          --help                 print this help
          --version              print version
          --validate             validate the route-configs.json

```

## Docs and testing

For each route generated, details are added to `server_name/docs/API.docs.md`. These are not changed if a route is rerun (reminder - use route_delete first), the docs entry for the API is not delete or changed but marked with adate/time string as below:

```

## /api/user/:id ---- (replaced 22/01/2024, 12:26:54)

> Description: returns user matching id

```

For immediate ad hoc manual testing, the `curl` statement is written to the terminal output

A further option `node app.js --testAPI_export` is included. This create a text file (`test_API.txt`) containing just the curl statements and just the URL's

```
curl  -X GET http://localhost:3020/api/users
curl  -X GET http://localhost:3020/api/user/:id
curl  -X GET http://localhost:3020/api/resources


GET http://localhost:3020/api/users

###

GET http://localhost:3020/api/user/:id

###

GET http://localhost:3020/api/resources

###
```

These are generated from an existing `API.docs.md` file and not while running route generation. Use with `curl`, a VS Code extension such as REST Client or copy/paste/import into Hoppscotch/Postman/Insomnia et al.

## after route generation editing

As a minimum, once a route is generated, the data access code will be modified to access your database rather than the route returning a mocked response from `routes-config.json`

The API documenation should be modified to match the working code.

If using say Hoppscotch, the test assertions should be modified to match the working code.

### Use pool or connections

As a general rule, use a pool connection except fot transactions based SQL. Here is an example of the generated code being changed to working code using a pooled connection.

As generated:

```javascript
const pool = require('./db-pool.js')
const promisePool = pool.promise()
//  const sql = require('./db.js')
const userDb = async (id) => {
  // let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
  // const[rows,fields] = await promisePool.query(q, [id])
  // console.log('rows: ', rows)

  // if(rows[0].adminuser){
  // await aSecondDataBaseAsyncFunction(rows[0].id)
  // }

  //    return JSON.parse('{"status":"success", "data":{"users":[' + JSON.stringify(rows) + ']}}')

  // const aSecondDataBaseAsyncFunction = async (id) =>{
  //   let q = 'UPDATE admin_users SET last_)login = NOW() WHERE id = ?
  //   const [rows, fields] = await promisePool.query(q, [id])
  // }

  return JSON.parse(
    '{"status":"success", "data":{"users":[' +
      JSON.stringify({
        user: [
          { username: 'rcollins@xxxxxxx.co.uk', last_login: '2024-01-06T17:25:12.000Z' },
          { username: 'jtilling@xxxxxx.org.uk', last_login: '2023-11-16T13:23:19.000Z' },
        ],
      }) +
      ']}}'
  )
}

module.exports = {
  userDb,
}
```

Working MySQL code with a pool connection:

```javascript
const pool = require('./db-pool.js')
const promisePool = pool.promise()
//  const sql = require('./db.js')
const userDb = async (id) => {
  let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
  const [rows, fields] = await promisePool.query(q, [id])
  console.log('rows: ', rows)

  // if(rows[0].adminuser){
  // await aSecondDataBaseAsyncFunction(rows[0].id)
  // }

  return JSON.parse('{"status":"success", "data":{"users":[' + JSON.stringify(rows) + ']}}')

  // const aSecondDataBaseAsyncFunction = async (id) =>{
  //   let q = 'UPDATE admin_users SET last_)login = NOW() WHERE id = ?
  //   const [rows, fields] = await promisePool.query(q, [id])
  // }
}

module.exports = {
  userDb,
}
```

If you database access code does not require a second (3rd/4th) chaned statement you can also delete further to

```javascript
const pool = require('./db-pool.js')
const promisePool = pool.promise()
const userDb = async (id) => {
  let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
  const [rows, fields] = await promisePool.query(q, [id])
  return JSON.parse('{"status":"success", "data":{"users":[' + JSON.stringify(rows) + ']}}')
}
module.exports = {
  userDb,
}
```

### Layout of JSON responses

JSON server response always returns an array even when there is a single row returned. Client side code might look like:

```javascript
fetch(API_BASE_URL + 'user' + '/' + id)
    .then((res) => res.json())
    .then((result) => {
      if (result.status === 'success') {
        <!-- get user's email address -->
       resEmail = result.data.users[0].email
      }else{
        <!-- some error code here -->
      }
    })
```

### To do

<small>

1.  Add middleware for user authentication as option
2.  Add logging of of API calls as option (use Cabin?)

</small>

<small>Working code is better than perfect code, and readable code is better than clever code.</small>

With the new config, the request response array is now an empty array `[]`. Any valid JSON is returned if present.

4. The `routes-config.json` file is always read from `server-name/configs/server-name/routes-config.json` e.g `ph1_flat_server\configs\routes-config.json`
5. The code generated for the data access now uses `async/await` allowing multiple SQL statements to be executed in sequence. An example of SQL statemets being executed in sequence is given below:

```javascript
const pool = require('./db-pool.js')
const promisePool = pool.promise()

const loginDb = async (user, pwd) => {
  let q = 'SELECT * FROM users WHERE username = ?'
  const [rows, fields] = await promisePool.query(q, [user])
  // console.log('rows : ', rows)
  if(row[0].admin{
  await databaseAsyncFunction(rows[0].id)
  })
  return JSON.parse('{"status":"success","data":{"users":[' + JSON.stringify(rows) + ']}}')
}

const databaseAsyncFunction = async (id) => {
  let q = 'UPDATE admin_users SET last_login = NOW()  WHERE id = ?'
  const [rows, fields] = await promisePool.query(q, [id])
}

module.exports = {
  loginDb,
}
```

6. The `--purge` option no longer deletes the `server-name/configs` directory and the `dbconfig.js` and `routes-config.js` are not modified or deleted.
7. If 'dbconfig.js'does not exist, it is created with default connection parameters
8. Existing routes are **never** overwritten. Use the new `delete_route` option to manually delete a route
9. As routes are generated, the console now shows the curl command to allow immediate ad-hoc testing
10. Removed the --docs option - always generated with routes
11. Added server description to .env setting for use in `docs` header intro.

The following changes compared to the first versions are:

1. Service layer removed. All routes in routes/index.js use a conroller which calls the dataaccess which reuturns the response.
2. A new option added `--curl_export` or to restrict to given routes `--curl_export 1,5-7`. This creates a simple text file, one line per curl statement. This file may then be imported into say Insomnia or HTTPie ( - similar to Postman) and used for adhoc testing and simple visulaisation of API replies
3. The `routes-config.json` has been simplified. The simplest possible route config is now:

# Background

Express does not lay down suggested project structures or conventions when building an API. There are lots of opinions. The suggestions of Corey Cleary. [https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way](https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way) provide a solid background. (The first version Gen follows this closely)

This may not be great code but it sure helps getting a consistent REST like API of the ground.
