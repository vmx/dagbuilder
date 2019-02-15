'use strict'

// Loading the data directly into a repository that contains IPLD objects
// without using IPFS.

const fs = require('fs').promises
const promisify = require('util').promisify

const IpfsBlockService = require('ipfs-block-service')
const IpfsRepo = require('ipfs-repo')
const Ipld = require('ipld')
const neodoc = require('neodoc')

const flattenDag = require('./flattendag')

const helpText = `
usage: jsipld.js [--include-id] FILE

arguments:
    FILE  input file

options:
    -i, --include-id  Add the id speficied in the DAG file to the node (if the node is JSON)
`

// This is a global object that stores the mapping between the id of
// a node and its CID. It is used to replace the links with the proper
// ids.
const idToCidMapping = {}

const replaceIdsWithCids = (data) => {
  for (const key in data) {
    if (key === '/') {
      const cid = idToCidMapping[data[key]]
      if (cid === undefined) {
        throw new Error(`Cannot resolve link with id "${data[key]}"`)
      }
      data[key] = cid
    } else if (Array.isArray(data[key])) {
      for (const item of data[key]) {
        replaceIdsWithCids(item)
      }
    } else if (typeof data[key] === 'object') {
      replaceIdsWithCids(data[key])
    }
  }
}

// Get the cid of the node and store it
const cidNode = promisify((ipld, node, includeId, callback) => {
  let format
  let hashAlg
  let data
  switch (node.meta.type) {
    case 'json':
      format = 'dag-cbor'
      hashAlg = 'sha2-256'
      // Don't manipulate the data of the node directly
      data = JSON.parse(JSON.stringify(node.data))
      replaceIdsWithCids(data)
      if (includeId) {
        data.id = node.meta.id
      }
      break
    // `hex` and `utf8` both lead to buffers which were created by `flattendag`
    case 'hex':
    case 'utf8':
      format = 'raw'
      hashAlg = 'sha2-256'
      data = node.data
      break
    default:
      callback(new Error(`Unknown type ${node.meta.type}`))
  }
  const id = node.meta.id
  if (id in idToCidMapping) {
    callback(new Error(`ids must be unique, "${id}" was not`))
  }
  ipld.put(data, {format, hashAlg}, (err, cid) => {
    if (err) {
      callback(err)
    }
    idToCidMapping[node.meta.id] = cid.toBaseEncodedString()
    callback(null, cid)
  })
})

const openIpld = promisify((ipfsRepoPath, callback) => {
  const repo = new IpfsRepo(ipfsRepoPath)
  // Initialize the repository, it won't do any harm if it was already
  // initialized
  repo.init({}, (err) => {
    if (err) {
      callback(err)
    }

    repo.open((err) => {
      if (err) {
        callback(err)
      }
      const blockService = new IpfsBlockService(repo)
      const ipld = new Ipld(blockService)
      callback(null, ipld)
    })
  })
})

const main = async (argv) => {
  const ipfsPath = process.env.IPFS_PATH
  if (ipfsPath === undefined) {
    throw Error('`IPFS_PATH` needs to be defined')
  }

  const args = neodoc.run(helpText)

  const filename = args.FILE
  const file = await fs.readFile(filename)
  const contents = file.toString()
  const flattened = flattenDag(contents)

  const ipld = await openIpld(ipfsPath)

  for (const node of flattened) {
    const cid = await cidNode(ipld, node, args['--include-id'])
    console.log(cid.toBaseEncodedString(), node.meta.id, node.raw.data)
  }
  // Close the repo so that there's no left-over lock file
  ipld.bs._repo.close(() => {})
}

main(process.argv).catch((error) => {
  console.error(error)
})
