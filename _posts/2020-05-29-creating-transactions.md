---
layout: post
section-type: post
title: Creating Transactions
category: Bitcoin
tags: [ 'bitcoin', 'transactions', 'tutorial', 'development', 'python' ]
---

In the previous post we went through transactions, their inputs and outputs and how the funds are locked. In this post we will go through different ways of creating a simple payment transaction from the command line and then programmatically. The tutorial assumes some understanding of the high-level Bitcoin concepts or at least having gone through the previous technical articles of this tutorial.


### Automatically create a transaction

We can use `sendtoaddress` to send bitcoins to an address.

<pre><code data-trim class="sh">
{% raw %}
$ ./bitcoin-cli sendtoaddress mnB6gSoVfUAPu6MhKkAfgsjPfBWmEEmFr3 0.1
18f23a2c3bea97d30e0e09376222b6888943e7dc86df43ff5dfa1ff59c10d8ec
{% endraw %}
</code></pre>
<br/> 

In this example we use the node to send `0.1` bitcoins to address `mnB6gSoVfUAPu6MhKkAfgsjPfBWmEEmFr3`. Notice that we do not specify any details on which UTXOs to spend from. The node wallet will decide which UTXOs it will spend and in which address the change (there is almost always change) will go; i.e. we do not have any control when sending funds this way.

Notice that the result is the transaction identifier (txid) of this transaction.


### Create a transaction using a node

In this example we want to select the inputs explicitly. We need to know the txids and the output indexes (vout). As an example, we can get those with:

<pre><code data-trim class="sh">
{% raw %}
$ ./bitcoin-cli listunspent 0
[
  {
    "txid": "b3b7464d3472a9e83da4d5c179620b71724a62eac8bc14ac4543190227183940",
    "vout": 0,
    "address": "n1jnMQCyt9DHR3BYKzdbmXWM8M5UvH9nMW",
    "account": "",
    "scriptPubKey": "76a914ddcf9faf5625d6a96790710bbcef98af9a8719e388ac",
    "amount": 1.30000000,
    "confirmations": 0,
    "spendable": true,
    "solvable": true
  }
  ...
]
{% endraw %}
</code></pre>
<br/> 

The above command lists all UTXOs (even those with 0 confirmations; i.e. in the mempool). Now we can create a transaction specifying the UTXO that we want to spend.

<pre><code data-trim class="sh">
{% raw %}
$ ./bitcoin-cli createrawtransaction '''
> [
>   {
>     "txid": "b3b7464d3472a9e83da4d5c179620b71724a62eac8bc14ac4543190227183940",
>     "vout": 0
>   }
> ]
> ''' '''
> {
>   "mqazutWCSnuYqEpLBznke2ooGimyCtwCh8": 0.2
> }'''
01000000014039182702194345ac14bcc8ea624a72710b6279c1d5a43de8a972344d46b7b30000000000ffffffff01002d3101000000001976a9146e751b60fcb566418c6b9f68bfa51438aefbe09488ac00000000
{% endraw %}
</code></pre>
<br/> 

The result is the serialized raw transaction in hexadecimal. Note that this is not signed yet. To see the details of the raw transaction we can use:

<pre><code data-trim class="sh">
{% raw %}
$ ./bitcoin-cli decoderawtransaction 01000000014039182702194345ac14bcc8ea624a72710b6279c1d5a43de8a972344d46b7b30000000000ffffffff01002d3101000000001976a9146e751b60fcb566418c6b9f68bfa51438aefbe09488ac00000000
{
  "txid": "a7b54334096108e8f69ecfa19263cfbf2f12210165ef5fc2e98ef8e4e466392e",
  "hash": "a7b54334096108e8f69ecfa19263cfbf2f12210165ef5fc2e98ef8e4e466392e",
  "size": 85,
  "vsize": 85,
  "version": 1,
  "locktime": 0,
  "vin": [
    {
      "txid": "b3b7464d3472a9e83da4d5c179620b71724a62eac8bc14ac4543190227183940",
      "vout": 0,
      "scriptSig": {
        "asm": "",
        "hex": ""
      },
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 0.20000000,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_DUP OP_HASH160 6e751b60fcb566418c6b9f68bfa51438aefbe094 OP_EQUALVERIFY OP_CHECKSIG",
        "hex": "76a9146e751b60fcb566418c6b9f68bfa51438aefbe09488ac",
        "reqSigs": 1,
        "type": "pubkeyhash",
        "addresses": [
          "mqazutWCSnuYqEpLBznke2ooGimyCtwCh8"
        ]
      }
    }
  ]
}
{% endraw %}
</code></pre>
<br/> 

