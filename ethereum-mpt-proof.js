const { Web3 } = require('web3');
const Trie = require('merkle-patricia-tree');
const util = require('ethereumjs-util');

// Replace with your Infura API key and Ethereum address
const infuraApiKey = 'https://mainnet.infura.io/v3/72362f3c5a774276a3b19d84dfe57aee';
const ethereumAddress = '0x9A4a5C159fB41F5AC3E4c7B5aBDCFB531a742d5c';

// Create a Web3 instance connected to Infura
const web3 = new Web3(`https://mainnet.infura.io/v3/72362f3c5a774276a3b19d84dfe57aee`);




// Function to fetch MPT proof
async function getMPTProof() {
  const blockNumber = await web3.eth.getBlockNumber();
  const transaction = await web3.eth.getTransactionFromBlock(blockNumber, 0); // Adjust the transaction index if needed
  const receipt = await web3.eth.getTransactionReceipt(transaction.hash);
  const proof = await web3.eth.getProof(receipt.blockNumber, [ethereumAddress], blockNumber);
  return proof;
}

// Function to verify MPT proof
function verifyMPTProof(proof) {
  const trie = new Trie();
  trie.fromProof(proof.accountProof);
  
  const key = util.toBuffer(ethereumAddress);
  const value = trie.get(key);

  if (!value) {
    console.error('Account not found');
    return;
  }

  const rootHash = util.toBuffer(proof.root);
  const expectedRootHash = trie.root;

  if (rootHash.equals(expectedRootHash)) {
    console.log('Proof verified successfully!');
  } else {
    console.error('Proof verification failed');
  }
}

// Main function
async function main() {
  try {
    const proof = await getMPTProof();
    verifyMPTProof(proof);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
