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

const popAndLink = (tree) => {
  const toAdd = tree.pop()
  console.log('adding to IPLD1:', toAdd.meta)

  // The current last item is the parent of this node. Add a link
  const parent = tree[tree.length - 1]
  console.log('1adding a link to', toAdd.meta, 'from', parent.meta)
  // Store resulting hash in object where the name is the user defined name and the value is the hash
}

const processLine = (line, tree) => {
  const prevDepth = tree.length === 0 ? -1 : tree[tree.length - 1].depth
  // Split between indentation and the rest
  const splitIndentation = line.match(/^( *)(.+)/)
  const depth = splitIndentation[1].length / INDENTATION
  // TODO vmx 2018-08-09: do more robust parsing
  let meta = splitIndentation[2].split(' ', 1)[0]
  let data = splitIndentation[2].substr(meta.length)

  meta = parseMeta(meta)

  if (meta.type === 'json') {
    data = JSON.parse(data)
  }

  // Write and add links independent of whether it's a singling or a child
  for (let ii = 0; ii <= prevDepth - depth; ii++) {
    popAndLink(tree)
  }

  tree.push({
    depth,
    data,
    meta
  })

  return depth
}

const main = async (argv) => {
  const filename = argv[2]
  // The tree is represented as a list of object of the shape
  // {
  //   depth: the depth of the tree,
  //   data: the actual data that should be stored,
  //   meta: meta information on how to encode/hash the data
  // }
  // The last first item of the list is the root node
  const tree = []

  const file = await fs.readFile(filename)
  const contents = file.toString()
  for (const line of contents.split('\n')) {
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    processLine(line, tree)
  }

  // There might be still some data in the tree, flush it back to front
  while (tree.length > 1) {
    popAndLink(tree)
  }

  // And finnally add the root node
  const toAdd = tree.pop()
  console.log('root node:', toAdd.meta)
}


main(process.argv).catch((error) => {
  console.error(error)
})
