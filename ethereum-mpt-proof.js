const { Web3 } = require("web3");
const Trie = require("merkle-patricia-tree");
const util = require("ethereumjs-util");
const {BaseTrie} = require("merkle-patricia-tree");
const {keccak256, toBuffer, Account, bufferToHex} = require("ethereumjs-util");
import dotenv from "dotenv";
dotenv.config();

// Function to fetch MPT proof for the given block number
async function getMPTProof(publicKey, blockNumberToVerify) {
  // Adjust the transaction index if needed
  const transaction = await web3.eth.getTransactionFromBlock(blockNumberToVerify, 0);
  const receipt = await web3.eth.getTransactionReceipt(transaction.hash);
  const proof = await web3.eth.getProof(
    // Address of account or contract
    publicKey,
    // Storage-keys to be proofed and included
    [
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    ],
    // TODO: Replace with with pre-defined block number "latest".
    blockNumber
  );
  return proof.accountProof;
}

// Function to read state root from the block header of a given block number
async function readBlockHeader(blockNumber) {
  try {
    const blockHeader =  await web3.eth.getBlock(blockNumber);
    console.log("blockHeader stateRoot:", blockHeader.stateRoot);

    return blockHeader.stateRoot;
  } catch (error) {
    console.error("Error:", error);
  }
}

// Function to verify that a transaction occurred using a given account for in the
// given MPT proof state trie that is associated with a specific block
async function getProof(proofBlock) {
  let result = await Trie.SecureTrie.fromProof(proofBlock.map(util.toBuffer));
  const accountNodeRaw = await result.get(keccak256(toBuffer(publicKey)));
  const account = Account.fromRlpSerializedAccount(accountNodeRaw);
  return account;
}

async function main() {
  let providerURI = process.env.PROVIDER_URI;
  // TODO: could provide API with multiple endpoints that allows user to specify a specific block number
  // to be verified
  let specificBlockNumberToVerify = BigInt(0);
  const publicKey = process.env.ETHEREUM_ADDRESS_PUBLIC_KEY;

  if (!providerURI || providerURI === "") {
    // Fallback to locally running light client
    providerURI = "http://127.0.0.1:8545";
  }

  // Create a Web3 instance connected to provider
  const web3 = new Web3(new Web3.providers.HttpProvider(providerURI));

  try {
    // TODO: instead of just the current block, replace this with the latest block that has also been finalized
    // similar to how it is done at this link https://github.com/ltfschoen/axiom-quickstart/blob/main/src/index.ts#L86
    const blockNumberToVerify = await web3.eth.getBlockNumber() || specificBlockNumberToVerify;
    let proofBlock = await getMPTProof(publicKey, blockNumberToVerify);
    let blockStateRoot = await readBlockHeader(blockNumberToVerify);
    let proof = await getProof(proofBlock);
    console.log("proof.root", proof.root);
    const valid = bufferToHex(proof.root) === blockStateRoot;

    if (valid){
      console.log("Valid proof");
    }else{
      console.log("Invalid proof");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
