---
layout: post
section-type: post
title: Signatures
category: Bitcoin
tags: [ 'bitcoin', 'signatures', 'tutorial' ]
---

In this post we will talk about how and what needs to be signed to prove ownership of funds residing in specific addresses. The tutorial assumes high-level understanding of Bitcoin and at least having gone through the previous technical articles of this tutorial.

When we create a new transaction we need to provide a signature for each UTXO that we want to spent. For a P2PKH UTXO the signature proves:

* that the signer is the owner of the private key
* the proof of authorization is undeniable
* the parts of the tx that were signed cannot be modified after it has been signed

The digital signature algorithm used is ECDSA and each signature is serialized using DER. There are different ways to sign inputs of a transaction so as to provide different commitments. For example: "I agree to spend this input and sign it as long as no one can change the outputs I specified". To specify these commitments, i.e. which parts of the transaction will be signed, we add a special 1 byte flag called SIGHASH at the end of the DER signature.

Each transaction input needs to be signed separately from others. Parts of the new transaction will be hashed to create a digest and the digest is what is signed and included in the unlocking script. To determine which parts are hashed the following rules are followed:


* all other inputs' unlocking scripts (scriptSigs) should be empty
* the input’s unlocking script (scriptSig), the one that we sign, should be set to the locking script (scriptPubKey) of the UTXO that we are trying to spend
* follow additional rules according to the SIGHASH flag

The possible SIGHASH flags, values and meaning are:

1. __ALL (0x01)__  
Signs all the inputs and outputs, protecting everything except the signature scripts against modification. This transaction is final and no one can modify it without invalidating this signature.
1. __NONE (0x02)__  
Signs all of the inputs but none of the outputs, allowing anyone to change where the satoshis are going. A miner will always be able to send the funds to his address. This flag is useful in combination with another inputs' signatures using, say, __ALL__ to secure the outputs. It can be used as a blank check.
1. __SINGLE (0x03)__  
Sign all the inputs and only one output, the one corresponding to this input (the output with the same output index number as this input), ensuring nobody can change your part of the transaction but allowing other signers to change their part of the transaction. The corresponding output must exist. It can be used if someone creates a transaction with some inputs that they cannot spend and specific outputs and then send to the other participants to sign (with __ALL__ or __SINGLE__), if they agree.
1. __ALL|ANYONECANPAY (0x81)__  
Signs only this one input and all the outputs. It allows anyone to add or remove inputs, so anyone can contribute additional satoshis but they cannot change how many satoshis are sent not where they go. It can be used to implement kickstarter-style crowdfunding.
1. __NONE|ANYONECANPAY (0x82)__  
Signs only this one input and allows anyone to add or remove other inputs or outputs, so anyone who gets a copy of this input can spend it however they’d like. This input can be spend even in another transaction!
1. __SINGLE|ANYONECANPAY (0x83)__  
Signs this one input and its corresponding output. Allows anyone to add or remove other inputs. A potential use would be as a means to exchange colored coin[^1] tokens with satoshis. For example, one can create a transaction that has an input which holds 10 of their tokens and an output of 10 million satoshis to an address that they own. This transaction would be invalid since the inputs do not provide the 10 million satoshis but it can be shared with others. If someone wants to claim the 10 tokens they can add an input with at least 10 million satoshis and an output that sends the 10 tokens to them. This would complete the transaction which can then be broadcasted.

![Two inputs, two outputs transaction example](/assets/images/2inputs2outputsTX.png)

For an example of __SINGLE__, consider creating the transaction shown above. Alice needs to pay 1.5 bitcoins to Zed and they agreed with Bob that he will contribute 0.5 of that amount. Then Alice creates a transaction with two inputs, UTXO<sub>1</sub> that she owns (with 1 BTC) and UTXO<sub>2</sub> that Bob owns (with 1 BTC) and a single output that sends 1.5 bitcoins to Zed. She signed UTXO<sub>1</sub> with SIGHASH __SINGLE__ and sends the incomplete transaction to Bob. Bob cannot choose a UTXO other than UTXO<sub>2</sub> since it will invalidate Alice's signature of UTXO<sub>1</sub>. However, he is free to add other outputs so he creates an output that sends the remaining bitcoins (he agreed to pay only 0.5) to one of his addresses. He can then sign UTXO<sub>2</sub> with SIGHASH __ALL__ which will effectively finalize the transaction[^2].

Note that:

* The sequence numbers of other inputs are not included in the signature, and can be updated.
* As already demonstrated above, with multiple inputs, each signature hash type can sign different parts of the transaction. If a 2-input transaction has one input signed with NONE and the other with ALL, the ALL signer can choose where to spend the funds without consulting the NONE signer.


<br/><br/>

Footnotes:

[^1]: [Colored Coins](https://en.bitcoin.it/wiki/Colored_Coins#:~:text=A%20colored%20coins%20wallet%20can,for%20some%20goods%20or%20services){:target="_blank"}
[^2]: No more input or output changes are allowed without invalidating this signature.
