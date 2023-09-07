const ethers = require('ethers');

// Replace with your Ethereum address
const ethereumAddress = '0x9A4a5C159fB41F5AC3E4c7B5aBDCFB531a742d5c';
const infuraApiKey = '72362f3c5a774276a3b19d84dfe57aee'; // Use your Infura API key

// Create an Ethereum provider using Infura
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraApiKey}`);

// Function to fetch MPT proof
async function getMPTProof() {
  const blockNumber = await provider.getBlockNumber();
  const transaction = await provider.getTransactionByBlock(blockNumber, 0); // Adjust the transaction index if needed
  const receipt = await provider.getTransactionReceipt(transaction.hash);
  
  // Use eth_getProof to get the MPT proof
  const proof = await provider.send('eth_getProof', [ethereumAddress, [], blockNumber]);

  return proof;
}

// Function to verify MPT proof
async function verifyMPTProof(proof) {
  const trie = new ethers.Trie(proof.root);
  const key = ethereumAddress.toLowerCase();
  const value = await trie.get(key);

  if (!value) {
    console.error('Account not found');
    return;
  }

  const rootHash = proof.root;
  const expectedRootHash = trie.root;

  if (rootHash === expectedRootHash) {
    console.log('Proof verified successfully!');
  } else {
    console.error('Proof verification failed');
  }
}

// Main function
async function main() {
  try {
    const proof = await getMPTProof();
    await verifyMPTProof(proof);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
