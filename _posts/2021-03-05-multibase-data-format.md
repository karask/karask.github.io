---
layout: post
section-type: post
title: Multibase, Multihash, and Hashlinks
category: Computer-Science
tags: [ 'multibase', 'multihash', 'hashlink', 'programming', 'specification', 'python' ]
---

<br/>

### Multibase Data Format

There are several cases where we need to store bytes into text, most typically in a structured format, e.g. JSON. When converting bytes to text we use a base-encoding format like base64 or base58, which is used in Bitcoin. Depending on the particular application and the data itself different base-encoding formats are used since they are more efficient, practical or, surprisingly, more user-friendly.

Multibase is data model specification expressing binary data in a variety of base-encoding formats. It is a very simple model that just prepends an additional character that specifies the base-encoding followed by the data. For example, base64 is prepended by `m`, base32 by `b`, base58btc by `z`, etc. A complete list of the encodings supported can be found in the [specification](https://datatracker.ietf.org/doc/draft-multiformats-multibase/?include_text=1).

Using multibase allows an application to use and identify any base-encoding format with minimum effort. When an application is using multibase somewhere, it does not need to care what kind of base encoding the data is in since the multibase implementation will figure it out and decode it appropriately. A well-known application that uses multibase is IPFS[^1]; used in its content identifiers (CIDs).

An implementation of the specification in python is `py-multibase`.

Python examples:
<pre><code data-trim class="python">
{% raw %}
$ pip install py-multibase
...
$ python
>>> from multibase import encode, decode
>>> encode('base64', 'Kostas')
b'mS29zdGFz'
>>> encode('base32', 'Kostas')
b'bjnxxg5dbom'
>>> encode('base58btc', 'Kostas')
b'zeZkKyh7x'
>>> decode(b'mS29zdGFz')
b'Kostas'
{% endraw %}
</code></pre>
<br/>


### Multihash Data Format

Multihash is very similar to multibase but instead of helping identify the base that data is encoded with, it helps identify the type of the cryptographic hash function used for a hash value or digest. When a hash, or digest, is expressed in multihash an application can figure out the hash function by the digest itself.

The multihash data model is simple and consists of a type-length-value (TLV) pattern; type of hash function followed by the length of the digest followed by the digest. For example, type `0x12` is SHA2-256, type `0x1053` is RIPEMD-160, type `0x1b` is KECCAK-256, etc. A complete list of the hash functions supported can be found in the [specification](https://datatracker.ietf.org/doc/draft-multiformats-multihash/?include_text=1).

Python examples:
<pre><code data-trim class="python">
{% raw %}
$ pip install pymultihash
...
$ python
>>> from multihash import digest, decode, Func
>>> mh = digest(b'The data to hash', Func.sha2_256)
>>> mh.encode('hex')
b'1220200e639d4e9b4d681aacc19e8797a2d141bd652308e2140a4c7e50acc93a72f1'
>>> vh = decode(b'1220200e639d4e9b4d681aacc19e8797a2d141bd652308e2140a4c7e50acc93a72f1', 'hex')
>>> vh.verify(b'The data to hash')
True
{% endraw %}
</code></pre>
<br/>

Note that the digest in the above example starts with `12` which designates SHA-256, followed by `20` which is hex for 32 bytes (or 64 hex digits), which is the length of the digest that follows.


### Hashlinks

By their nature the content of a URL can be modified but will still be referenced by the same URL. This is desirable in most cases but there are some online resources that it is important to be able to ensure that they have not been modified. More specifically, we want to ensure that we always point to the exact resource and, if not, we can immediately know if it was changed. Examples of such resources can be binaries or JSON-LD[^2] resources, etc.

A simple way to accomplished this is to hash the resource itself and later when the resource is revisited hash the content again and ensure the hash remained the same. A hashlink, or cryptographic hyperlink, defines a new URL scheme that allows URL resources to be associated with their hash value.

An example hashlink looks like:

`hl:<resource-hash>:<optional-metadata>`

Where 
* `<resource-hash>` is the multihash of the resource, and
* `<resource-metadata>` is associated metadata to enable a client to locate the actual resource that matches the hashlink.

Metadata example:
<pre><code data-trim class="json">
{
  "url": ["https://kkarasavvas.com/cred.txt"],
  "content-type": "text/plain"
}
</code></pre>
<br/>

Finally, to support existing applications that are using the HTTP URL scheme one can also append the hashlink in the query part of the URL:

`<url>?hl=<resource-hash>`

For more detais consult the [specification](https://tools.ietf.org/html/draft-sporny-hashlink-06).


<br/>
Footnotes:

[^1]: https://ipfs.io
[^2]: https://json-ld.org
