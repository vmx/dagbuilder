'use strict'

const fs = require('fs').promises

// The number of spaces used to indent the children
const INDENTATION = 2

const processLine = (line, prevLevel, tree) => {
  // Split between indentation and the rest
  const splitIndentation = line.match(/^( *)(.+)/)
  const level = splitIndentation[1].length / INDENTATION
  const data = splitIndentation[2]


  if (level === prevLevel) {
    const toAdd = tree.pop()
    console.log('adding to IPLD:', toAdd)
    // Store resulting hash in object where the name is the user defined name and the value is the hash
  }
  // Going deeper
  else if (level > prevLevel) {
    // Push the current line after we processed the previous one
  }
  // Going up again, hence write what we had
  // if (level < prevLevel)
  else {
    const toAdd = tree.pop()
    console.log('adding to IPLD:', toAdd)
    // Also add the parent
    const toAddParent = tree.pop()
    console.log('adding to IPLD:', toAddParent)
    // Store resulting hash in object where the name is the user defined name and the value is the hash
  }

  tree.push(data)


  return level
}

const main = async (argv) => {
  const filename = argv[2]
  // The current indentation level => depth of the node within the tree
  let depth = -1
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

    depth = processLine(line, depth, tree)
    //console.log(level, line, tree)
  }

  // There might be still some data in the tree, flush it back to front
  while (tree.length > 0) {
    const toAdd = tree.pop()
    console.log('left-over:', toAdd)
  }
}


main(process.argv).catch((error) => {
  console.error(error)
})
