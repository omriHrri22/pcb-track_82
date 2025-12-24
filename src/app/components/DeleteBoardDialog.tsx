import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import { PCBBoard } from '../types';

interface DeleteBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  board: PCBBoard;
}

export function DeleteBoardDialog({ open, onOpenChange, onConfirmDelete, board }: DeleteBoardDialogProps) {
  const handleDelete = () => {
    onConfirmDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Board?</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the board and all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
          <div className="text-sm">
            <span className="text-gray-600">Board Name:</span>{' '}
            <span className="font-medium">{board.boardName}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Part Number:</span>{' '}
            <span className="font-medium">{board.partNumber}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Revision:</span>{' '}
            <span className="font-medium">{board.revision}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Project:</span>{' '}
            <span className="font-medium">{board.project}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
