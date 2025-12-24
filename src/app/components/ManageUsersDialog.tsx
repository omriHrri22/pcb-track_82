import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus } from 'lucide-react';

interface ManageUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userNames: string[];
  onUpdateUserNames: (names: string[]) => void;
}

export function ManageUsersDialog({ open, onOpenChange, userNames, onUpdateUserNames }: ManageUsersDialogProps) {
  const [newName, setNewName] = useState('');

  const handleAddName = () => {
    const trimmedName = newName.trim();
    if (trimmedName && !userNames.includes(trimmedName)) {
      onUpdateUserNames([...userNames, trimmedName]);
      setNewName('');
    }
  };

  const handleRemoveName = (nameToRemove: string) => {
    onUpdateUserNames(userNames.filter((name) => name !== nameToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddName();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage User Names</DialogTitle>
          <DialogDescription>
            Add or remove user names that can be selected when tracking changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new name */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="newName" className="sr-only">
                New User Name
              </Label>
              <Input
                id="newName"
                placeholder="Enter user name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button onClick={handleAddName} disabled={!newName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* List of existing names */}
          <div className="space-y-2">
            <Label>Current Users ({userNames.length})</Label>
            <div className="border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto">
              {userNames.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No users added yet. Add a user above to get started.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {userNames.map((name) => (
                    <div key={name} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <span className="text-sm">{name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveName(name)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
