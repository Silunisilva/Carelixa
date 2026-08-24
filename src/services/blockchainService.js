import { ethers } from 'ethers';
import contractData from '../config/contractData.json';

// Hardhat's default local network RPC
const RPC_URL = 'http://127.0.0.1:8545';
// Hardhat's pre-funded Account #0 private key (Standard for all hardhat nodes)
const HARDHAT_DEV_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export const isBlockchainEnabled = () => {
  return import.meta.env.VITE_ENABLE_BLOCKCHAIN === 'true';
};

/**
 * Creates a transaction to grant access on the blockchain.
 * We simulate this by signing it with a local developer wallet.
 */
export const grantConsentOnChain = async (childId, providerId) => {
  if (!contractData) throw new Error("Contract not deployed locally.");
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(HARDHAT_DEV_PK, provider);
    const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

    console.log(`🔗 Blockchain: Granting access for ${childId} to ${providerId}`);
    
    const tx = await contract.grantAccess(childId, providerId);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log(`✅ Blockchain: Transaction confirmed! Hash: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain error:", error);
    throw error;
  }
};

/**
 * Checks if a provider has access on the blockchain.
 */
export const verifyConsentOnChain = async (childId, providerId) => {
  if (!contractData) {
    console.warn("Blockchain missing. Falling back to default block state.");
    return false;
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Read-only, no wallet needed
    const contract = new ethers.Contract(contractData.address, contractData.abi, provider);

    const hasAccess = await contract.checkAccess(childId, providerId);
    return hasAccess;
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return false;
  }
};

/**
 * Utility function to auto-sync existing Firebase links to the local blockchain
 * so that existing data works during the demo!
 */
export const syncExistingLinksToBlockchain = async (links) => {
  if (!isBlockchainEnabled() || !contractData) return;
  
  console.log("🔄 Syncing existing Firebase links to the local blockchain...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(HARDHAT_DEV_PK, provider);
  const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

  for (const link of links) {
    try {
      const hasAccess = await contract.checkAccess(link.childId, link.providerId);
      if (!hasAccess) {
        console.log(`Syncing access for ${link.childId} -> ${link.providerId}...`);
        const tx = await contract.grantAccess(link.childId, link.providerId);
        await tx.wait();
      }
    } catch (e) {
      console.warn("Failed to sync link:", e);
    }
  }
  console.log("✅ Blockchain Sync Complete.");
};
