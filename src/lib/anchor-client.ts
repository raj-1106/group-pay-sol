import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useMemo } from 'react';
import { IDL, RoomiesplitIDL } from './idl';

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
    return new Program(IDL as any, provider);
  }, [provider]);

  return { program, provider };
};

export const getGroupPDA = (creator: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('group'), creator.toBuffer()],
    PROGRAM_ID
  );
};

export const getExpensePDA = (groupKey: PublicKey, expenseCount: number) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('expense'),
      groupKey.toBuffer(),
      Buffer.from(expenseCount.toString().padStart(8, '0'))
    ],
    PROGRAM_ID
  );
};

export { PROGRAM_ID };