We can confirm that this is unsigned because the unlocking script or `scriptSig` is empty. We now need to sign this transaction before it becames a valid transaction.


<pre><code data-trim class="sh">
{% raw %}
$ ./bitcoin-cli signrawtransactionwithwallet 01000000014039182702194345ac14bcc8ea624a72710b6279c1d5a43de8a972344d46b7b30000000000ffffffff01002d3101000000001976a9146e751b60fcb566418c6b9f68bfa51438aefbe09488ac00000000
{
  "hex": "01000000014039182702194345ac14bcc8ea624a72710b6279c1d5a43de8a972344d46b7b3000000006a4730440220404082ecae0b088e07647a5a4eb5c71626e001cbca9353bb6f7e6b212f0f95d002202cdadf64f31b11e1901134abe7917d74105953aa983db099504891696277b86d01210306a6ae64fbb424a81260a6c47f3cb52eec39c4b40ded8b05e150458b95ea6465ffffffff01002d3101000000001976a9146e751b60fcb566418c6b9f68bfa51438aefbe09488ac00000000",
  "complete": true
}
{% endraw %}
</code></pre>
<br/> 

Now we have the final signed raw transaction. If we use `decoderawtransaction` now you will see the unlocking script is properly set. We can test if this is a valid transaction before sending it to the node for broadcasting with the `mempoolaccept` command. Finally, we need to send it to the node for broadcasting.

<pre><code data-trim class="sh">
{% raw %}
$ ./bitcoin-cli decoderawtransaction 01000000014039182702194345ac14bcc8ea624a72710b6279c1d5a43de8a972344d46b7b3000000006a4730440220404082ecae0b088e07647a5a4eb5c71626e001cbca9353bb6f7e6b212f0f95d002202cdadf64f31b11e1901134abe7917d74105953aa983db099504891696277b86d01210306a6ae64fbb424a81260a6c47f3cb52eec39c4b40ded8b05e150458b95ea6465ffffffff01002d3101000000001976a9146e751b60fcb566418c6b9f68bfa51438aefbe09488ac00000000
error code: -26, error message:, 256: absurdly-high-fee
{% endraw %}
</code></pre>
<br/> 

In this instance we get an error saying that the transaction has an exceptionally high fee. We have not specified any output for change so 1.1 bitcoins would be given to miners (1.3-0.2). Most wallets have similar protection mechanisms to help safeguard from user errors.

### Using HTTP JSON-RPC

[JSON-RPC](http://json-rpc.org/wiki/specification){:target="_blank"} is a simple protocol that specifies how to communicate with remote procedure calls using JSON as the format. It can be used with several transport protocols but most typically it is used over HTTP.

A user name and password has to be provided in `bitcoin.conf`. By default only local connections are allowed, but other connections can be allowed for trusted IPs with the `rpcallowip` configuration option.

<pre><code data-trim class="sh">
{% raw %}
rpcuser=kostas
rpcpassword=too_long_to_guess
{% endraw %}
</code></pre>
<br/> 

Then we could use a tool like `curl` to make the JSON-RPC request:

<pre><code data-trim class="sh">
{% raw %}
$ curl --user kostas --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }' -H 'content-type: text/plain;' http://127.0.0.1:18332/
Enter host password for user ‘kostas’:

{
  “result”: 1746817,
  “error”: null,
  “id”: “curltest”
}
{% endraw %}
</code></pre>
<br/> 

Thus, we can also send the commands seen before to construct transactions via JSON-RPC.

### Calling node commands programmatically

A Python library that wraps Bitcoin’s API calls is `python-bitcoinrpc`. Install with `pip` and try it out.

<pre><code data-trim class="python">
{% raw %}
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException

# user and pw are rpcuser and rpcpassword respectively
user = "kostas"
pw = "too_long_to_guess"     # bad practice !!

rpc_connection = AuthServiceProxy("http://%s:%s@127.0.0.1:18332"%(user, pw))

block_count = rpc_connection.getblockcount()
print(block_count)
{% endraw %}
</code></pre>
<br/> 

All API calls can be used, including the ones to create a transaction with either sendtoaddress or createrawtransaction + signrawtransaction + sendrawtransaction.

