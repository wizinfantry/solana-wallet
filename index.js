import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, getMint, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import bs58 from 'bs58';

let connection;

/**
 * Initializes the Solana connection with a specified RPC URL and commitment level.
 * If no RPC URL is provided, it defaults to Solana Devnet.
 * @param {string} [rpcUrl] - The RPC URL for the Solana cluster (e.g., clusterApiUrl('mainnet-beta'), or a custom URL).
 * @param {string} [commitment='confirmed'] - The commitment level for the connection.
 */
export const initializeSolanaConnection = (rpcUrl, commitment = 'confirmed') => {
    const finalRpcUrl = rpcUrl || clusterApiUrl('devnet');
    connection = new Connection(finalRpcUrl, commitment);
    console.log(`Solana connection initialized to: ${finalRpcUrl} with commitment: ${commitment}`);
};

const ensureConnectionInitialized = () => {
    if (!connection) {
        throw new Error('Solana connection not initialized. Call initializeSolanaConnection() first.');
    }
};

/**
 * Generates a new Solana keypair and returns its public and private keys (Base58 encoded).
 * @returns {Object} An object containing the publicKey and privateKey.
 */
export const createWallet = () => {
    try {
        const keypair = Keypair.generate();
        const privateKey = bs58.encode(keypair.secretKey);
        const publicKey = keypair.publicKey.toBase58();

        return {
            publicKey: publicKey,
            privateKey: privateKey
        };
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw new Error('Failed to create wallet.');
    }
};

/**
 * Loads a wallet from a given Base58 encoded private key.
 * @param {string} privateKey - The Base58 encoded private key.
 * @returns {Object} An object containing the publicKey and privateKey.
 */
export const createWalletFromPrivateKey = (privateKey) => {
    try {
        if (!privateKey) {
            throw new Error('Private key is required.');
        }
        const secretKey = bs58.decode(privateKey);
        const keypair = Keypair.fromSecretKey(secretKey);
        const publicKey = keypair.publicKey.toBase58();

        return {
            publicKey: publicKey,
            privateKey: privateKey
        };
    } catch (error) {
        console.error("Error creating wallet with private key:", error);
        throw new Error('Failed to create wallet from private key.');
    }
};

/**
 * Retrieves the native SOL balance for a given public key.
 * @param {string} publicKey - The Base58 encoded public key.
 * @returns {Object} An object containing the publicKey and balance in SOL.
 */
export const getSolBalance = async (publicKey) => {
    ensureConnectionInitialized();
    try {
        if (!publicKey) {
            throw new Error('Public key is required.');
        }
        const publicKeyObj = new PublicKey(publicKey);
        const balance = await connection.getBalance(publicKeyObj);
        return {
            publicKey: publicKey,
            balance: balance / LAMPORTS_PER_SOL
        };
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        throw new Error('Failed to fetch SOL balance.');
    }
};

/**
 * Sends native SOL from one address to another.
 * @param {string} fromPrivateKey - The Base58 encoded private key of the sender.
 * @param {string} toPublicKey - The Base58 encoded public key of the recipient.
 * @param {number} amount - The amount of SOL to send.
 * @returns {Object} An object containing the transactionSignature.
 */
export const sendSol = async (fromPrivateKey, toPublicKey, amount) => {
    ensureConnectionInitialized();
    try {
        if (!fromPrivateKey || !toPublicKey || amount === undefined || amount <= 0) {
            throw new Error('Missing required fields: fromPrivateKey, toPublicKey, or amount must be a positive number.');
        }

        const fromSecretKey = bs58.decode(fromPrivateKey);
        const fromKeypair = Keypair.fromSecretKey(fromSecretKey);

        const toPublicKeyObj = new PublicKey(toPublicKey);
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toPublicKeyObj,
                lamports: amount * LAMPORTS_PER_SOL
            })
        );

        const signature = await connection.sendTransaction(transaction, [fromKeypair]);
        await connection.confirmTransaction(signature);

        return { transactionSignature: signature };
    } catch (error) {
        console.error("Error sending SOL:", error);
        throw new Error('Failed to send SOL.');
    }
};

/**
 * Retrieves the balance of a specific SPL token for a given public key.
 * @param {string} publicKey - The Base58 encoded public key.
 * @param {string} tokenAddress - The Base58 encoded address of the SPL token mint.
 * @returns {Object} An object containing the publicKey, tokenAddress, and balance.
 */
export const getSplBalance = async (publicKey, tokenAddress) => {
    ensureConnectionInitialized();
    try {
        if (!publicKey || !tokenAddress) {
            throw new Error('Missing required fields: publicKey or tokenAddress.');
        }

        const publicKeyObj = new PublicKey(publicKey);
        const tokenAddressObj = new PublicKey(tokenAddress);

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKeyObj, {
            mint: tokenAddressObj
        });

        const balance = tokenAccounts.value.length > 0
            ? tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
            : 0;

        return {
            publicKey: publicKey,
            tokenAddress: tokenAddress,
            balance: balance
        };
    } catch (error) {
        console.error("Error fetching SPL balance:", error);
        throw new Error('Failed to fetch SPL balance.');
    }
};

/**
 * Sends a specified amount of an SPL token from one address to another.
 * If the recipient's associated token account does not exist, it will be created.
 * @param {string} fromPrivateKey - The Base58 encoded private key of the sender.
 * @param {string} toPublicKey - The Base58 encoded public key of the recipient.
 * @param {number} amount - The amount of SPL tokens to send (human-readable units).
 * @param {string} tokenAddress - The Base58 encoded address of the SPL token mint.
 * @returns {Object} An object containing the transactionSignature.
 */
export const sendSplToken = async (fromPrivateKey, toPublicKey, amount, tokenAddress) => {
    ensureConnectionInitialized();
    try {
        if (!fromPrivateKey || !toPublicKey || amount === undefined || amount <= 0 || !tokenAddress) {
            throw new Error('Missing required fields: fromPrivateKey, toPublicKey, amount (positive number), or tokenAddress.');
        }

        const fromSecretKey = bs58.decode(fromPrivateKey);
        const fromKeypair = Keypair.fromSecretKey(fromSecretKey);

        const toPublicKeyObj = new PublicKey(toPublicKey);
        const tokenAddressObj = new PublicKey(tokenAddress);

        // Fetch mint information to get decimals
        const mintInfo = await getMint(connection, tokenAddressObj);

        const fromTokenAccount = await getAssociatedTokenAddress(tokenAddressObj, fromKeypair.publicKey);
        let toTokenAccount = await getAssociatedTokenAddress(tokenAddressObj, toPublicKeyObj);

        const transaction = new Transaction();

        // Check if recipient's associated token account exists, if not, create it
        const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
        if (toTokenAccountInfo === null) {
            transaction.add(createAssociatedTokenAccountInstruction(
                fromKeypair.publicKey, // Payer
                toTokenAccount,        // Associated Token Account to create
                toPublicKeyObj,        // Owner of the new account
                tokenAddressObj        // Mint of the token
            ));
        }

        transaction.add(
            createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromKeypair.publicKey,
                amount * Math.pow(10, mintInfo.decimals), // Use fetched decimals
                [],
                TOKEN_PROGRAM_ID
            )
        );

        const signature = await connection.sendTransaction(transaction, [fromKeypair]);
        await connection.confirmTransaction(signature);

        return { transactionSignature: signature };
    } catch (error) {
        console.error("Error sending SPL token:", error);
        throw new Error('Failed to send SPL token.');
    }
};
