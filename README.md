# Dagbuilder

> Load a DAG described in a file into IPFS/IPLD.


## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)


## Install

```sh
> git clone https://github.com/vmx/dagbuilder.git
> cd dagbuilder
> npm install
```


## Usage

### Load data into IPLD

```console
> IPFS_PATH=/tmp/dagbuilderrepo npx . examples/mixed.dag
bafkreic7pdbte5heh6u54vszezob3el6exadoiw4wc4ne7ny2x7kvajzkm deadbeef deadbeef
bafkreice2kut2bglwgwpkqdnzrvidjbz2lhrpj47ekqz2cknzn4nzbjpqa face face
bafyreibu5ila472majbuek4cecho7mvohas5u5zzcgob2lonavmvsxzn3a deepernested {"even": "deeper"}
bafyreiahvm55w3wpah5rrnrprqfer5tm7mgm4ragaamcp4ehzaiua2kswu anotherChild {"yup": "json again"}
bafyreih7qralx7dtjpsuxfstgzixgearssnx4bhtydaxwfzy4tdiuaktpu childsibling {"yet": "bla"}
bafkreibverunmawfrbz5iea2aw4ym46p4h4pplnulnjk3mtfo4wttkxpdm bezirk Weser-Ems
bafyreicliqzi3xwsgnyk75dxx6yll4rmxhbcqohqncqi7bqwlt6a6ohb3u child {"more": "json", "directDeadBeef": {"/": "deadbeef"}}
bafyreieje7b3e2fpqapqv5xegbw42mmunktnxwwbu7bfkrlnsfkte3hf7m bar {"bar": "baz"}
bafyreignbzx2dy6th6lybhxwqyouxg2anftqyk6xwlpjiqhp6vguqbfthy anotherSibling {"another": "sibling"}
bafyreigds2mprmzw7doiq2pwfamzuc4kvxy2qg36bg7gin4tgdkuvcce4i root {"some": "json"}
```

### Using it as a module

```javascript
const dagbuilder = require('dagbuilder')

const addData = async () => {
  const data = dagbuilder('/tmp/myipfsrepo', 'examples/mixed.dag')
  for await (const {cid, node} of data) {
    console.log(cid.toBaseEncodedString(), node.meta.id, node.raw.data)
  }
}
```


## API

### constructor

 - `ipfsPath` (`string`, required): the path to the IPFS repository where the data is stored.
 - `inputFile` (`string`, required): the input file that describes the DAG. See [The file format](#the-file-format) for more information.
 - `options` (`Object`, default: `{}`):
   - `includeId` (`boolean`, default: `false`): whether the IDs of the nodes should be included when they are encoded or not.


## The file format

The general format is

    metadata data

where `metadata` is a list of key-value pairs wrapped in square brackets. The key and value of the key-value pair is separated by a colon, the individual pairs by a comma. Example:

    [type:json,id:root]

Supported keys:

 - `type`: The source format of the data. Possible values:
   - `json`: The input is JSON, it will be stored as CBOR
   - `hex`: The input is a hex encoded binary string, it is stored as `raw`
   - `utf8`: The input is a utf-8 encoded string, it is stored as `raw`
 - `id`: The identifier that can be used to link to that item. It will also be used as the name for the link if no `linkname` is given.
 - `linkname`: The name of the link. If several children on the same level have the same name, then the links will be stored as an array of links.


## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/vmx/dagbuilder/issues)!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.


## License

[MIT](LICENSE) Copyright © Protocol Labs, Inc.

