'use strict'

const neodoc = require('neodoc')

const dagbuilder = require('./index')

const helpText = `
usage: jsipld.js [--include-id] FILE

arguments:
    FILE  input file

options:
    -i, --include-id  Add the id speficied in the DAG file to the node (if the node is JSON)
`

const main = async (argv) => {
  const ipfsPath = process.env.IPFS_PATH
  if (ipfsPath === undefined) {
    throw Error('`IPFS_PATH` needs to be defined')
  }

  const args = neodoc.run(helpText)

  const data = dagbuilder(ipfsPath, args.FILE, {
    includeId: args['--include-id']}
  )

  for await (const {cid, node} of data) {
    console.log(cid.toString(), node.meta.id, node.raw.data)
  }
}

main(process.argv).catch((error) => {
  console.error(error)
})

