import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { CheckCircle2, Link as LinkIcon, ExternalLink, MessageSquare } from 'lucide-react';
import { Task, UserRole } from '../types';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { getTaskDescription } from '../taskDescriptions';
import { CommentDialog } from './CommentDialog';
import { useState } from 'react';

interface ChecklistItemProps {
  task: Task;
  userRole: UserRole;
  isUserNameSelected: boolean;
  isNewRevision?: boolean;
  onToggleDesigner: () => void;
  onToggleReviewer: () => void;
  onToggleRequired?: () => void;
  onUpdateUrl?: (url: string) => void;
  onUpdateComment?: (comment: string) => void;
  disabled?: boolean;
}

export function ChecklistItem({
  task,
  userRole,
  isUserNameSelected,
  isNewRevision,
  onToggleDesigner,
  onToggleReviewer,
  onToggleRequired,
  onUpdateUrl,
  onUpdateComment,
  disabled = false,
}: ChecklistItemProps) {
  const isComplete = task.designerApproved;
  const isRequired = task.required !== false; // Default to true if undefined
  const hasRequiredOption = task.required !== undefined; // Only certain tasks have this option
  
  // Tasks that support URL attachment
  const urlSupportedTasks = ['Confluence – Main Page', 'Confluence – Bringup'];
  const supportsUrl = urlSupportedTasks.includes(task.name);
  
  // Local state for URL input
  const [urlInput, setUrlInput] = useState(task.url || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  
  // Local state for comment dialog
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  
  // Tasks that should only have Designer checkbox (no Reviewer checkbox)
  const designerOnlyTasks = [
    'Requirements Available',
    'EQ Review (Previous revision)',
    'Bringup notes (Previous revision)',
    'Mechanical notes (Previous revision)',
    'Comments 365 (Previous revision)',
    'Shielding',
    'PDR Completed',
  ];
  
  const isDesignerOnlyTask = designerOnlyTasks.includes(task.name);
  
  // Tasks that should only be shown when isNewRevision is true
  const newRevisionOnlyTasks = [
    'EQ Review (Previous revision)',
    'Bringup notes (Previous revision)',
    'Mechanical notes (Previous revision)',
    'Comments 365 (Previous revision)',
    'Update Issues Excel',
    'Issues Excel Review',
  ];
  
  // Hide task if it's a new revision only task and isNewRevision is false
  if (newRevisionOnlyTasks.includes(task.name) && !isNewRevision) {
    return null;
  }

  return (
    <div className={`flex items-center gap-4 py-2 px-4 rounded-lg border ${
      !isRequired 
        ? 'bg-gray-100 border-gray-300' 
        : isComplete 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200'
    }`}>
      {/* Completion indicator */}
      <div className="flex items-center justify-center w-6 h-6">
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
      </div>

      {/* Task name */}
      <div className="flex-1 flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            <Label className={`${!isRequired ? 'line-through text-gray-500' : isComplete ? 'text-green-900' : 'text-gray-900'}`}>
              {task.name}
            </Label>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {getTaskDescription(task.name)}
          </TooltipContent>
        </Tooltip>
        
        {/* Comment icon */}
        <button
          onClick={() => {
            if (isUserNameSelected) {
              setIsCommentDialogOpen(true);
            }
          }}
          disabled={!isUserNameSelected}
          className={`${
            task.comments && task.comments.trim() !== '' 
              ? 'text-blue-600 hover:text-blue-800' 
              : 'text-gray-400 hover:text-gray-600'
          } ${!isUserNameSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={task.comments && task.comments.trim() !== '' ? 'View/Edit Comment' : 'Add Comment'}
        >
          <MessageSquare className="w-4 h-4" fill={task.comments && task.comments.trim() !== '' ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Comment Dialog */}
      <CommentDialog
        taskName={task.name}
        currentComment={task.comments || ''}
        isOpen={isCommentDialogOpen}
        onClose={() => setIsCommentDialogOpen(false)}
        onSave={(comment) => {
          if (onUpdateComment) {
            onUpdateComment(comment);
          }
        }}
        disabled={!isUserNameSelected}
      />

      {/* Required checkbox - only shown for tasks that support it */}
      {hasRequiredOption && (
        <div className="flex items-center gap-2 w-[110px]">
          <Label className="text-sm text-gray-600 min-w-[70px]">Required</Label>
          <Checkbox
            checked={isRequired}
            onCheckedChange={onToggleRequired}
            disabled={disabled || !isUserNameSelected}
            className={isUserNameSelected ? '' : 'opacity-50 cursor-not-allowed'}
          />
        </div>
      )}

      {/* URL input - only shown for tasks that support it */}
      {supportsUrl && (
        <div className="flex items-center gap-2 w-[250px]">
          {isEditingUrl ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={() => {
                  setIsEditingUrl(false);
                  if (onUpdateUrl) {
                    onUpdateUrl(urlInput);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingUrl(false);
                    if (onUpdateUrl) {
                      onUpdateUrl(urlInput);
                    }
                  }
                }}
                placeholder="Enter URL"
                className="flex-1"
                autoFocus
                disabled={!isUserNameSelected}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              {task.url && task.url.trim() !== '' ? (
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Link
                </a>
              ) : (
                <span className="text-gray-400 text-sm">No link attached</span>
              )}
              <button
                onClick={() => {
                  if (isUserNameSelected) {
                    setIsEditingUrl(true);
                  }
                }}
                disabled={!isUserNameSelected}
                className={`${isUserNameSelected ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 cursor-not-allowed'}`}
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Designer checkbox - fixed width column */}
      <div className="flex items-center gap-2 w-[110px]">
        <Label className="text-sm text-gray-600 min-w-[70px]">Designer</Label>
        <Checkbox
          checked={task.designerApproved}
          onCheckedChange={onToggleDesigner}
          disabled={disabled || !isUserNameSelected || userRole !== 'Designer' || !isRequired}
          className={userRole === 'Designer' && isUserNameSelected && isRequired ? '' : 'opacity-50 cursor-not-allowed'}
        />
      </div>

      {/* Reviewer checkbox - fixed width column, hidden for designer-only tasks */}
      <div className="flex items-center gap-2 w-[110px]">
        {!isDesignerOnlyTask && (
          <>
            <Label className="text-sm text-gray-600 min-w-[70px]">Reviewer</Label>
            <Checkbox
              checked={task.reviewerApproved}
              onCheckedChange={onToggleReviewer}
              disabled={disabled || !isUserNameSelected || userRole !== 'Reviewer' || !isRequired}
              className={userRole === 'Reviewer' && isUserNameSelected && isRequired ? '' : 'opacity-50 cursor-not-allowed'}
            />
          </>
        )}
      </div>
    </div>
  );
}