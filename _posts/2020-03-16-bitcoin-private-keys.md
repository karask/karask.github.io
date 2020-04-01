---
layout: post
section-type: post
title: Bitcoin Private Keys
category: Bitcoin
tags: [ 'bitcoin', 'tutorial', 'python', 'keys' ]
---

This part of the tutorial will explore Bitcoin's private keys and how we can create them programmatically. The tutorial is aimed to people who already have some knowledge of how Bitcoin works at a high-level and want to delve deeper. 

Bitcoin uses the [Elliptic Curve Digital Signature Algorithm](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm){:target="_blank"} (ECDSA) to create its private-public key pairs. The exact elliptic curve parameters used in Bitcoin are defined by [secp256k1](https://en.bitcoin.it/wiki/Secp256k1){:target="_blank"}.
	 
> In ECDSA a private key can be used to calculate the corresponding public key, and since a Bitcoin address is calculated from the public key, if you hold a private key securely you effectively have everything.

The ECDSA private key in Bitcoin is just a very large random number consisting of 256 bits or 32 bytes or 64 hexadecimal digits. Nearly all 256-bit numbers can be valid private keys as specified in secp256k1.

To display a private key (the bytes) we need to format it appropriately. It could be displayed in hex but the most common format used to display a private key is Wallet Import Format (WIF) or a WIF-compressed (WIFC); both are a [Base58Check](https://en.bitcoin.it/wiki/Base58Check_encoding){:target="_blank"} encoding of the ECDSA key; [Base58](https://en.wikipedia.org/wiki/Base58){:target="_blank"} with version prefix to specify the network and a 32-bit [checksum](https://en.wikipedia.org/wiki/Checksum){:target="_blank"}.

A WIF-compressed adds an extra byte (0x01) at the end of the ECDSA key before the Base58Check encoding. It specifies whether the public key (and by extension addresses) will be compressed or not. By default most wallets use WIFC format in order to reduce the size of the blockchain[^1].

> Note that WIFC will be 33 bytes long. The compression is happening when creating the public key which will be 33 bytes instead of 65 bytes.

The following is pseudocode of the process that converts the private key to WIF.

<pre><code data-trim class="bash">
{% raw %}
key_bytes = (32 bytes number) [ + 0x01 if compressed ]
network_prefix = (1 byte version number)
data = network_prefix + key_bytes
data_hash = SHA-256( SHA-256( data ) )
checksum = (first 4 bytes of data_hash)
wif = Base58CheckEncode( data + checksum )
{% endraw %}
</code></pre>
<br/> 

Note that all the above functions operate on big-endian bytes. The network prefix specifies the Bitcoin network that this private key would be used[^2]. The Base58 WIF prefix depends on the network prefix and whether it is compressed or not, as follows:

* Mainnet
  * WIF: Prefix 128 or 0x80 has a Base58 prefix of **5**
  * WIFC: Prefix 128 or 0x80 has a Base58 prefix of **K** or **L**
* Testnet
  * WIF: Prefix 239 or 0xef has a Base58 prefix of **9**
  * WIFC: Prefix 239 or 0xef has a Base58 prefix of **c**

As an example let us use the following hexadecimal number:

`0dde70823a4bb0ca3bd75a2010e8d5dc091185e73d8b4257a981c695a3eba95b`[^3]. 

As already discussed, the compressed version would be:

`0dde70823a4bb0ca3bd75a2010e8d5dc091185e73d8b4257a981c695a3eba95b01`. 

Let's use [python-bitcoin-utils](https://github.com/karask/python-bitcoin-utils){:target="_blank"} library[^4] to construct the WIF.

<pre><code data-trim class="python">
{% raw %}
>>> from bitcoinutils.setup import setup
>>> from bitcoinutils.keys import PrivateKey
>>> setup('testnet')
'testnet'
>>> priv = PrivateKey(secret_exponent = 0x0dde70823a4bb0ca3bd75a2010e8d5dc091185e73d8b4257a981c695a3eba95b)
>>> priv.to_wif(compressed=False)
'91h2ReUJRwJhTNd828zhc8RRVMU4krX9q3LNi4nVfiVwkMPfA9p'
>>> priv.to_wif(compressed=True)       # the default
'cN3fHnPVw4h7ZQSRz2HgE3ko69LTaZa5y3JWpFhoXtAke4MiqVQo'
{% endraw %}
</code></pre>
<br/> 

The actual python implepmentation of the functionality demonstrated above can be found at [to\_wif()](https://github.com/karask/python-bitcoin-utils/blob/42875a3fa90d267f2e5e17e017cb28fc8a90c5a8/bitcoinutils/keys.py#L169-L193){:target="_blank"} on github. You can also check how we can get to the private key bytes from WIF in [\_from\_wif()](https://github.com/karask/python-bitcoin-utils/blob/42875a3fa90d267f2e5e17e017cb28fc8a90c5a8/bitcoinutils/keys.py#L129-L166){:target="_blank"}. Feel free to consult the rest of the code and/or the examples in the repository. 

Another tool that you can use from the command line is [BX](https://github.com/libbitcoin/libbitcoin-explorer/wiki/Download-BX){:target="_blank"}. It has extensive capabilities including creating WIFs.

<pre><code data-trim class="shell">
{% raw %}
$ ./bx base58check-encode --version 239 0dde70823a4bb0ca3bd75a2010e8d5dc091185e73d8b4257a981c695a3eba95b
91h2ReUJRwJhTNd828zhc8RRVMU4krX9q3LNi4nVfiVwkMPfA9p

$ ./bx base58check-encode --version 239 0dde70823a4bb0ca3bd75a2010e8d5dc091185e73d8b4257a981c695a3eba95b01
cN3fHnPVw4h7ZQSRz2HgE3ko69LTaZa5y3JWpFhoXtAke4MiqVQo
{% endraw %}
</code></pre>



<br/>
Footnotes:

[^1]: The segregated witness upgrade allows only compressed public keys.
[^2]: The same private key can be of course used in both mainnet and testnet or even other compatible cryptocurrencies by using the appropriate prefix when generatig the WIF.
[^3]: In decimal: 6273083586486421860511804118443655246000698298582245067579657211. It is important to understand that a random number with enough [entropy](https://en.wikipedia.org/wiki/Entropy_(computing)){:target="_blank"} is required for your private key to be secure. A number representing your date of birth or your name's characters, etc. will be found immediately by software and you will lose your funds.
[^4]: I use this library in several of the University courses and seminars that I teach. It aims to be low-level but with a lot of comments to help students study the more intricate details. In contrast, other low-level libraries don't elaborate enough in the comments and others are higher-level libraries abstracting away a lot of the details that we are trying to decompose and understand in the lessons.
