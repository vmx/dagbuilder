'use strict'

// Loading the data directly into a repository that contains IPLD objects
// without using IPFS.

const fs = require('fs').promises

const IpfsBlockService = require('ipfs-block-service')
const IpfsRepo = require('ipfs-repo')
const Ipld = require('ipld')
const mergeOptions = require('merge-options')
const multicodec = require('multicodec')

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

// Get the cid of the node and store it
const cidNode = async (ipld, node, includeId) => {
  let format
  let hashAlg
  let data
  switch (node.meta.type) {
    case 'json':
      format = multicodec.DAG_CBOR
      hashAlg = multicodec.SHA2_256
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
      format = multicodec.RAW
      hashAlg = multicodec.SHA2_256
      data = node.data
      break
    default:
      throw new Error(`Unknown type ${node.meta.type}`)
  }
  const id = node.meta.id
  if (id in idToCidMapping) {
    throw new Error(`ids must be unique, "${id}" was not`)
  }
  const cid = await ipld.put(data, format, {hashAlg})
  idToCidMapping[node.meta.id] = cid.toBaseEncodedString()
  return cid
}

const openIpld = async (ipfsRepoPath) => {
  const repo = new IpfsRepo(ipfsRepoPath)
  await repo.init({})
  await repo.open()
  const blockService = new IpfsBlockService(repo)
  const ipld = new Ipld({ blockService })
  return ipld
}


// A generator that returns the original nodea as well as the resulting CID
const dagbuilder = async function * (ipfsPath, inputFile, userOptions) {
  const defaultOptions = {
    includeId: false
  }
  const options = mergeOptions(defaultOptions, userOptions)

  const file = await fs.readFile(inputFile)
  const contents = file.toString()
  const flattened = flattenDag(contents)

  const ipld = await openIpld(ipfsPath)

  for (const node of flattened) {
    const cid = await cidNode(ipld, node, options.includeId)
    yield {
      cid,
      node
    }
  }
  // Close the repo so that there's no left-over lock file
  await ipld.bs._repo.close()
}

module.exports = dagbuilder
