import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { IDL } from './idl';

// Make Buffer available globally for Anchor
globalThis.Buffer = Buffer;

// Your deployed program ID
const PROGRAM_ID = new PublicKey('CFTz6LKRNHgWJhYqPvQFYVjYAiCnkdLbK2KM5FDoUgPg');

export const useAnchorProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }

    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      } as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    setProvider(provider);
    return new Program(IDL as any, PROGRAM_ID, provider);
  }, [provider]);

  return { program, provider };
};

// ✅ Updated Group PDA helper
export const getGroupPDA = (creator: PublicKey, groupId: BN) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('group'),
      creator.toBuffer(),
      groupId.toArrayLike(Buffer, 'le', 8), // u64 little-endian
    ],
    PROGRAM_ID
  );
};

// ✅ Updated Expense PDA helper
export const getExpensePDA = (groupKey: PublicKey, expenseCount: BN) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('expense'),
      groupKey.toBuffer(),
      expenseCount.toArrayLike(Buffer, 'le', 8), // u64 little-endian
    ],
    PROGRAM_ID
  );
};

export { PROGRAM_ID };
