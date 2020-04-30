---
layout: post
section-type: post
title: Bitcoin Addresses
category: Bitcoin
tags: [ 'bitcoin', 'tutorial', 'python', 'addresses', 'base58check', 'bech32' ]
---


In this part we will talk about Bitcoin's addresses. We will explain how they are created, some of their properties as well as provide examples. The tutorial is aimed for people who already have some knowledge of how Bitcoin works at a high-level and want to understand how it works at a low-level.

Addresses can be shared to anyone who wants to sent you money. They are typically generated from the public key, consist of a sequence of characters and digits and start with 1 for the mainnet and with m or n for testnet[^1]. This will be further explained below.

An address typically represents the owner of a private/public pair but it can also represent an arbitrary complex script, called P2SH script, as we will see in a future post. 

> Notice that we do not share the public key as one would expect in public key cryptography but rather the address, which derives from the public key. Some benefits are:
> * shorter addresses
> * arguably, quantum computer resistance[^2]

<br/>

### Legacy Addresses

An address is really just the hash of the public key[^3], called public key hash. That is how it is represented on the blockchain. The way we format addresses to display them (starting with **1**, **m**/**n**, etc.) are just for our convenience. The format that we use is [Base58Check](https://en.bitcoin.it/wiki/Base58Check_encoding){:target="_blank"} encoding[^4] of the public key hash; [Base58](https://en.wikipedia.org/wiki/Base58){:target="_blank"} with version prefix to specify the network and a 32-bit [checksum](https://en.wikipedia.org/wiki/Checksum){:target="_blank"}.

The following is pseudocode of the process that converts the public key to public key hash and then address:

<pre><code data-trim class="bash">
{% raw %}
version = (1 byte version number)
keyHash = RIPEMD-160( SHA-256( publicKey ) )
data = version + keyHash
dataHash = SHA-256( SHA-256( data ) )
checksum = (first 4 bytes of dataHash)
address = Base58CheckEncode( data + checksum )
{% endraw %}
</code></pre>
<br/> 

Note that all the above functions operate on big-endian bytes. The network prefix specifies the Bitcoin network that this address would be used. The Base58 address first character depends on the network prefix, as follows:

* Mainnet
  * P2PKH[^5]: Prefix 0 or 0x00 has a Base58 prefix of **1**
  * P2SH[^6]: Prefix 5 or 0x05 has a Base58 prefix of **3**
* Testnet
  * P2PKH: Prefix 111 or 0x6f has a Base58 prefix of **m** or **n**
  * P2SH: Prefix 196 or 0xc4 has a Base58 prefix of **2**


Let's use [python-bitcoin-utils](https://github.com/karask/python-bitcoin-utils){:target="_blank"} library to construct some addresses; compressed and uncompressed[^7] legacy addresses.

<pre><code data-trim class="python">
{% raw %}
>>> from bitcoinutils.setup import setup
>>> from bitcoinutils.keys import PrivateKey, PublicKey, P2pkhAddress
>>> setup('testnet')
'testnet' 
>>> priv = PrivateKey.from_wif('91h2ReUJRwJhTNd828zhc8RRVMU4krX9q3LNi4nVfiVwkMPfA9p')
>>> pub = priv.get_public_key()  
>>> addr1 = pub.get_address()
>>> addr2 = pub.get_address(compressed=False)
>>> addr1.to_string()
'n42m3hGC52QTChUbXq3QAPVU6nWkG9xuWj' 
>>> addr2.to_string() 
'n2JjAgC6UqFf8DvsZXhWcyNzm8w8YKj7MQ'
{% endraw %}
</code></pre>
<br/> 

The actual python implepmentation of converting a public key hash (the application of SHA256 and then RIPEMD160, also called HASH160) can be found at [\_to\_hash160()](https://github.com/karask/python-bitcoin-utils/blob/52b7d906f2db8ec4ed4945a04b7e4da2d1db369c/bitcoinutils/keys.py#L589-L597){:target="_blank"} on github. For code to convert from public key hash to address consult [to\_string()](https://github.com/karask/python-bitcoin-utils/blob/52b7d906f2db8ec4ed4945a04b7e4da2d1db369c/bitcoinutils/keys.py#L802-L824){:target="_blank"}. Feel free to consult the rest of the code and/or the examples in the repository for segwit address creation, etc.

### Native Segregated Witness Addresses

Segregated Witness (segwit) is a consensus change that was activated in August 2017 and introduces an update on how transactions are constructed. It introduces two new transaction types, Pay-to-Witness-Public-Key-Hash (P2WPKH) and Pay-to-Witness-Script-Hash (P2WSH). These new transaction types are going to be explained in detail in a future post.

Native segwit addresses use a different format to display the public key hash called [Bech32 encoding](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki){:target="_blank"} (instead of Base58check). For code implementation look at the python reference implementation by Pieter Wuille [here](https://github.com/karask/python-bitcoin-utils/blob/52b7d906f2db8ec4ed4945a04b7e4da2d1db369c/bitcoinutils/bech32.py){:target="_blank"}.

The network prefix specifies the Bitcoin network that this address would be used:

* Mainnet
  * P2WPKH[^8] Prefix is bc and length of remaining address is 20 bytes
  * P2WSH[^9] Prefix is bc and length of remaining address is 32 bytes
* Testnet
  * P2WPKH Prefix is tb and length of remaining address is 20 bytes
  * P2WSH Prefix is tb and length of remaining address is 32 bytes

<pre><code data-trim class="python">
{% raw %}
>>> from bitcoinutils.setup import setup
>>> from bitcoinutils.keys import PrivateKey, PublicKey, P2wpkhAddress
>>> setup('testnet')
'testnet' 
>>> priv = PrivateKey.from_wif('91h2ReUJRwJhTNd828zhc8RRVMU4krX9q3LNi4nVfiVwkMPfA9p')
>>> pub = priv.get_public_key()  
>>> addr = pub.get_segwit_address()
>>> addr.to_string() 
'tb1q7m6ak6k050sxzxjjekhey73k0f3rqnxsqa08k2'
{% endraw %}
</code></pre>
<br/> 

### Nested Segregated Witness Addresses

When segwit was introduced a lot of wallets did not support the new bech32 addresses so users could not use those to send funds to segwit addresses. To remedy that, nested segwit addresses could be used.

Effectively you could nest or wrap a segwit address into a P2SH address. As already mentioned P2SH addresses can be created from arbitrary scripts and thus could also include a witness script. Again, P2SH and segwit are outside our scope now and will be explained in more detail in a later post.

> After the segwit upgrade one needs to choose what type of address to create (e.g. with `getnewaddress`. The supported types where `legacy`, `p2sh-segwit` and `bech32`. The default, starting from version 0.16.0, is nested addresses (`p2sh-segwit`).


<br/>
Footnotes:

[^1]: Or for segwit addresses bc and tb for mainnet and testnet respectively.
[^2]: Until one spends from an address the public key will never appear on the blockchain and thus to potential attackers and since the address is hashed from the public key not even quantum computers could (arguably) brute force to get the public key and then the private key. Note, however, that even if that is the case the majority of addresses would be hacked thus destroying trust in (and the value of) the network anyway!
[^3]: More precisely two hashing functions are used: RIPEMD-160( SHA-256( publicKey ) )
[^4]: Similar to what we used when creating the [WIF](/bitcoin/2020/03/16/bitcoin-private-keys.html) format of a private key.
[^5]: Pay to Public Key Hash - this is a typical legacy address.
[^6]: Pay to Script Hash - this is a typical script hash address.
[^7]: Since the public key hash of a compressed public key would be different from an uncompressed public key we have two distinct legacy addresses.
[^8]: Pay to Witness Public Key Hash - this is a segwit address.
[^9]: Pay to Witness Script Hash - this is a segwit script hash address.
