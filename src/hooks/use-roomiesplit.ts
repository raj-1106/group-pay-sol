import { useAnchorProgram, getGroupPDA, getExpensePDA } from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useToast } from './use-toast';

export interface OnChainGroup {
  creator: PublicKey;
  members: PublicKey[];
  totalExpenses: BN;
  expenseCount: BN;
  balances: Array<{
    member: PublicKey;
    owed: BN;
    spent: BN;
  }>;
}

export interface OnChainExpense {
  expenseId: BN;
  group: PublicKey;
  payer: PublicKey;
  amount: BN;
  description: string;
}

export const useRoomiesplit = () => {
  const { program } = useAnchorProgram();
  const { publicKey, signTransaction } = useWallet();
  const { toast } = useToast();

  const createGroup = async (memberAddresses: string[]) => {
    console.log('=== CREATE GROUP DEBUG START ===');
    console.log('Input memberAddresses:', memberAddresses);
    console.log('Program available:', !!program);
    console.log('PublicKey available:', !!publicKey);
    console.log('SignTransaction available:', !!signTransaction);
    
    // Additional program debugging
    if (program) {
      console.log('Program methods available:', Object.keys((program as any).methods || {}));
      console.log('Program IDL version:', (program as any).idl?.version);
      console.log('Program provider endpoint:', (program as any).provider?.connection?.rpcEndpoint);
    }
    
    if (!program || !publicKey || !signTransaction) {
      const missing = [];
      if (!program) missing.push('program');
      if (!publicKey) missing.push('publicKey');
      if (!signTransaction) missing.push('signTransaction');
      
      console.log('Missing requirements:', missing);
      const errorMsg = `Missing: ${missing.join(', ')}`;
      toast({
        title: "Connection Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    try {
      console.log('Step 1: Converting member addresses to PublicKeys...');
      const members = memberAddresses.map((addr, index) => {
        console.log(`  Converting address ${index}: ${addr}`);
        try {
          return new PublicKey(addr);
        } catch (err) {
          console.error(`  Failed to convert address ${index}:`, err);
          throw new Error(`Invalid address at index ${index}: ${addr}`);
        }
      });
      console.log('Members as PublicKeys:', members.map(m => m.toString()));
      
      console.log('Step 2: Getting group PDA...');
      const [groupPDA, bump] = getGroupPDA(publicKey);
      console.log('Group PDA:', groupPDA.toString());
      console.log('PDA bump:', bump);
      
      // Check if group already exists
      try {
        const existingGroup = await (program as any).account.group.fetch(groupPDA);
        if (existingGroup) {
          throw new Error('Group already exists for this wallet. Each wallet can only create one group.');
        }
      } catch (fetchError: any) {
        // If fetch fails, group doesn't exist - this is good, we can proceed
        if (!fetchError.message?.includes('Account does not exist')) {
          console.log('Unexpected error checking existing group:', fetchError);
        }
      }

      console.log('Step 3: Preparing transaction...');
      console.log('Transaction accounts:', {
        group: groupPDA.toString(),
        creator: publicKey.toString(),
        systemProgram: SystemProgram.programId.toString()
      });

      console.log('Step 4: Calling createGroup method...');
      
      // Check if the method exists
      if (!(program as any).methods?.createGroup) {
        console.error('createGroup method not found on program');
        console.log('Available methods:', Object.keys((program as any).methods || {}));
        throw new Error('createGroup method not available on program');
      }

      const tx = await (program as any).methods
        .createGroup(members)
        .accounts({
          group: groupPDA,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Step 5: Transaction successful!');
      console.log('Transaction signature:', tx);
      console.log('=== CREATE GROUP DEBUG END ===');
      
      toast({
        title: "Group Created!",
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });

      return { groupAddress: groupPDA, transaction: tx };
    } catch (error: any) {
      console.log('=== CREATE GROUP ERROR DEBUG ===');
      console.error('Full error object:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error logs:', error?.logs);
      console.error('Error stack:', error?.stack);
      
      // Check for specific Solana/Anchor errors
      if (error?.message) {
        console.log('Analyzing error message:', error.message);
        if (error.message.includes('0x0')) {
          console.log('Program error code 0x0 detected');
        }
        if (error.message.includes('Program log:')) {
          console.log('Program logs found in error');
        }
      }
      
      let errorDescription = "Failed to create group on-chain";
      
      if (error?.message?.includes('Program log: AnchorError')) {
        errorDescription = "Anchor program error - check if program is deployed";
      } else if (error?.message?.includes('Account does not exist')) {
        errorDescription = "Program not found on devnet - check deployment";
      } else if (error?.message?.includes('insufficient funds')) {
        errorDescription = "Insufficient SOL for transaction fees";
      } else if (error?.message?.includes('0x0')) {
        errorDescription = "Program execution failed - check program logic";
      } else if (error?.message) {
        errorDescription = error.message;
      }
      
      console.log('Final error description:', errorDescription);
      console.log('=== CREATE GROUP ERROR DEBUG END ===');
      
      toast({
        title: "Error",
        description: errorDescription,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addExpense = async (
    groupCreator: PublicKey,
    amount: number,
    description: string
  ) => {
    if (!program || !publicKey || !signTransaction) {
      throw new Error('Wallet not connected or program not available');
    }

    try {
      const [groupPDA] = getGroupPDA(groupCreator);
      
      // Fetch group to get current expense count
      const groupAccount = await (program as any).account.group.fetch(groupPDA) as OnChainGroup;
      const expenseCount = groupAccount.expenseCount.toNumber();
      
      const [expensePDA] = getExpensePDA(groupPDA, expenseCount);

      // Convert amount to lamports (assuming amount is in SOL)
      const amountLamports = new BN(amount * 1000000000); // 1 SOL = 1B lamports

      const tx = await (program as any).methods
        .addExpense(amountLamports, description)
        .accounts({
          group: groupPDA,
          expense: expensePDA,
          payer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast({
        title: "Expense Added!",
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });

      return { expenseAddress: expensePDA, transaction: tx };
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense on-chain",
        variant: "destructive",
      });
      throw error;
    }
  };

  const calculateBalances = async (groupCreator: PublicKey) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected or program not available');
    }

    try {
      const [groupPDA] = getGroupPDA(groupCreator);

      const tx = await (program as any).methods
        .calculateBalances()
        .accounts({
          group: groupPDA,
        })
        .rpc();

      toast({
        title: "Balances Updated!",
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });

      return tx;
    } catch (error) {
      console.error('Error calculating balances:', error);
      toast({
        title: "Error",
        description: "Failed to calculate balances",
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchGroup = async (groupCreator: PublicKey): Promise<OnChainGroup | null> => {
    if (!program) return null;

    try {
      const [groupPDA] = getGroupPDA(groupCreator);
      const groupAccount = await (program as any).account.group.fetch(groupPDA) as OnChainGroup;
      return groupAccount;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  };

  const fetchExpenses = async (groupCreator: PublicKey): Promise<OnChainExpense[]> => {
    if (!program) return [];

    try {
      const [groupPDA] = getGroupPDA(groupCreator);
      const groupAccount = await (program as any).account.group.fetch(groupPDA) as OnChainGroup;
      const expenseCount = groupAccount.expenseCount.toNumber();

      const expenses: OnChainExpense[] = [];
      for (let i = 0; i < expenseCount; i++) {
        try {
          const [expensePDA] = getExpensePDA(groupPDA, i);
          const expenseAccount = await (program as any).account.expense.fetch(expensePDA) as OnChainExpense;
          expenses.push(expenseAccount);
        } catch (error) {
          console.error(`Error fetching expense ${i}:`, error);
        }
      }

      return expenses;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  };

  const getUserGroups = async (): Promise<OnChainGroup[]> => {
    if (!program || !publicKey) return [];

    try {
      // Fetch all group accounts where user is creator
      const groups = await (program as any).account.group.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      return groups.map((group: any) => group.account as OnChainGroup);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  };

  return {
    createGroup,
    addExpense,
    calculateBalances,
    fetchGroup,
    fetchExpenses,
    getUserGroups,
  };
};