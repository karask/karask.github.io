---
layout: post
section-type: post
title: Transactions
category: Bitcoin
tags: [ 'bitcoin', 'tutorial', 'python', 'transactions', 'p2pkh', 'scripting']
---


This part of the tutorial will introduce basic Bitcoin transactions and focus on __Pay to Public Key Hash (P2PKH)__ transaction output types. The tutorial is aimed for people who already have some knowledge of how Bitcoin works at a high-level and want to understand how it works at a low-level.

### Transactions
A transaction sends bitcoins from one address to another and it consists of 1+ inputs and 1+ outputs. The inputs of a transaction consist of outputs of previous transactions. When an output is spend it can never be used again[^1]. All the bitcoins are transferred elsewhere (to a recipient, back to yourself as change, etc.). Outputs that are available to be spend are called _Unspent Transaction Outputs (UTXOs)_ and Bitcoin nodes keep track of the complete UTXO set. 

> Each time funds are sent to an address a new output (UTXO) is created. Thus, the balance of an address depends on all the UTXOs that correspond to it. Bitcoin wallets hide UTXOs to make the whole experience friendlier but some wallets allow you to specify which UTXOs you want to spend if needed. When we create transactions programmatically we will deal primarily with UTXOs.

When an output (UTXO) is created we also specify the conditions under which this output can be spend. When you specify an input (the UTXO of a previous transaction) to spend from you have to prove that you satisfy the conditions set by the UTXO.

The spending conditions and the proof that authorizes transfer are not fixed. A scripting language is used to define them. When a new output is created a script is placed in the UTXO called __scriptPubKey__ or more informally _locking script_.

When we want to spend that UTXO we create a new transaction with an input that references the UTXO that we wish to spend together with an _unlocking script_ or more formally a __scriptSig__.

The standard transaction output types supported by the Bitcoin protocol are:
* P2PK (Pay to Public Key - not used anymore)
* P2PKH (Pay to Public Key Hash)
* P2SH (Pay to Script Hash)
* P2WPKH (Pay to Witness Public Key Hash)
* P2WSH (Pay to Witness Script Hash)
* OP_RETURN (Allows for storing up to 80 bytes in an output)
* Multisignature (Legacy multisignature transactions; now P2SH/P2WSH is used instead)
* Non-standard (Any other transaction)[^2]

The most common transaction output type offering a standard way of transferring bitcoins around is P2PKH[^3], which is effectively "pay to a Bitcoin address". It is also possible, and used in the past, to pay directly to a public key with P2PK but that is not used anymore[^4]. Another very important transaction output type is P2SH[^5] which allows locking scripts of arbitrary complexity to be used.

