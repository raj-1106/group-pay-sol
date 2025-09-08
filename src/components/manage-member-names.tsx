import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User } from 'lucide-react';

interface ManageMemberNamesProps {
  members: string[];
  memberNames: {[key: string]: string};
  onUpdateMemberName: (address: string, name: string) => void;
  currentUserAddress: string;
}

export const ManageMemberNames = ({ 
  members, 
  memberNames, 
  onUpdateMemberName, 
  currentUserAddress 
}: ManageMemberNamesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const startEditing = (address: string) => {
    setEditingMember(address);
    setNewName(memberNames[address] || '');
  };

  const saveName = () => {
    if (editingMember && newName.trim()) {
      onUpdateMemberName(editingMember, newName.trim());
      setEditingMember(null);
      setNewName('');
    }
  };

  const cancelEditing = () => {
    setEditingMember(null);
    setNewName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Names
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-card backdrop-blur-sm border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Manage Member Names
          </DialogTitle>
          <DialogDescription>
            Add friendly names for group members to make it easier to identify them
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members.map(member => (
            <Card key={member} className="bg-muted/30">
              <CardContent className="p-3">
                {member === currentUserAddress ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">You</p>
                      <p className="text-xs text-muted-foreground">{formatAddress(member)}</p>
                    </div>
                    <span className="text-sm text-primary">Current User</span>
                  </div>
                ) : editingMember === member ? (
                  <div className="space-y-2">
                    <Label htmlFor={`name-${member}`}>Name for {formatAddress(member)}</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`name-${member}`}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter a name..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <Button size="sm" onClick={saveName}>Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{memberNames[member] || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{formatAddress(member)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => startEditing(member)}
                    >
                      {memberNames[member] ? 'Edit' : 'Add Name'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};