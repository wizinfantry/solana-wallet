# solana-wallet

A lightweight JavaScript library for interacting with the Solana blockchain, providing functionalities for wallet creation, SOL and SPL token balance retrieval, and transfers.

## Installation

```bash
npm install solana-wallet
```

## Usage

This library requires you to initialize the Solana connection before using its functions. Use the `initializeSolanaConnection` function for this purpose.

### 1. Initialize Solana Connection

```javascript
import { initializeSolanaConnection } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js'; // Required for clusterApiUrl

// Initialize with Devnet (default if rpcUrl is omitted)
initializeSolanaConnection(); 
console.log("Connected to Devnet");

// Initialize with Mainnet-beta
initializeSolanaConnection(clusterApiUrl('mainnet-beta'));
console.log("Connected to Mainnet-beta");

// Initialize with a custom RPC URL
initializeSolanaConnection('https://api.devnet.solana.com', 'processed'); // Example custom URL and commitment
console.log("Connected to custom RPC");
```

### 2. Create a New Wallet

```javascript
import { initializeSolanaConnection, createWallet } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js';

initializeSolanaConnection(clusterApiUrl('devnet')); // Initialize connection first

const newWallet = createWallet();
console.log('New Wallet Public Key:', newWallet.publicKey);
console.log('New Wallet Private Key:', newWallet.privateKey);
```

### 3. Create Wallet from Private Key

```javascript
import { initializeSolanaConnection, createWalletFromPrivateKey } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js';

initializeSolanaConnection(clusterApiUrl('devnet')); // Initialize connection first

const privateKey = 'YOUR_BASE58_PRIVATE_KEY'; // Replace with your Base58 encoded private key
const wallet = createWalletFromPrivateKey(privateKey);
console.log('Wallet Public Key:', wallet.publicKey);
```

### 4. Get SOL Balance

```javascript
import { initializeSolanaConnection, getSolBalance } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js';

initializeSolanaConnection(clusterApiUrl('devnet')); // Initialize connection first

const publicKey = 'YOUR_PUBLIC_KEY'; // Replace with a Solana public key
getSolBalance(publicKey).then(data => {
    console.log(`SOL Balance for ${data.publicKey}: ${data.balance} SOL`);
}).catch(error => {
    console.error('Error:', error.message);
});
```

### 5. Send SOL

```javascript
import { initializeSolanaConnection, sendSol } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js';

initializeSolanaConnection(clusterApiUrl('devnet')); // Initialize connection first

const fromPrivateKey = 'YOUR_SENDER_PRIVATE_KEY'; // Replace with sender's Base58 private key
const toPublicKey = 'RECIPIENT_PUBLIC_KEY';     // Replace with recipient's public key
const amount = 0.01; // Amount in SOL

sendSol(fromPrivateKey, toPublicKey, amount).then(data => {
    console.log('SOL Sent! Transaction Signature:', data.transactionSignature);
}).catch(error => {
    console.error('Error:', error.message);
});
```

### 6. Get SPL Token Balance

```javascript
import { initializeSolanaConnection, getSplBalance } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js';

initializeSolanaConnection(clusterApiUrl('devnet')); // Initialize connection first

const publicKey = 'YOUR_PUBLIC_KEY';       // Replace with a Solana public key
const tokenAddress = 'YOUR_TOKEN_ADDRESS'; // Replace with the SPL token mint address

getSplBalance(publicKey, tokenAddress).then(data => {
    console.log(`SPL Balance for ${data.publicKey} (${data.tokenAddress}): ${data.balance}`);
}).catch(error => {
    console.error('Error:', error.message);
});
```

### 7. Send SPL Token

```javascript
import { initializeSolanaConnection, sendSplToken } from 'solana-wallet-js';
import { clusterApiUrl } from '@solana/web3.js';

initializeSolanaConnection(clusterApiUrl('devnet')); // Initialize connection first

const fromPrivateKey = 'YOUR_SENDER_PRIVATE_KEY'; // Replace with sender's Base58 private key
const toPublicKey = 'RECIPIENT_PUBLIC_KEY';     // Replace with recipient's public key
const amount = 1; // Amount of SPL tokens (human-readable units)
const tokenAddress = 'YOUR_TOKEN_ADDRESS'; // Replace with the SPL token mint address

// Note: If the recipient's associated token account for this token does not exist,
// it will be automatically created as part of this transaction.
sendSplToken(fromPrivateKey, toPublicKey, amount, tokenAddress).then(data => {
    console.log('SPL Token Sent! Transaction Signature:', data.transactionSignature);
}).catch(error => {
    console.error('Error:', error.message);
});
```

## Development

To run tests or contribute, clone the repository and install dependencies:

```bash
git clone https://github.com/wizinfantry/solana-wallet.git
cd solana-wallet
npm install
```

## License

ISC