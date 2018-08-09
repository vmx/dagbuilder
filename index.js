'use strict'

const fs = require('fs').promises

// The number of spaces used to indent the children
const INDENTATION = 2

const popAndLink = (tree) => {
  const toAdd = tree.pop()
  console.log('adding to IPLD1:', toAdd.meta)

  // The current last item is the parent of this node. Add a link
  const parent = tree[tree.length - 1]
  console.log('1adding a link to', toAdd.meta, 'from', parent.meta)
}

const processLine = (line, tree) => {
  const prevDepth = tree.length === 0 ? -1 : tree[tree.length - 1].depth
  // Split between indentation and the rest
  const splitIndentation = line.match(/^( *)(.+)/)
  const depth = splitIndentation[1].length / INDENTATION
  // TODO vmx 2018-08-09: do more robust parsing
  const meta = splitIndentation[2].split(' ', 1)[0]
  const data = splitIndentation[2].substr(meta.length)


  if (depth === prevDepth) {
    popAndLink(tree)
    // Store resulting hash in object where the name is the user defined name and the value is the hash
  }
  // Going deeper
  else if (depth > prevDepth) {
    // Push the current line after we processed the previous one
  }
  // Going up again, hence write what we had
  // if (depth < prevDepth)
  else {
    popAndLink(tree)

    // Add all missing parents, it could be several levels
    for (let ii = 0; ii < prevDepth - depth; ii++) {
      popAndLink(tree)
      // Store resulting hash in object where the name is the user defined name and the value is the hash
    }
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
    const toAdd = tree.pop()
    console.log('left-over:', toAdd.meta)

    // Leftovers all have a single parent, so we can link to that
    console.log('4adding a link to', toAdd.meta, 'from', tree[tree.length - 1].meta)
  }

  // And finnally add the root node
  const toAdd = tree.pop()
  console.log('root node:', toAdd.meta)
}


main(process.argv).catch((error) => {
  console.error(error)
})