### Creating transactions programmatically

The Bitcoin node allows the creation of the basic transactions. It does not support arbitrary scripts. We can create those programmatically by explicitly specifying the locking/unlocking conditions. We will use the `python-bitcoin-utils` library that can be installed easily with `$ pip install bitcoin-utils` in your working python environment.

There are several examples included in the library that you can consult, like the most common transaction, a [P2PKH payment](https://github.com/karask/python-bitcoin-utils/blob/b31c82e7005e06db7f780688cfcd9332d479f39d/examples/p2pkh_transaction.py){:target="_blank"} with one input and two outputs (the second output being the change).

<pre><code data-trim class="python">
{% raw %}
# Copyright (C) 2018-2020 The python-bitcoin-utils developers
#
# This file is part of python-bitcoin-utils
#
# It is subject to the license terms in the LICENSE file found in the top-level
# directory of this distribution.
#
# No part of python-bitcoin-utils, including this file, may be copied,
# modified, propagated, or distributed except according to the terms contained
# in the LICENSE file.

from bitcoinutils.setup import setup
from bitcoinutils.utils import to_satoshis
from bitcoinutils.transactions import Transaction, TxInput, TxOutput
from bitcoinutils.keys import P2pkhAddress, PrivateKey
from bitcoinutils.script import Script

def main():
    # always remember to setup the network
    setup('testnet')

    # create transaction input from tx id of UTXO (contained 0.4 tBTC)
    txin = TxInput('fb48f4e23bf6ddf606714141ac78c3e921c8c0bebeb7c8abb2c799e9ff96ce6c', 0)

    # create transaction output using P2PKH scriptPubKey (locking script)
    addr = P2pkhAddress('n4bkvTyU1dVdzsrhWBqBw8fEMbHjJvtmJR')
    txout = TxOutput(to_satoshis(0.1), Script(['OP_DUP', 'OP_HASH160', addr.to_hash160(),
                                  'OP_EQUALVERIFY', 'OP_CHECKSIG']) )

    # create another output to get the change - remaining 0.01 is tx fees
    # note that this time we used to_script_pub_key() to create the P2PKH
    # script
    change_addr = P2pkhAddress('mmYNBho9BWQB2dSniP1NJvnPoj5EVWw89w')
    change_txout = TxOutput(to_satoshis(0.29), change_addr.to_script_pub_key())
    #change_txout = TxOutput(to_satoshis(0.29), Script(['OP_DUP', 'OP_HASH160',
    #                                     change_addr.to_hash160(),
    #                                     'OP_EQUALVERIFY', 'OP_CHECKSIG']))

    # create transaction from inputs/outputs -- default locktime is used
    tx = Transaction([txin], [txout, change_txout])

    # print raw transaction
    print("\nRaw unsigned transaction:\n" + tx.serialize())

    # use the private key corresponding to the address that contains the
    # UTXO we are trying to spend to sign the input
    sk = PrivateKey('cRvyLwCPLU88jsyj94L7iJjQX5C2f8koG4G2gevN4BeSGcEvfKe9')

    # note that we pass the scriptPubkey as one of the inputs of sign_input
    # because it is used to replace the scriptSig of the UTXO we are trying to
    # spend when creating the transaction digest
    from_addr = P2pkhAddress('myPAE9HwPeKHh8FjKwBNBaHnemApo3dw6e')
    sig = sk.sign_input( tx, 0, Script(['OP_DUP', 'OP_HASH160',
                                       from_addr.to_hash160(), 'OP_EQUALVERIFY',
                                       'OP_CHECKSIG']) )

    # get public key as hex
    pk = sk.get_public_key().to_hex()

    # set the scriptSig (unlocking script)
    txin.script_sig = Script([sig, pk])
    signed_tx = tx.serialize()

    # print raw signed transaction ready to be broadcasted
    print("\nRaw signed transaction:\n" + signed_tx)


if __name__ == "__main__":
    main()
{% endraw %}
</code></pre>
<br/> 

This produces the serialized raw transaction in hexadecimal. We can then use `sendrawtransaction` to send this to the Bitcoin network. Notice that `bitcoin-utils` wraps the `python-bitcoinrpc` library in a [proxy object](https://github.com/karask/python-bitcoin-utils/blob/b31c82e7005e06db7f780688cfcd9332d479f39d/examples/node_proxy.py){:target="_blank"} so that we can send to a node directly from our python program.

<br/> 
