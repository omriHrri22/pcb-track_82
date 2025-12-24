import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { Stage, UserRole, isStageComplete } from '../types';
import { ChecklistItem } from './ChecklistItem';
import { Progress } from './ui/progress';

interface StageSectionProps {
  stage: Stage;
  userRole: UserRole;
  isUserNameSelected: boolean;
  isNewRevision?: boolean;
  onToggleDesigner: (taskIndex: number, subcategoryIndex?: number) => void;
  onToggleReviewer: (taskIndex: number, subcategoryIndex?: number) => void;
  onToggleRequired?: (taskIndex: number, subcategoryIndex?: number) => void;
  onUpdateUrl?: (taskIndex: number, url: string, subcategoryIndex?: number) => void;
  onUpdateComment?: (taskIndex: number, comment: string, subcategoryIndex?: number) => void;
}

export function StageSection({
  stage,
  userRole,
  isUserNameSelected,
  isNewRevision,
  onToggleDesigner,
  onToggleReviewer,
  onToggleRequired,
  onUpdateUrl,
  onUpdateComment,
}: StageSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Tasks that should only be shown when isNewRevision is true
  const newRevisionOnlyTasks = [
    'EQ Review (Previous revision)',
    'Bringup notes (Previous revision)',
    'Mechanical notes (Previous revision)',
    'Comments 365 (Previous revision)',
    'Update Issues Excel',
    'Issues Excel Review',
  ];
  
  // Subcategories that should be treated as single checkboxes
  const subcategoryCheckboxes = ['Mechanical', 'Embedded', 'Software', 'System'];
  
  // Filter function to exclude new revision only tasks when not a new revision
  const shouldCountTask = (task: { name: string; required?: boolean }) => {
    if (newRevisionOnlyTasks.includes(task.name) && !isNewRevision) {
      return false;
    }
    // Exclude tasks where required is explicitly set to false
    if (task.required === false) {
      return false;
    }
    return true;
  };
  
  // Calculate total tasks and completed tasks
  let totalTasks = 0;
  let completedTasks = 0;
  
  if (stage.tasks) {
    const visibleTasks = stage.tasks.filter(shouldCountTask);
    totalTasks += visibleTasks.length;
    completedTasks += visibleTasks.filter((task) => task.designerApproved).length;
  }
  
  if (stage.subcategories) {
    stage.subcategories.forEach((subcategory) => {
      // Check if this subcategory should be treated as a single checkbox
      if (subcategoryCheckboxes.includes(subcategory.name)) {
        totalTasks += 1;
        if (subcategory.designerApproved) {
          completedTasks += 1;
        }
      } else {
        const visibleTasks = subcategory.tasks.filter(shouldCountTask);
        totalTasks += visibleTasks.length;
        completedTasks += visibleTasks.filter((task) => task.designerApproved).length;
      }
    });
  }
  
  const isComplete = isStageComplete(stage, isNewRevision);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Stage header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
      >
        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}

        {/* Status icon */}
        {isComplete ? (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400" />
        )}

        {/* Stage name */}
        <span className={`flex-1 text-left ${isComplete ? 'text-green-900' : 'text-gray-900'}`}>
          {stage.name}
        </span>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <Progress value={progress} className="h-2" />
          <span className="text-sm text-gray-600 min-w-[60px] text-right">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </button>

      {/* Checklist items */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-2 bg-gray-50">
          {/* Regular tasks */}
          {stage.tasks && stage.tasks.map((task, index) => (
            <ChecklistItem
              key={index}
              task={task}
              userRole={userRole}
              isUserNameSelected={isUserNameSelected}
              isNewRevision={isNewRevision}
              onToggleDesigner={() => onToggleDesigner(index)}
              onToggleReviewer={() => onToggleReviewer(index)}
              onToggleRequired={onToggleRequired ? () => onToggleRequired(index) : undefined}
              onUpdateUrl={onUpdateUrl ? (url) => onUpdateUrl(index, url) : undefined}
              onUpdateComment={onUpdateComment ? (comment) => onUpdateComment(index, comment) : undefined}
            />
          ))}

          {/* Subcategories */}
          {stage.subcategories && stage.subcategories.map((subcategory, subcategoryIndex) => {
            // Check if this subcategory should be treated as a single checkbox
            const isSingleCheckbox = subcategoryCheckboxes.includes(subcategory.name);
            
            return (
              <div key={subcategoryIndex}>
                {isSingleCheckbox ? (
                  // Render as a single checkbox for Mechanical, Embedded, Software, System
                  <ChecklistItem
                    task={{
                      name: subcategory.name,
                      designerApproved: subcategory.designerApproved || false,
                      reviewerApproved: subcategory.reviewerApproved || false,
                    }}
                    userRole={userRole}
                    isUserNameSelected={isUserNameSelected}
                    isNewRevision={isNewRevision}
                    onToggleDesigner={() => onToggleDesigner(-1, subcategoryIndex)}
                    onToggleReviewer={() => onToggleReviewer(-1, subcategoryIndex)}
                    onToggleRequired={onToggleRequired ? () => onToggleRequired(-1, subcategoryIndex) : undefined}
                    onUpdateUrl={onUpdateUrl ? (url) => onUpdateUrl(-1, url, subcategoryIndex) : undefined}
                    onUpdateComment={onUpdateComment ? (comment) => onUpdateComment(-1, comment, subcategoryIndex) : undefined}
                  />
                ) : (
                  // Render individual tasks for other subcategories
                  <div className="space-y-2">
                    {subcategory.tasks.map((task, taskIndex) => (
                      <ChecklistItem
                        key={taskIndex}
                        task={task}
                        userRole={userRole}
                        isUserNameSelected={isUserNameSelected}
                        isNewRevision={isNewRevision}
                        onToggleDesigner={() => onToggleDesigner(taskIndex, subcategoryIndex)}
                        onToggleReviewer={() => onToggleReviewer(taskIndex, subcategoryIndex)}
                        onToggleRequired={onToggleRequired ? () => onToggleRequired(taskIndex, subcategoryIndex) : undefined}
                        onUpdateUrl={onUpdateUrl ? (url) => onUpdateUrl(taskIndex, url, subcategoryIndex) : undefined}
                        onUpdateComment={onUpdateComment ? (comment) => onUpdateComment(taskIndex, comment, subcategoryIndex) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}