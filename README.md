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
> IPFS_PATH=/tmp/dagbuilderrepo node index.js examples/mixed.dag
zb2rhd4xj9YjrdNbjQiE1cp7Uhy5i9jm6C9Uej3Bckb1S37ez deadbeef deadbeef
zb2rhbGwE5yJZjN1THD9cy96KGocL6dSRkvLAtWiRCqy5H5tb face face
zdpuAoyzi72dfx9bJA8DhDFiajZd6yAYXtnkwKLYVnmJBu3aw deepernested {"even": "deeper"}
zdpuAnChLrjjJYXqV4QGG1PAmxnTvqhx2TDzGnFBcjVRpqFRY anotherChild {"yup": "json again"}
zdpuAxTFoqxnr4GnjyHaGd8icCoXAtquLy4K4QwaZaeWaR24p childsibling {"yet": "bla"}
zb2rhaDj14xPxcixuRa4GatsXUVRXhPufHqhPWUFmKp3xftVx bezirk Weser-Ems
zdpuAt2PqbqxF4LF3vfE8ahqmAN2qfUua4fvt2kZSw6KEcNeG child {"more": "json", "directDeadBeef": {"/": "deadbeef"}}
zdpuAueqWE5DEFbGvBG5mzofARZ7VAzxkzMuyuaqnEd1a4Zii bar {"bar": "baz"}
zdpuArBbc79tLJ1dpXWkusQC7ZCWePYSa2rfaL5g98FNn93AL anotherSibling {"another": "sibling"}
zdpuAu31qcTb4of9J2yPSGf4ReJXCPVQCHL1b8MHP5P6W4E3P root {"some": "json"}
```


### The file format

The general format is

    metadata data

where `metadata` is a list of key-value pairs wrapped in square brackets. The key and value of the key-value pair is separated by a colon, the individual pairs by a comma. Example:

    [type:json,id:root]

Supported keys:

 - `type`: The source format of the data. Possible values:
   - `json`: The input is JSON, it will be stored as CBOR
   - `hex`: The input is a hex encoded binary string, it is stored as `raw`
   - `utf8`: The input is a utf-8 encoded string, it is stored as `raw`
 - `id`: The identifier that can be used to link to that item. It will also be used as the name for the link if no `name` is given.
 - `name`: The name of the link. If several children on the same level have the same name, then the links will be stored as an array of links.


## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/vmx/dagbuilder/issues)!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.


## License

[MIT](LICENSE) Copyright © Protocol Labs, Inc.

