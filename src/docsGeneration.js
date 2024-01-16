import { singleReplace1, singleReplace2, readFile, writeFile } from '../utils/index.js'
export const doGenerateDocs = async (step, thisRoute, message, passedObjectKeys, targetRootDir) => {
  // console.log('thisRoute:', thisRoute)
  let body = JSON.stringify(thisRoute.requestbody, null, '/t')
  if (body.length > 3) {
    body = '\n' + body
  }
  // console.log('body: ', body)
  let curlBody = ``
  if (thisRoute.method === 'POST' || thisRoute.method === 'PUT' || thisRoute.method === 'DELETE') {
    curlBody = `-H "Content-Type: application/json" -d '${JSON.stringify(thisRoute.requestbody[0])}'`
  }
  //   let fails = thisRoute.failmessages.split('|')
  let failsText = ''
  //   for (let i = 0; i < fails.length; i++) {
  //     failsText += `
  //   {
  //     "status": "fail",
  //     "data": {
  //       "message": "${fails[i]}"
  //     }
  //   }`
  //   }
  let docsMDCode =
    `
## /api/${thisRoute.name}

>Description:  ${thisRoute.description}
\`\`\`Text
# method            ${thisRoute.method}
# example                     /${thisRoute.name.toLowerCase()}
# parameters                  ${message.substring(1)}
# body                        ` +
    body +
    `
\`\`\`
\`\`\`Text
# success response            \n${JSON.stringify(thisRoute.requestresponse, null, '\t')}

\`\`\`

\`\`\`Text
# curl
curl  -X ${thisRoute.method} http://localhost:${process.env.PORT}/api/${thisRoute.name.toLowerCase()} ${curlBody}
\`\`\`
> Notes:  ${thisRoute.notes}
<hr><style="page-break-after: always;"></style>

`
  let routeReplacement1 = `${docsMDCode} 
//@insert1`
  let content = await readFile(targetRootDir + '/docs/API.docs.md')
  let result1 = await singleReplace1(routeReplacement1, content)
  console.log(
    'curl  -X ' +
      thisRoute.method +
      ' http://localhost:' +
      process.env.PORT +
      '/api/' +
      thisRoute.name.toLowerCase() +
      ' ' +
      curlBody
  )
  await writeFile(9, targetRootDir + '/docs/API.docs.md', result1)
}
