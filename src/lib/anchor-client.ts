
import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useMemo } from 'react';
import { Buffer } from 'buffer';
import { IDL } from './idl';

// Make Buffer available globally for Anchor
globalThis.Buffer = Buffer;

// Your deployed program ID
const PROGRAM_ID = new PublicKey('CFTz6LKRNHgWJhYqPvQFYVjYAiCnkdLbK2KM5FDoUgPg');

export const useAnchorProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    console.log('useAnchorProgram - wallet state:', {
      connected: wallet.connected,
      publicKey: wallet.publicKey?.toString(),
      hasSignTransaction: !!wallet.signTransaction,
      hasSignAllTransactions: !!wallet.signAllTransactions
    });
    
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      console.log('Provider creation failed - missing wallet requirements');
      return null;
    }
    
    console.log('Creating AnchorProvider with connection endpoint:', connection.rpcEndpoint);
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
    console.log('Program creation - provider available:', !!provider);
    console.log('Program ID:', PROGRAM_ID.toString());
    console.log('Connection endpoint:', connection.rpcEndpoint);
    
    if (!provider) {
      console.log('No provider available for program creation');
      return null;
    }
    
    try {
      console.log('Setting provider and creating program...');
      setProvider(provider);
      const newProgram = new Program(IDL, provider);
      console.log('Program created successfully with methods:', Object.keys((newProgram as any).methods || {}));
      return newProgram;
    } catch (error) {
      console.error('Error creating Anchor program:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }, [provider, connection]);

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
