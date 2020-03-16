---
layout: post
section-type: post
title: Bitcoin Technical Fundamentals
category: Bitcoin
tags: [ 'bitcoin', 'tutorial', 'development', 'python' ]
---

This is the beginning of a tutorial that explores some of the technical aspects of Bitcoin and how these can be implemented in Python. The tutorial is aimed to people who already have some knowledge of how Bitcoin works at a high-level and want to delve deeper. In this first post we aim to provide some of the technical computer science background required for later posts. It aims to explain the fundamentals in a concise way but links will be provided inline for further study.

### Bytes, Hex, Endianness and Encodings
Computers internally use the [binary numeral system](https://en.wikipedia.org/wiki/Binary_number) that consists of only two symbols: 0 and 1. A [binary digit](https://en.wikipedia.org/wiki/Binary_number), or _bit_, is the basic unit of binary. Eventually, everything is represented in bits.

For ease of processing, bits are aggregated into [bytes](https://en.wikipedia.org/wiki/Byte). Each byte consists of 8 bits. Thus, `01000001` represents a single byte. It is difficult (and much longer) to use/type binary, thus we typically use the [hexadecimal numeral system](https://en.wikipedia.org/wiki/Hexadecimal) or _hex_ to represent bytes in a more human-friendly way. Hex has 16 possible symbols from 0 to F (0-9 and A-F). To represent 16 symbols we need exactly 4 bits (0 is 0000, 1 is 0001, ..., F is 1111) and thus each byte can be represented by two hex digits. For example, `01000001` is equivalent to `41` in hexadecimal (0100 is hex number 4 and 0001 is hex number 1). You can experiment with conversions between binary, hexadecimal and decimal using various [online tools](https://www.rapidtables.com/convert/number/binary-to-hex.html).

Python examples:
<pre><code data-trim class="python">
{% raw %}
>>> format(0, '04b')                 # converts decimal 0 to binary with 0 padding for 4 bits
'0000'
>>> format(15, '04b')                # same for decimal 15
'1111'
>>> format(15, 'X')                  # convert decimal 15 to hex string
'F'
>>> format(0x41, '08b')              # converts hex number 41 to binary with 0 padding for 8 bits
'01000001'
>>> 0x41                             # converts hex number 41 to decimal
65
>>> 0x41 == '41'                     # compares hex number 41 with string 41
False
>>> b'41' == '41'                    # compares byte literal 41 with string 41
False
{% endraw %}
</code></pre>
<br/> 
One byte can represent up to 2<sup>8</sup>=256 numbers (0-255). Several bytes are needed to represent larger numbers. For example, decimal number 1000 is `1111101000` in binary which requires 10 bits. Computers operate at the byte level and thus 2 bytes (or 16 bits) will be required to represent this number; binary: `0000001111101000` and hex: `03E8`. Note that the byte ordering is important and it is called [endianness](https://en.wikipedia.org/wiki/Endianness). The above example uses _big-endian_ ordering, where the most significant byte comes first and the least significant byte comes last. This is the same way we order numbers in languages (in [left-to-right scripts](https://en.wikipedia.org/wiki/Writing_system#Directionality)). In _little-endian_ the same number would be represented as `0010101111000000` and `E803`.

Python examples:
<pre><code data-trim class="python">
{% raw %}
>>> import binascii
>>> format(0x03E8, '016b')           # convert hex number 03E8 to binary digits with 0 padding for 16 bits
'0000001111101000'
>>> format(int('03E8', 16), '016b')  # convert hex string '03E8' to binary digits as above
'0000001111101000'
>>> binascii.unhexlify('03E8')       # convert hex string 03E8 to binary
b'\x03\xe8'
>>> b'\x03\xe8'[::-1]                # reverse bytes to change endianness
b'\xe8\x03'
{% endraw %}
</code></pre>
<br/>
> Internally Bitcoin uses little-endian byte order as it improves speed (most computers use little-endian byte ordering internally). Most hash function libraries (see next section) create hashes using big-endian and Bitcoin transmits those in that ordering. However, when hashes are displayed Bitcoin uses little-endian order! The latter might be because it treats them as integers to compare them faster.

As we already mentioned computers only know about binary. To display these numbers for human consumption we need to convert them into characters (i.e. text). In order to accomplish that we need character encodings that provide mappings between bit sequences and characters. Examples of such encodings are [ASCII](https://en.wikipedia.org/wiki/ASCII) and [UTF-8](https://en.wikipedia.org/wiki/UTF-8). UTF-8 is widely used nowadays and it provides an 8-bit mapping between (binary) numbers and characters. For example,  character `A` is mapped to `01000001`. You can experiment with such encodings with [online tools](https://www.rapidtables.com/convert/number/ascii-to-binary.html).

Python examples:
<pre><code data-trim class="python">
{% raw %}
>>> import binasci
>>> b'41' == '41'.encode('utf-8')    # Unicode string literals are stored internally in binary for efficiency
True
>>> 'ε'.encode()                     # UTF-8 (the default) is a variable lenth encoding - 'ε' is stored as two bytes
b'\xce\xb5'
>>> '41'.encode()                    # converts UTF-8 string literal 41 to binary - '4' and '1' occupy 1 byte each
b'41'
>>> binascii.unhexlify('41')         # converts string hex value 41 to binary - the UTF-8 value for 'A' is 0x41
b'A'
>>> b'A'.decode('utf-8')             # convert binary to characters for displaying according to UTF-8 encoding
'A'
>>> binascii.hexlify(b'A')           # convert binary value to hex value (expressed in binary)
b'41'
>>> b'41'.decode()                   # decode to get as string (UTF-8 is the default)
'41'
>>> b'\xce\xb5'.decode()             # convert from bytes to UTF-8 characters (0xce 0xb5 maps to 'ε')
'ε'
{% endraw %}
</code></pre>
<br/>

### Cryptographic Hash Functions
A cryptographic hash function is a [hash function](https://en.wikipedia.org/wiki/Hash_function) that is suitable for cryptography. It is an one-way function that takes an arbitrary block of data and returns a fixed-size bit array, that is called the hash value or digest or digital fingerprint or just hash. It has the following properties:

* it is deterministic, i.e. the same block of data always returns the same hash
* it is quick to compute
* it is an one-way function; given the hash one cannot derive the original value unless they brute-force all possible values (which is close to impossible for large data sets)
* even a trivial change to the original data will change the resulting hash completely (it will appear uncorrelated to the previous hash)
* it is collision resistant; it is computational infeasible to find two different blocks of data with the same hash value

Python examples:
<pre><code data-trim class="python">
{% raw %}
>>> import hashlib
>>> import binascii
>>> b1 = 'Bitcoin'.encode('utf-8')   # convert string to bytes according to UTF-8 encoding
>>> b1
b'Bitcoin'
>>> h1 = hashlib.sha256(b1).digest() # calculate the hash (or digest) of b1
>>> h1
b'\xb4\x05m\xf6i\x1f\x8d\xc7.V0-\xda\xd3E\xd6_\xea\xd3\xea\xd9)\x96\t\xa8&\xe24N\xb6:\xa4'
>>> binascii.hexlify(h1).decode()    # converts bytes to hex (expressed in binary) and then to string to display
'b4056df6691f8dc72e56302ddad345d65fead3ead9299609a826e2344eb63aa4'
>>> b2 = 'bitcoin'.encode('utf-8')   # convert string to bytes according to UTF-8 encoding
>>> b2
b'bitcoin'
>>> h2 = hashlib.sha256(b2).digest() # calculate the hash (or digest) of b2
>>> h2
b'k\x88\xc0\x87$z\xa2\xf0~\xe1\xc5\x95k\x8e\x1a\x9fL\x7f\x89*p\xe3$\xf1\xbb=\x16\x1e\x05\xca\x10{'
>>> binascii.hexlify(h2).decode()    # converts bytes to hex (expressed in binary) and then to string to display
'6b88c087247aa2f07ee1c5956b8e1a9f4c7f892a70e324f1bb3d161e05ca107b'
{% endraw %}
</code></pre>
<br/>

Cryptographic hash functions are very important in information security systems. They are used in digital signatures, message authentication codes and as ordinary (but more secure) hash functions to index data in hash tables, to uniquely identify files (bittorrent, IPFS), as checksums to detect accidental (or not) corruption of data, etc.

> Bitcoin is using two hashing functions: [SHA-256](https://en.wikipedia.org/wiki/SHA-2) and [RIPEMD-160](https://en.wikipedia.org/wiki/RIPEMD) which create a hash value of 256 and 160 bits respectively (or 32 and 20 bytes or 64 and 40 hex characters). 

<br/>

### Asymmetric Cryptography
[Asymmetric cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) or public key cryptography is a cryptographic system that uses pairs of keys with a specific mathematical relation. In each pair there is a private key that should remain private and a public key that can be freely shared. Between two participants this allows:

* Encryption: Alice can encrypt a message with Bob’s public key and send it to Bob. Only the owner of the corresponding private key can decrypt and view the message.
* Authentication / Digital Signatures: Alice can sign a message using her private key and send it to Bob. Anyone can view the contents and verify the signature using Alice’s public key, thus ensuring that it was indeed Alice that send the message.
* Integrity: While anyone can view the contents of a signed message no one can modify it since the signature will be invalidated.
* Non-Repudiation: Signing or encrypting a message cannot be refuted by the author once the message has been sent, assuming the private key is secure.

> Bitcoin does not use encryption at all. Digital signatures are used to sign transactions in order to authenticate that you are the owner of the coins you wish to transfer. Integrity and non-repudiation apply as well to transaction signing.

There are several different algorithms for asymmetric cryptography, like [RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem)) and [ECDSA](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm). ECDSA, which Bitcoin uses, has the property that a private key can be used to calculate the corresponding public key.

<br/>
