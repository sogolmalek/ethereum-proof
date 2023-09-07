const { Web3 } = require('web3');
const Trie = require('merkle-patricia-tree');
const util = require('ethereumjs-util');
const {BaseTrie} = require("merkle-patricia-tree");
const {keccak256, toBuffer, Account, bufferToHex} = require("ethereumjs-util");
// Replace with your Infura API key and Ethereum address
const infuraApiKey = 'https://mainnet.infura.io/v3/72362f3c5a774276a3b19d84dfe57aee';
const ethereumAddress = '0x9A4a5C159fB41F5AC3E4c7B5aBDCFB531a742d5c';

// Create a Web3 instance connected to Infura
const web3 = new Web3(new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/72362f3c5a774276a3b19d84dfe57aee`));

let block_to_verify = BigInt(0);

// Function to fetch MPT proof
async function getMPTProof() {
  const blockNumber = await web3.eth.getBlockNumber();
  block_to_verify = (blockNumber);
  const transaction = await web3.eth.getTransactionFromBlock(blockNumber, 0); // Adjust the transaction index if needed
  const receipt = await web3.eth.getTransactionReceipt(transaction.hash);
  const proof = await web3.eth.getProof(ethereumAddress,   ["0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000001"], blockNumber);
  return proof.accountProof;
}

// Function to verify MPT proof
async function getproof(account_proof) {
  
  let result = await Trie.SecureTrie.fromProof(account_proof.map(util.toBuffer));
  const accountNodeRaw = await result.get(keccak256(toBuffer(ethereumAddress)));
  const account = Account.fromRlpSerializedAccount(accountNodeRaw);
  return result;
}

// Main function
async function main() {

  try {
    let proof_from_web3js = await getMPTProof()
    
    // done
    let block_state = await readBlockHeader(block_to_verify)

    let proof = await getproof(proof_from_web3js);
    
    console.log(" proof.root", proof.root)
    
    const valid = bufferToHex(proof.root) === block_state;
    
    if (valid){
        console.log("Valid proof");
    }else{
        console.log("Invalid proof");
    }
  } catch (err) {
    console.error('Error:', err);
  }
}



async function readBlockHeader(blockNumber) {
  try {
    let blockHeader =  await   web3.eth.getBlock(blockNumber)
    console.log('blockHeader stateRoot:', blockHeader.stateRoot)
    return blockHeader.stateRoot;
  } catch (error) {
    console.error('Error:', error);
  }
}
main();