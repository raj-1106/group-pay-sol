import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Users, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoomiesplit } from '@/hooks/use-roomiesplit';
import { ManageMemberNames } from '@/components/manage-member-names';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  date: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  creator: string;
  members: string[];
  expenses: Expense[];
  createdAt: string;
  groupId?: number;
  isBlockchain?: boolean;
}

interface MemberInfo {
  address: string;
  name: string;
}

export const GroupDashboard = () => {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getUserGroups, fetchGroup } = useRoomiesplit();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [memberNames, setMemberNames] = useState<{[key: string]: string}>({});
  
  // Add expense form state
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (connected) {
      loadGroups();
    }
  }, [connected]);

  const loadGroups = async () => {
    try {
      // Load local groups
      const savedGroups = JSON.parse(localStorage.getItem('groups') || '[]') as Group[];
      const localGroups = savedGroups.filter(group => 
        group.members.includes(publicKey?.toString() || '')
      );

      // Load blockchain groups
      const blockchainGroups = await getUserGroups();
      const formattedBlockchainGroups: Group[] = blockchainGroups.map(group => ({
        id: `blockchain-${group.creator.toString()}-${group.groupId.toString()}`,
        name: `Group ${group.groupId.toString()}`,
        description: `Blockchain group with ${group.members.length} members`,
        creator: group.creator.toString(),
        members: group.members.map(m => m.toString()),
        expenses: [],
        createdAt: new Date().toISOString(),
        groupId: Number(group.groupId.toString()),
        isBlockchain: true
      }));

      // Load member names from localStorage
      const savedMemberNames = JSON.parse(localStorage.getItem('memberNames') || '{}');
      setMemberNames(savedMemberNames);

      const allGroups = [...localGroups, ...formattedBlockchainGroups];
      setGroups(allGroups);
      
      if (allGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(allGroups[0]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error",
        description: "Failed to load blockchain groups",
        variant: "destructive",
      });
    }
  };

  const addExpense = () => {
    if (!selectedGroup || !expenseDescription.trim() || !expenseAmount || !expensePaidBy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseDescription,
      amount: parseFloat(expenseAmount),
      paidBy: expensePaidBy,
      participants: expenseParticipants.length > 0 ? expenseParticipants : selectedGroup.members,
      date: new Date().toISOString(),
    };

    const updatedGroup = {
      ...selectedGroup,
      expenses: [...selectedGroup.expenses, newExpense]
    };

    const allGroups = JSON.parse(localStorage.getItem('groups') || '[]') as Group[];
    const updatedGroups = allGroups.map(group => 
      group.id === selectedGroup.id ? updatedGroup : group
    );

    localStorage.setItem('groups', JSON.stringify(updatedGroups));
    setSelectedGroup(updatedGroup);
    setGroups(prev => prev.map(group => 
      group.id === selectedGroup.id ? updatedGroup : group
    ));

    // Reset form
    setExpenseDescription('');
    setExpenseAmount('');
    setExpensePaidBy('');
    setExpenseParticipants([]);
    setIsAddExpenseOpen(false);

    toast({
      title: "Expense Added!",
      description: `Added "${expenseDescription}" for ₹${expenseAmount}`,
    });
  };

  const calculateBalances = () => {
    if (!selectedGroup) return {};
    
    const balances: { [key: string]: number } = {};
    
    // Initialize balances
    selectedGroup.members.forEach(member => {
      balances[member] = 0;
    });

    // Calculate what each person owes/is owed
    selectedGroup.expenses.forEach(expense => {
      const perPersonShare = expense.amount / expense.participants.length;
      
      // Person who paid gets credited
      balances[expense.paidBy] += expense.amount;
      
      // Each participant owes their share
      expense.participants.forEach(participant => {
        balances[participant] -= perPersonShare;
      });
    });

    return balances;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getMemberName = (address: string) => {
    if (address === publicKey?.toString()) return 'You';
    return memberNames[address] || formatAddress(address);
  };

  const updateMemberName = (address: string, name: string) => {
    const updatedNames = { ...memberNames, [address]: name };
    setMemberNames(updatedNames);
    localStorage.setItem('memberNames', JSON.stringify(updatedNames));
  };

  const getSettlements = () => {
    const balances = calculateBalances();
    const settlements: Array<{from: string, to: string, amount: number}> = [];
    
    const creditors = Object.entries(balances).filter(([_, balance]) => balance > 0);
    const debtors = Object.entries(balances).filter(([_, balance]) => balance < 0);
    
    creditors.forEach(([creditor, creditAmount]) => {
      debtors.forEach(([debtor, debtAmount]) => {
        if (Math.abs(debtAmount) > 0.01 && creditAmount > 0.01) {
          const settleAmount = Math.min(creditAmount, Math.abs(debtAmount));
          settlements.push({
            from: debtor,
            to: creditor,
            amount: settleAmount
          });
          
          balances[creditor] -= settleAmount;
          balances[debtor] += settleAmount;
        }
      });
    });
    
    return settlements.filter(s => s.amount > 0.01);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 max-w-md">
          <CardHeader>
            <CardTitle>Wallet Required</CardTitle>
            <CardDescription>
              Please connect your wallet to view your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="wallet" onClick={() => navigate('/')} className="w-full">
              Go Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 max-w-md">
          <CardHeader>
            <CardTitle>No Groups Found</CardTitle>
            <CardDescription>
              You haven't joined any groups yet. Create your first group to get started!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="hero" onClick={() => navigate('/create-group')} className="w-full">
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balances = calculateBalances();
  const settlements = getSettlements();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <Button variant="hero" onClick={() => navigate('/create-group')}>
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Group Selection */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Your Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedGroup?.id === group.id 
                        ? 'bg-primary/20 border-primary/40' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    } border`}
                  >
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.members.length} members • {group.expenses.length} expenses
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedGroup && (
              <>
                {/* Group Info & Add Expense */}
                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selectedGroup.name}
                          {selectedGroup.isBlockchain && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              Blockchain
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{selectedGroup.description}</CardDescription>
                      </div>
                       <div className="flex gap-2">
                         <ManageMemberNames
                           members={selectedGroup.members}
                           memberNames={memberNames}
                           onUpdateMemberName={updateMemberName}
                           currentUserAddress={publicKey?.toString() || ''}
                         />
                         <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                           <DialogTrigger asChild>
                             <Button variant="hero">
                               <Plus className="h-4 w-4 mr-2" />
                               Add Expense
                             </Button>
                           </DialogTrigger>
                        <DialogContent className="bg-gradient-card backdrop-blur-sm border-primary/20">
                          <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                            <DialogDescription>
                              Record a shared expense for the group
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="description">Description *</Label>
                              <Input
                                id="description"
                                placeholder="e.g., Dinner at restaurant"
                                value={expenseDescription}
                                onChange={(e) => setExpenseDescription(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="amount">Amount (₹) *</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="paidBy">Paid By *</Label>
                              <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Who paid for this?" />
                                </SelectTrigger>
                                 <SelectContent>
                                   {selectedGroup.members.map(member => (
                                     <SelectItem key={member} value={member}>
                                       {getMemberName(member)}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={addExpense} className="w-full" variant="hero">
                              Add Expense
                            </Button>
                          </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Balances */}
                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Balances
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                       {Object.entries(balances).map(([member, balance]) => (
                         <div key={member} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                           <span className="font-medium">
                             {getMemberName(member)}
                           </span>
                          <span className={`font-bold ${balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {balance > 0 ? '+' : ''}₹{balance.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {settlements.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Suggested Settlements
                        </h4>
                        <div className="space-y-2">
                           {settlements.map((settlement, index) => (
                             <div key={index} className="p-3 bg-accent/30 rounded-lg text-sm">
                               <span className="font-medium">
                                 {settlement.from === publicKey?.toString() ? 'You owe' : getMemberName(settlement.from) + ' owes'}
                               </span>
                               {' '}
                               <span className="font-bold text-primary">₹{settlement.amount.toFixed(2)}</span>
                               {' '}
                               <span>
                                 to {settlement.to === publicKey?.toString() ? 'you' : getMemberName(settlement.to)}
                               </span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expenses List */}
                <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Receipt className="h-5 w-5 mr-2" />
                      Recent Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGroup.expenses.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No expenses yet. Add your first expense to get started!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedGroup.expenses.slice().reverse().map(expense => (
                          <div key={expense.id} className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{expense.description}</h4>
                              <span className="font-bold text-lg">₹{expense.amount.toFixed(2)}</span>
                            </div>
                             <div className="text-sm text-muted-foreground">
                               <p>Paid by: {getMemberName(expense.paidBy)}</p>
                              <p>Split between: {expense.participants.length} people</p>
                              <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
