const { Web3, Transaction } = require("web3");
const Trie = require("merkle-patricia-tree");
const util = require("ethereumjs-util");
const { BaseTrie } = require("merkle-patricia-tree");
const { keccak256, toBuffer, bufferToHex } = require("ethereumjs-util");
const dotenv = require("dotenv");
dotenv.config();

// Function to fetch MPT proof for the given address and block number
async function getMPTProof(publicKey, blockNumberToVerify, web3) {
  try {
    const transaction = await web3.eth.getTransactionFromBlock(blockNumberToVerify, 0);
    const receipt = await web3.eth.getTransactionReceipt(transaction.hash);

    // Specify the storage keys you want to prove for the address
    const storageKeysToProof = [
      util.addHexPrefix(util.bufferToHex(util.toBuffer("0x00"))), // Replace with your desired storage key
      util.addHexPrefix(util.bufferToHex(util.toBuffer("0x01")))  // Replace with another desired storage key
    ];

    const proof = await web3.eth.getProof(publicKey, storageKeysToProof, blockNumberToVerify);
    return proof;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Function to verify MPT proof for the given address and block number
async function verifyMPTProof(publicKey, blockNumberToVerify, web3) {
  try {
    const proof = await getMPTProof(publicKey, blockNumberToVerify, web3);
    const stateRoot = await web3.eth.getStateRoot(blockNumberToVerify);

    // Create a Patricia Trie from the proof
    const trie = new Trie(new BaseTrie(proof.storageHash, web3.eth.db));

    // Verify the proof
    for (const key of Object.keys(proof.accountProof)) {
      const value = await trie.get(key);
      if (value === null) {
        console.log("Invalid proof: Key not found in the trie");
        return false;
      }
    }

    // Verify the state root
    if (stateRoot === proof.stateRoot) {
      console.log("Valid proof");
      return true;
    } else {
      console.log("Invalid proof: State root mismatch");
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

async function main() {
  let providerURI = process.env.PROVIDER_URI;
  let specificBlockNumberToVerify = BigInt(0);
  const publicKey = process.env.ETHEREUM_ADDRESS_PUBLIC_KEY;

  if (!providerURI || providerURI === "") {
    providerURI = "http://127.0.0.1:8545"; // Fallback to a local Ethereum node
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(providerURI));

  try {
    const blockNumberToVerify = await web3.eth.getBlockNumber() || specificBlockNumberToVerify;
    const isValid = await verifyMPTProof(publicKey, blockNumberToVerify, web3);

    if (isValid) {
      console.log("Address state is valid in the specified block.");
    } else {
      console.log("Address state is invalid in the specified block.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