To define a locking and unlocking script we make use of a scripting language, simply called [_Script_](https://en.bitcoin.it/wiki/Script){:target="_blank"}. This relatively simple language consists of several operations each of them identified by an opcode in hexadecimal. It is a simple [stack-based language](https://en.wikipedia.org/wiki/Stack-oriented_programming_language){:target="_blank"} that uses [reverse polish notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation){:target="_blank"} (e.g. `2 3 +`) that does not contain potentially dangerous programming constructs, like loops; it is a [domain-specific language](https://en.wikipedia.org/wiki/Domain-specific_language){:target="_blank"}.

### P2PKH
Let's examine the standard transaction of spending a Pay to Public Key Hash. The locking script (scriptPubKey) that secures the funds in a P2PKH address is the following:

`OP_DUP OP_HASH160 <PKHash> OP_EQUALVERIFY OP_CHECKSIG`

As we have seen in the [Bitcoin addresses](/bitcoin/2020/04/21/bitcoin-addresses.html) post the public key hash (PKHash) can be derived from the Bitcoin address and vice versa. Thus, the above script locks the funds that have been sent in the address that corresponds to that PKHash.

To spends the funds the owner of the private key that corresponds to that address/PKHash need to provide an unlocking script that if we prepend to the locking script the whole script will evaluate to true.

An unlocking script for a P2PKH will look like this:

`<Signature> <PublicKey>`

Using the private key we provide an ECDSA signature of part of the transaction that we create[^6]. We also provide the public key[^7] for additional verification.

The validation to spend a UTXO consists of running the script of scriptSig plus scriptPubKey. Both scripts are added in the stack and executed as one script.

### Validation of P2PKH spending
We will describe the validation process in steps as the script is executed. In each step the element evaluated will be highlighted and the current stack will also be displayed.

**Step 0**: Execution starts. Stack is empty.

_SCRIPT_: `<Signature> <PublicKey> OP_DUP OP_HASH160 <PKHash> OP_EQUALVERIFY OP_CHECKSIG`  
_STACK_:  


**Step 1**: First element is evaluated. It consists of data so it goes into the stack.

_SCRIPT_: `∎<Signature>∎ <PublicKey> OP_DUP OP_HASH160 <PKHash> OP_EQUALVERIFY OP_CHECKSIG`  
_STACK_: `<Signature>`

**Step 2**: Second element is also data and goes into the stack.

_SCRIPT_: `<Signature> ∎<PublicKey>∎ OP_DUP OP_HASH160 <PKHash> OP_EQUALVERIFY OP_CHECKSIG`  
_STACK_: `<Signature> <PublicKey>`


**Step 3**: Next element is an operator that duplicates the top element of the stack.

_SCRIPT_: `<Signature> <PublicKey> ∎OP_DUP∎ OP_HASH160 <PKHash> OP_EQUALVERIFY OP_CHECKSIG`  
_STACK_: `<Signature> <PublicKey> <PublicKey>`


**Step 4**: Next element is an operator that calcuates the HASH160 of the top stack element. HASH160 is equivalent to RIPEMD160( SHA256( element ) ) which is what is needed to calculate the PKH from a public key.

_SCRIPT_: `<Signature> <PublicKey> OP_DUP ∎OP_HASH160∎ <PKHash> OP_EQUALVERIFY OP_CHECKSIG`  
_STACK_: `<Signature> <PublicKey> <PKHash>`

**Step 5**: Next element is data and it is pushed into the stack.

_SCRIPT_: `<Signature> <PublicKey> OP_DUP OP_HASH160 ∎<PKHash>∎ OP_EQUALVERIFY OP_CHECKSIG`  
_STACK_: `<Signature> <PublicKey> <PKHash> <PKHash>`

**Step 6**: Next element is an operator that checks if the top two elements of the stack are equal and fails the script if they are not. Effectively this validates that the public key provided is indeed the one that corresponds to the PKH (or address) that we are trying to spend.

_SCRIPT_: `<Signature> <PublicKey> OP_DUP OP_HASH160 <PKHash> ∎OP_EQUALVERIFY∎ OP_CHECKSIG`  
_STACK_: `<Signature> <PublicKey>`

**Step 7**: Next element is an operator that expects two elements from the stack; a signature and a public key that corresponds to that signature. If the signature is valid it returns true, otherwise false.

_SCRIPT_: `<Signature> <PublicKey> OP_DUP OP_HASH160 <PKHash> OP_EQUALVERIFY ∎OP_CHECKSIG∎`  
_STACK_: `true`

Since the script finished and the only element in the stack is now **true**[^8] the node validated ownership of the UTXO and it is allowed to be spent. Success!

All the operators, or opcodes, and their explanations can be found [here](https://en.bitcoin.it/wiki/Script){:target="_blank"}. 

To help clarify how addresses, locking scripts and UTXOs relate we provide the following diagram. Addresses 1Zed, 1Alice and 1Bob are short for the actual bitcoin addresses of Zed, Alice and Bob respectively. The diagram emphasises what happens when funds are sent to an address.

![Addresses, Locking scripts and UTXOs](/assets/images/address_p2pkh_utxos.png)

This post explained how funds residing in UTXOs are locked/unlocked and how scripts are evaluated for validation. In the next post we will go through several examples of how we can create simple transactions programmatically.

<br/><br/>

Footnotes:

[^1]: Think of cash. If you give a 20 euro note you can never reuse it. You might be given change but it will be different notes or coins.
[^2]: Valid Non-standard transactions (containing scripts other than those defined by the standard transaction output type scripts) are rejected and not relayed by nodes. However, they can be mined if it is arranged with a miner.
[^3]: And P2WPKH, which was introduced with the segwit upgrade and will be discussed in anohter post.
[^4]: PKHs are shorter and thus more convenient.
[^5]: And P2WSH, which was introduced with the segwit upgrade and will be discussed in anohter post.
[^6]: The signing process will be explained in detail in a future blog post.
[^7]: As we have already discussed the public key only appears in the blockchain after we spend from an address. This is where it appears!
[^8]: To be more precise the result is `1`.
   
