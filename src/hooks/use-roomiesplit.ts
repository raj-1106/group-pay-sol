import { useAnchorProgram, getGroupPDA, getExpensePDA } from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useToast } from './use-toast';

export interface OnChainGroup {
  groupId: BN;
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

  const createGroup = async (memberAddresses: string[], groupId: number = 0) => {
    if (!program || !publicKey || !signTransaction) {
      throw new Error('Wallet not connected or program not available');
    }

    try {
      // Convert member addresses to PublicKeys
      const members = memberAddresses.map(addr => new PublicKey(addr));
      
      // Use provided groupId or default to 0
      const groupIdBN = new BN(groupId);
      const [groupPDA] = getGroupPDA(publicKey, groupIdBN);

      const tx = await (program as any).methods
        .createGroup(groupIdBN, members)
        .accounts({
          group: groupPDA,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast({
        title: "Group Created!",
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });

      return { groupAddress: groupPDA, transaction: tx };
    } catch (error: any) {
      console.log('Full error object:', error);
      console.log('Error message:', error?.message);
      console.log('Error logs:', error?.logs);
      console.log('Error code:', error?.code);
      
      let errorDescription = "Failed to create group on-chain";
      
      if (error?.message?.includes('Account') && error?.message?.includes('already in use')) {
        errorDescription = "Group already exists for this wallet and group ID. Try a different group ID.";
      } else if (error?.message?.includes('insufficient funds')) {
        errorDescription = "Insufficient SOL for transaction fees";
      } else if (error?.logs?.some((log: string) => log.includes('already in use'))) {
        errorDescription = "Group already exists for this wallet and group ID. Try a different group ID.";
      } else if (error?.message) {
        errorDescription = error.message;
      }
      
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
    groupId: number,
    amount: number,
    description: string
  ) => {
    if (!program || !publicKey || !signTransaction) {
      throw new Error('Wallet not connected or program not available');
    }

    try {
      const groupIdBN = new BN(groupId);
      const [groupPDA] = getGroupPDA(groupCreator, groupIdBN);
      
      // Fetch group to get current expense count
      const groupAccount = await (program as any).account.group.fetch(groupPDA) as OnChainGroup;
      const expenseCount = groupAccount.expenseCount;
      
      const [expensePDA] = getExpensePDA(groupPDA, expenseCount);

      // Convert amount to lamports (assuming amount is in SOL)
      const amountLamports = new BN(amount * 1000000000); // 1 SOL = 1B lamports

      const tx = await (program as any).methods
        .addExpense(groupIdBN, amountLamports, description)
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

  const calculateBalances = async (groupCreator: PublicKey, groupId: number) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected or program not available');
    }

    try {
      const groupIdBN = new BN(groupId);
      const [groupPDA] = getGroupPDA(groupCreator, groupIdBN);

      const tx = await (program as any).methods
        .calculateBalances(groupIdBN)
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

  const fetchGroup = async (groupCreator: PublicKey, groupId: number): Promise<OnChainGroup | null> => {
    if (!program) return null;

    try {
      const groupIdBN = new BN(groupId);
      const [groupPDA] = getGroupPDA(groupCreator, groupIdBN);
      const groupAccount = await (program as any).account.group.fetch(groupPDA) as OnChainGroup;
      return groupAccount;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  };

  const fetchExpenses = async (groupCreator: PublicKey, groupId: number): Promise<OnChainExpense[]> => {
    if (!program) return [];

    try {
      const groupIdBN = new BN(groupId);
      const [groupPDA] = getGroupPDA(groupCreator, groupIdBN);
      const groupAccount = await (program as any).account.group.fetch(groupPDA) as OnChainGroup;
      const expenseCount = groupAccount.expenseCount.toNumber();

      const expenses: OnChainExpense[] = [];
      for (let i = 0; i < expenseCount; i++) {
        try {
          const expenseCountBN = new BN(i);
          const [expensePDA] = getExpensePDA(groupPDA, expenseCountBN);
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