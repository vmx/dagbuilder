'use strict'

const fs = require('fs').promises
const promisify = require('util').promisify

const IpfsBlockService = require('ipfs-block-service')
const IpfsRepo = require('ipfs-repo')
const Ipld = require('ipld')

const flattenDag = require('./flattendag')

// This is a global object that stores the mapping between the name of
// a node and its CID. It is used to replace the links with the proper
// names.
const nameToCidMapping = {}

const replaceNamesWithCids = (data) => {
  for (const key in data) {
    if (key === '/') {
      const cid = nameToCidMapping[data[key]]
      if (cid === undefined) {
        throw new Error(`Cannot resolve link with name "${data[key]}"`)
      }
      data[key] = cid
    } else if (Array.isArray(data[key])) {
      for (const item of data[key]) {
        replaceNamesWithCids(item)
      }
    } else if (typeof data[key] === 'object') {
      replaceNamesWithCids(data[key])
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
      replaceNamesWithCids(data)
      break
    case 'hex':
    case 'raw':
      format = 'raw'
      hashAlg = 'sha2-256'
      data = node.data
      break
    default:
      callback(new Error(`Unknown type ${node.meta.type}`))
  }
  const name = node.meta.name
  if (name in nameToCidMapping) {
    callback(new Error(`names must be unique, "${name}" was not`))
  }
  ipld.put(data, {format, hashAlg}, (err, cid) => {
    if (err) {
      callback(err)
    }
    nameToCidMapping[node.meta.name] = cid.toBaseEncodedString()
    callback(null, cid)
  })
})

const initIpld = promisify((ipfsRepoPath, callback) => {
  const repo = new IpfsRepo(ipfsRepoPath)
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
  const filename = argv[2]
  const file = await fs.readFile(filename)
  const contents = file.toString()
  const flattened = flattenDag(contents)

  const ipld = await initIpld(ipfsPath)

  for (const node of flattened) {
    const cid = await cidNode(ipld, node)
    console.log(cid.toBaseEncodedString(), node.meta.name, node.raw.data)
  }

  // await peer.stop()
}

main(process.argv).catch((error) => {
  console.error(error)
})

