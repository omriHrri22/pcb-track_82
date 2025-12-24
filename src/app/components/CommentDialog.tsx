import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

interface CommentDialogProps {
  taskName: string;
  currentComment: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: string) => void;
  disabled?: boolean;
}

export function CommentDialog({
  taskName,
  currentComment,
  isOpen,
  onClose,
  onSave,
  disabled = false,
}: CommentDialogProps) {
  const [comment, setComment] = useState(currentComment);

  const handleSave = () => {
    onSave(comment);
    onClose();
  };

  const handleCancel = () => {
    setComment(currentComment);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comment for "{taskName}"
          </DialogTitle>
          <DialogDescription>
            Add your comments or notes for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              placeholder="Enter your comments here..."
              disabled={disabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={disabled}>
            Save Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}