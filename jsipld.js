'use strict'

// Loading the data directly into a repository that contains IPLD objects
// without using IPFS.

const fs = require('fs').promises
const promisify = require('util').promisify

const IpfsBlockService = require('ipfs-block-service')
const IpfsRepo = require('ipfs-repo')
const Ipld = require('ipld')

const flattenDag = require('./flattendag')

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

// Get the cid of the node
const cidNode = promisify((ipld, node, callback) => {
  debugger
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
  repo.open((err) => {
    if (err) {
      callback(err)
    }
    const blockService = new IpfsBlockService(repo)
    const ipld = new Ipld(blockService)
    callback(null, ipld)
  })
})

const main = async (argv) => {
  const ipfsPath = process.env.IPFS_PATH
  if (ipfsPath === undefined) {
    throw Error('`IPFS_PATH` needs to be defined')
  }
  const filename = argv[2]
  const file = await fs.readFile(filename)
  const contents = file.toString()
  const flattened = flattenDag(contents)

  const ipld = await openIpld(ipfsPath)

  for (const node of flattened) {
    const cid = await cidNode(ipld, node)
    console.log(cid.toBaseEncodedString(), node.meta.id, node.raw.data)
  }
}

main(process.argv).catch((error) => {
  console.error(error)
})

