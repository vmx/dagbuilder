'use strict'

const fs = require('fs').promises

// The number of spaces used to indent the children
const INDENTATION = 2

// Parse meta information into an object
// The meta information is formatted as:
// [key1:value1,key2:value2,...]
const parseMeta = (meta) => {
  // Remove leading and trailing brackets
  meta = meta.substr(1, meta.length - 2)
  // Split into the individual key-value pairs
  const kvs = meta.split(',')
  // Create an object out of the key-value pairs
  const parsed = {}
  for (const kv of kvs) {
    const [key, value] = kv.split(':')
    parsed[key] = value
  }
  return parsed
}

// // Serialize an object into the meta data format:
// // [key1:value1,key2:value2,...]
// const serializeMeta = (meta) => {
//   let serialized = []
//   for (const [key, value] of Object.entries(meta)) {
//     serialized.push(key + ':' + value)
//   }
//   serialized = serialized.join(',')
//   return '[' + serialized + ']'
// }

// Print the meta information as well as the data of a node
const printNode = (node) => {
  let printData
  // If the data was JSON, links might have been added
  if (node.meta.type === 'json') {
    printData = JSON.stringify(node.data)
  }
  else {
    printData = node.raw.data
  }

  console.log(node.raw.meta, printData)
}

// Gets a node off the tree and resolves links.
// It returns the processed node
const popAndLink = (tree) => {
  const node = tree.pop()

  // The current last item is the parent of this node. Add a link
  const parent = tree[tree.length - 1]

  // Links can only be added to JSON encoded nodes
  if (parent.meta.type !== 'json') {
    throw new Error('Only type:json nodes may have children')
  }

  // Add the link with the `name` to the `id` of the object. That `id` will
  // later be replaced with its hash. If ther's no `name` given, use
  // the `id`.
  let name = node.meta.name
  if (name === undefined) {
    name = node.meta.id
  }
  parent.data[name] = {'/': node.meta.id}

  return node
}

// Returns all the nodes that were successfully processed
const processLine = (line, tree) => {
  const prevDepth = tree.length === 0 ? -1 : tree[tree.length - 1].depth
  // Split between indentation and the rest
  const splitIndentation = line.match(/^( *)(.+)/)
  const depth = splitIndentation[1].length / INDENTATION
  // TODO vmx 2018-08-09: do more robust parsing
  const metaRaw = splitIndentation[2].split(' ', 1)[0]
  const dataRaw = splitIndentation[2].substr(metaRaw.length + 1)

  const meta = parseMeta(metaRaw)

  let data
  switch (meta.type) {
    case 'json':
      data = JSON.parse(dataRaw)
      break;
    case 'hex':
      data = Buffer.from(dataRaw, 'hex')
      break;
    case 'raw':
      data = Buffer.from(dataRaw)
      break;
    default:
      throw new Error(`Unknown type: ${meta.type}`)
  }

  // A list of nodes
  const result = []
  // Write and add links independent of whether it's a singling or a child
  for (let ii = 0; ii <= prevDepth - depth; ii++) {
    const node = popAndLink(tree)
    result.push(node)
  }

  tree.push({
    depth,
    data,
    meta,
    raw: {
      data: dataRaw,
      meta: metaRaw
    }
  })

  return result
}

// Takes an input string containing a DAG decsribed in a custom format
// and returns a flat array of parsed nodes which have their links added
const flattenDag = (contents) => {
  // The tree is represented as a list of object of the shape
  // {
  //   depth: the depth of the tree,
  //   data: the actual data that should be stored,
  //   meta: meta information on how to encode/hash the data
  // }
  // The last first item of the list is the root node
  const tree = []

  // The final list of nodes with links resolved
  const result = []

  for (const line of contents.split('\n')) {
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    const nodes = processLine(line, tree)
    if (nodes.length > 0) {
      result.push(...nodes)
    }
  }

  // There might be still some data in the tree, flush it back to front
  while (tree.length > 1) {
    const node = popAndLink(tree)
    result.push(node)
  }

  // And finally add the root node
  const root = tree.pop()
  result.push(root)

  return result
}

const main = async (argv) => {
  const filename = argv[2]
  const file = await fs.readFile(filename)
  const contents = file.toString()
  const flattened = flattenDag(contents)
  for (const node of flattened) {
    printNode(node)
  }
}

if (require.main === module) {
  main(process.argv).catch((error) => {
    console.error(error)
  })
}

module.exports = flattenDag
