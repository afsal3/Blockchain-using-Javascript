const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');

//block chain data structure
function Blockchain() {
    this.chain = []; // for storing blocks
    this.pendingTransaction = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.createNewBlock(100, 0, 0); // for genesis block - first block
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransaction,
        nonce: nonce, //proof of work, it is a number
        hash: hash, // all transaction compressed into a single string
        previousBlockHash: previousBlockHash // hash of prevous block
    };

    this.pendingTransaction = [];
    this.chain.push(newBlock);

    return newBlock;
}

Blockchain.prototype.getlastBlock = function () {
    return this.chain[this.chain.length - 1]
}

Blockchain.prototype.createTransaction = function (amount, sender, receiver) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        receiver: receiver,
        transactionId: uuid().split('-').join('')
    }

    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {
    this.pendingTransaction.push(transactionObj);
    return this.getlastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
}

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function (blockchain) {
    let validChain = true;
    for (i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1]
        const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index']});
        if (blockHash.substring(0, 4) !== '0000') validChain = false;
        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;
    };
    //validating 1st block
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;

    return validChain;
};

Blockchain.prototype.getBlock = function(blockHash){
    let currentBlock = null;
    this.chain.forEach(block =>{
        if(block.hash === blockHash) currentBlock=block;
    });
    return currentBlock;
};

Blockchain.prototype.getTransaction = function(transactionId){
    let currentTransaction = null;
    let currentBlock = null;
    this.chain.forEach(block =>{
        block.transactions.forEach(transaction =>{
            if(transaction.transactionId === transactionId){
                currentTransaction = transaction;
                currentBlock = block;
            };
        });
    });
    return {
        transaction: currentTransaction,
        block: currentBlock
    };
};

Blockchain.prototype.getAddressData = function(address){
    const addressTransactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction =>{
            if(transaction.sender === address || transaction.recipient === address){
                addressTransactions.push(transaction);
            }
        });
    });
    
    let balance=0;
    addressTransactions.forEach(transaction=>{
        if(transaction.recipient === address) balance += transaction.amount
        if(transaction.sender === address) balance -= transaction.amount
    });

    return{
        addressTransactions: addressTransactions,
        addressBalance: balance
    }
}


module.exports = Blockchain;