'use strict'

const fs = require('fs').promises

const ipfsApi = require('ipfs-api')
//const IPFS = require('ipfs')

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
const cidNode = async (ipfs, node) => {
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
      throw new Error(`Unknown type ${node.meta.type}`)
  }
  try {
    const name = node.meta.name
    if (name in nameToCidMapping) {
      throw new Error(`names must be unique, "${name}" was not`)
    }
    const cid = await ipfs.dag.put(data, {format, hashAlg})
    nameToCidMapping[node.meta.name] = cid.toBaseEncodedString()
    return cid
  } catch (err) {
    console.log(err)
    return
  }
}

const startIpfs = async () => {
  const peer = new IPFS({
    repo: '/tmp/ipfsrepo',
    start: false
  })

  await new Promise((resolve) => {
    peer.on('ready', resolve)
  })
  await peer.start()

  return peer
}

const main = async (argv) => {
  const filename = argv[2]
  const file = await fs.readFile(filename)
  const contents = file.toString()
  const flattened = flattenDag(contents)

  // const peer = await startIpfs()
  // const peer = ipfsApi()
  const peer = ipfsApi({port: 5002})
  // const peer = ipfsApi('/ip4/127.0.0.1/tcp/5002')

  for (const node of flattened) {
    const cid = await cidNode(peer, node)
    console.log(cid.toBaseEncodedString(), node.meta.name, node.raw.data)
  }

  // await peer.stop()
}

main(process.argv).catch((error) => {
  console.error(error)
})

