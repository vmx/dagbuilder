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

First create an empty IPFS repo:

```console
> IPFS_PATH=/tmp/dagbuilderrepo jsipfs init --empty-repo
initializing ipfs node at /tmp/dagbuilderrepo
generating 2048-bit RSA keypair...done
peer identity: QmWZaQmoqnVzsWtpM5uQewneFY7GtghffZATMELs7xDS1u
```

Now load the data into it:

```console
> IPFS_PATH=/tmp/dagbuilderrepo node jsipld.js mixed2.dag
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


## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/vmx/dagbuilder/issues)!

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.


## License

[MIT](LICENSE) Copyright © 2018 Protocol Labs, Inc.

