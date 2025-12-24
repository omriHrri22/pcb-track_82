import { ArrowLeft, Calendar, Trash2, Edit, Save, X } from 'lucide-react';
import { PCBBoard, UserRole, ChangeLogEntry, calculateBoardProgress } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StageSection } from './StageSection';
import { ChangeLog } from './ChangeLog';
import { DeleteBoardDialog } from './DeleteBoardDialog';
import { format } from 'date-fns';
import { useState } from 'react';

interface BoardDetailProps {
  board: PCBBoard;
  userRole: UserRole;
  userName: string;
  changeLog: ChangeLogEntry[];
  onBack: () => void;
  onUpdateBoard: (updatedBoard: PCBBoard) => void;
  onLogChange: (entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => void;
  onDeleteBoard: (boardId: string) => void;
}

export function BoardDetail({
  board,
  userRole,
  userName,
  changeLog,
  onBack,
  onUpdateBoard,
  onLogChange,
  onDeleteBoard,
}: BoardDetailProps) {
  const progress = calculateBoardProgress(board);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isUserNameSelected = userName && userName.trim() !== '';

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedBoardName, setEditedBoardName] = useState(board.boardName);
  const [editedPartNumber, setEditedPartNumber] = useState(board.partNumber);
  const [editedRevision, setEditedRevision] = useState(board.revision);
  const [editedProject, setEditedProject] = useState(board.project);
  const [editedIsNewRevision, setEditedIsNewRevision] = useState(board.isNewRevision);

  // Helper functions to convert between YYYY-MM-DD and DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateToYYYYMMDD = (dateStr: string): string => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  const isValidDate = (dateStr: string): boolean => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year &&
      date <= today
    );
  };

  const handleToggleDesigner = (stageIndex: number, taskIndex: number, subcategoryIndex?: number) => {
    const updatedBoard = { ...board };
    const stage = updatedBoard.stages[stageIndex];
    
    let task;
    let subcategoryName = '';
    
    if (subcategoryIndex !== undefined && stage.subcategories) {
      const subcategory = stage.subcategories[subcategoryIndex];
      
      // Check if this is a subcategory-level checkbox (taskIndex === -1)
      if (taskIndex === -1) {
        const oldValue = subcategory.designerApproved ? 'checked' : 'unchecked';
        const newValue = !subcategory.designerApproved ? 'checked' : 'unchecked';
        
        subcategory.designerApproved = !subcategory.designerApproved;
        onUpdateBoard(updatedBoard);

        onLogChange({
          userRole,
          userName,
          boardId: board.id,
          boardName: board.boardName,
          revision: board.revision,
          stage: stage.name + ` - ${subcategory.name}`,
          task: subcategory.name,
          field: 'Designer Approval',
          oldValue,
          newValue,
        });
        return;
      }
      
      task = subcategory.tasks[taskIndex];
      subcategoryName = ` - ${subcategory.name}`;
    } else if (stage.tasks) {
      task = stage.tasks[taskIndex];
    } else {
      return;
    }
    
    const oldValue = task.designerApproved ? 'checked' : 'unchecked';
    const newValue = !task.designerApproved ? 'checked' : 'unchecked';
    
    task.designerApproved = !task.designerApproved;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: stage.name + subcategoryName,
      task: task.name,
      field: 'Designer Approval',
      oldValue,
      newValue,
    });
  };

  const handleToggleReviewer = (stageIndex: number, taskIndex: number, subcategoryIndex?: number) => {
    const updatedBoard = { ...board };
    const stage = updatedBoard.stages[stageIndex];
    
    let task;
    let subcategoryName = '';
    
    if (subcategoryIndex !== undefined && stage.subcategories) {
      const subcategory = stage.subcategories[subcategoryIndex];
      
      // Check if this is a subcategory-level checkbox (taskIndex === -1)
      if (taskIndex === -1) {
        const oldValue = subcategory.reviewerApproved ? 'checked' : 'unchecked';
        const newValue = !subcategory.reviewerApproved ? 'checked' : 'unchecked';
        
        subcategory.reviewerApproved = !subcategory.reviewerApproved;
        onUpdateBoard(updatedBoard);

        onLogChange({
          userRole,
          userName,
          boardId: board.id,
          boardName: board.boardName,
          revision: board.revision,
          stage: stage.name + ` - ${subcategory.name}`,
          task: subcategory.name,
          field: 'Reviewer Approval',
          oldValue,
          newValue,
        });
        return;
      }
      
      task = subcategory.tasks[taskIndex];
      subcategoryName = ` - ${subcategory.name}`;
    } else if (stage.tasks) {
      task = stage.tasks[taskIndex];
    } else {
      return;
    }
    
    const oldValue = task.reviewerApproved ? 'checked' : 'unchecked';
    const newValue = !task.reviewerApproved ? 'checked' : 'unchecked';
    
    task.reviewerApproved = !task.reviewerApproved;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: stage.name + subcategoryName,
      task: task.name,
      field: 'Reviewer Approval',
      oldValue,
      newValue,
    });
  };

  const handleToggleRequired = (stageIndex: number, taskIndex: number, subcategoryIndex?: number) => {
    const updatedBoard = { ...board };
    const stage = updatedBoard.stages[stageIndex];
    
    let task;
    let subcategoryName = '';
    
    if (subcategoryIndex !== undefined && stage.subcategories) {
      const subcategory = stage.subcategories[subcategoryIndex];
      
      // Subcategory-level checkboxes don't have 'required' field
      if (taskIndex === -1) {
        return;
      }
      
      task = subcategory.tasks[taskIndex];
      subcategoryName = ` - ${subcategory.name}`;
    } else if (stage.tasks) {
      task = stage.tasks[taskIndex];
    } else {
      return;
    }
    
    // Only toggle if the task has the required field
    if (task.required === undefined) {
      return;
    }
    
    const oldValue = task.required !== false ? 'Required' : 'Optional';
    const newValue = task.required !== false ? 'Optional' : 'Required';
    
    task.required = !task.required;
    
    // If marking as not required, uncheck Designer and Reviewer approvals
    if (!task.required) {
      task.designerApproved = false;
      task.reviewerApproved = false;
    }
    
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: stage.name + subcategoryName,
      task: task.name,
      field: 'Required Status',
      oldValue,
      newValue,
    });
  };

  const handleUpdateUrl = (stageIndex: number, taskIndex: number, url: string, subcategoryIndex?: number) => {
    const updatedBoard = { ...board };
    const stage = updatedBoard.stages[stageIndex];
    
    let task;
    let subcategoryName = '';
    
    if (subcategoryIndex !== undefined && stage.subcategories) {
      const subcategory = stage.subcategories[subcategoryIndex];
      
      // Subcategory-level checkboxes don't have URL field
      if (taskIndex === -1) {
        return;
      }
      
      task = subcategory.tasks[taskIndex];
      subcategoryName = ` - ${subcategory.name}`;
    } else if (stage.tasks) {
      task = stage.tasks[taskIndex];
    } else {
      return;
    }
    
    const oldValue = task.url || 'Not set';
    const newValue = url || 'Not set';
    
    task.url = url;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: stage.name + subcategoryName,
      task: task.name,
      field: 'URL',
      oldValue,
      newValue,
    });
  };

  const handleUpdateComment = (stageIndex: number, taskIndex: number, comment: string, subcategoryIndex?: number) => {
    const updatedBoard = { ...board };
    const stage = updatedBoard.stages[stageIndex];
    
    let task;
    let subcategoryName = '';
    
    if (subcategoryIndex !== undefined && stage.subcategories) {
      const subcategory = stage.subcategories[subcategoryIndex];
      
      // Subcategory-level checkboxes don't have comments field
      if (taskIndex === -1) {
        return;
      }
      
      task = subcategory.tasks[taskIndex];
      subcategoryName = ` - ${subcategory.name}`;
    } else if (stage.tasks) {
      task = stage.tasks[taskIndex];
    } else {
      return;
    }
    
    const oldValue = task.comments || 'No comment';
    const newValue = comment || 'No comment';
    
    task.comments = comment;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: stage.name + subcategoryName,
      task: task.name,
      field: 'Comment',
      oldValue,
      newValue,
    });
  };

  const handleToggleArrived = () => {
    const updatedBoard = { ...board };
    const oldValue = updatedBoard.isArrived ? 'Yes' : 'No';
    const newValue = !updatedBoard.isArrived ? 'Yes' : 'No';
    
    updatedBoard.isArrived = !updatedBoard.isArrived;
    if (updatedBoard.isArrived && !updatedBoard.arrivedDate) {
      updatedBoard.arrivedDate = new Date().toISOString().split('T')[0];
    }
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Arrival',
      field: 'Is Arrived',
      oldValue,
      newValue,
    });
  };

  const handleArrivedDateChange = (date: string) => {
    const updatedBoard = { ...board };
    const oldValue = updatedBoard.arrivedDate || 'Not set';
    const newValue = date || 'Not set';
    
    updatedBoard.arrivedDate = date;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Arrival',
      field: 'Arrived Date',
      oldValue,
      newValue,
    });
  };

  const handlePassFailChange = (status: 'Pass' | 'Fail') => {
    const updatedBoard = { ...board };
    const oldValue = updatedBoard.passFailStatus || 'Not set';
    const isCurrentlySet = updatedBoard.passFailStatus === status;
    const newValue = isCurrentlySet ? null : status;
    
    updatedBoard.passFailStatus = newValue;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Validation',
      field: 'Pass/Fail Status',
      oldValue: oldValue,
      newValue: newValue || 'Not set',
    });
  };

  const handleSaveChanges = () => {
    const updatedBoard = { ...board };
    updatedBoard.boardName = editedBoardName;
    updatedBoard.partNumber = editedPartNumber;
    updatedBoard.revision = editedRevision;
    updatedBoard.project = editedProject;
    updatedBoard.isNewRevision = editedIsNewRevision;
    onUpdateBoard(updatedBoard);

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Metadata',
      field: 'Board Name',
      oldValue: board.boardName,
      newValue: editedBoardName,
    });

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Metadata',
      field: 'Part Number',
      oldValue: board.partNumber,
      newValue: editedPartNumber,
    });

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Metadata',
      field: 'Revision',
      oldValue: board.revision,
      newValue: editedRevision,
    });

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Metadata',
      field: 'Project',
      oldValue: board.project,
      newValue: editedProject,
    });

    onLogChange({
      userRole,
      userName,
      boardId: board.id,
      boardName: board.boardName,
      revision: board.revision,
      stage: 'Global',
      task: 'Board Metadata',
      field: 'Is New Revision',
      oldValue: board.isNewRevision ? 'Yes' : 'No',
      newValue: editedIsNewRevision ? 'Yes' : 'No',
    });

    setIsEditMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Board
        </Button>
      </div>

      {/* Warning message when no user name selected */}
      {!isUserNameSelected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Please select a user name from the header to enable editing.
          </p>
        </div>
      )}

      {/* Board metadata */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          {isEditMode ? (
            // Edit mode
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editBoardName" className="text-sm text-gray-600 mb-1 block">
                    Board Name
                  </Label>
                  <Input
                    id="editBoardName"
                    value={editedBoardName}
                    onChange={(e) => setEditedBoardName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="editPartNumber" className="text-sm text-gray-600 mb-1 block">
                    Part Number
                  </Label>
                  <Input
                    id="editPartNumber"
                    value={editedPartNumber}
                    onChange={(e) => setEditedPartNumber(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="editRevision" className="text-sm text-gray-600 mb-1 block">
                    Revision
                  </Label>
                  <Input
                    id="editRevision"
                    value={editedRevision}
                    onChange={(e) => setEditedRevision(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="editProject" className="text-sm text-gray-600 mb-1 block">
                    Project
                  </Label>
                  <Input
                    id="editProject"
                    value={editedProject}
                    onChange={(e) => setEditedProject(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="editIsNewRevision"
                  checked={editedIsNewRevision}
                  onCheckedChange={(checked) => setEditedIsNewRevision(checked as boolean)}
                />
                <Label htmlFor="editIsNewRevision" className="text-sm text-gray-600">
                  New Revision
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={!editedBoardName.trim() || !editedPartNumber.trim() || !editedRevision.trim() || !editedProject.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedBoardName(board.boardName);
                    setEditedPartNumber(board.partNumber);
                    setEditedRevision(board.revision);
                    setEditedProject(board.project);
                    setEditedIsNewRevision(board.isNewRevision);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Display mode
            <>
              <div>
                <h1 className="mb-2">{board.boardName}</h1>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {board.partNumber}
                  </Badge>
                  <Badge className="text-sm">Rev {board.revision}</Badge>
                  {board.isNewRevision && (
                    <Badge variant="secondary" className="text-sm">
                      New Revision
                    </Badge>
                  )}
                  <span className="text-gray-600">Project: {board.project}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditedBoardName(board.boardName);
                      setEditedPartNumber(board.partNumber);
                      setEditedRevision(board.revision);
                      setEditedProject(board.project);
                      setEditedIsNewRevision(board.isNewRevision);
                      setIsEditMode(true);
                    }}
                    disabled={!isUserNameSelected}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2">Overall Progress</div>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="h-3 w-[200px]" />
                  <span className="text-xl font-semibold text-gray-900">{progress}%</span>
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Arrival status */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Checkbox
              id="isArrived"
              checked={board.isArrived}
              onCheckedChange={handleToggleArrived}
              disabled={!isUserNameSelected}
            />
            <Label htmlFor="isArrived">Board Arrived</Label>
          </div>

          {board.isArrived && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Label htmlFor="arrivedDate" className="text-sm text-gray-600">
                Arrived Date:
              </Label>
              <Input
                id="arrivedDate"
                type="text"
                value={formatDateToDDMMYYYY(board.arrivedDate || '')}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (isValidDate(inputValue)) {
                    handleArrivedDateChange(formatDateToYYYYMMDD(inputValue));
                  } else if (inputValue === '') {
                    handleArrivedDateChange('');
                  }
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue && !isValidDate(inputValue)) {
                    // Reset to previous valid value if invalid
                    e.target.value = formatDateToDDMMYYYY(board.arrivedDate || '');
                  }
                }}
                placeholder="DD/MM/YYYY"
                className="w-[160px]"
                disabled={!isUserNameSelected}
              />
            </div>
          )}

          {board.isArrived && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <Checkbox
                  id="pass"
                  checked={board.passFailStatus === 'Pass'}
                  onCheckedChange={() => handlePassFailChange('Pass')}
                  disabled={!isUserNameSelected}
                />
                <Label htmlFor="pass">Pass</Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="fail"
                  checked={board.passFailStatus === 'Fail'}
                  onCheckedChange={() => handlePassFailChange('Fail')}
                  disabled={!isUserNameSelected}
                />
                <Label htmlFor="fail">Fail</Label>
              </div>
            </>
          )}

          <div className="text-sm text-gray-500">
            Created: {format(new Date(board.createdAt), 'dd/MM/yyyy')}
          </div>
        </div>
      </div>

      {/* Tabs for stages and change log */}
      <Tabs defaultValue="stages" className="w-full">
        <TabsList>
          <TabsTrigger value="stages">Lifecycle Stages</TabsTrigger>
          <TabsTrigger value="changelog">Change Log</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4 mt-6">
          {board.stages.map((stage, stageIndex) => (
            <StageSection
              key={stageIndex}
              stage={stage}
              userRole={userRole}
              isUserNameSelected={isUserNameSelected}
              isNewRevision={board.isNewRevision}
              onToggleDesigner={(taskIndex, subcategoryIndex) => handleToggleDesigner(stageIndex, taskIndex, subcategoryIndex)}
              onToggleReviewer={(taskIndex, subcategoryIndex) => handleToggleReviewer(stageIndex, taskIndex, subcategoryIndex)}
              onToggleRequired={(taskIndex, subcategoryIndex) => handleToggleRequired(stageIndex, taskIndex, subcategoryIndex)}
              onUpdateUrl={(taskIndex, url, subcategoryIndex) => handleUpdateUrl(stageIndex, taskIndex, url, subcategoryIndex)}
              onUpdateComment={(taskIndex, comment, subcategoryIndex) => handleUpdateComment(stageIndex, taskIndex, comment, subcategoryIndex)}
            />
          ))}
        </TabsContent>

        <TabsContent value="changelog" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Change History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const boardChangeLog = changeLog.filter((entry) => entry.boardId === board.id);
                const csvContent = [
                  ['Timestamp', 'User Role', 'User Name', 'Board', 'Revision', 'Stage', 'Task', 'Field', 'Old Value', 'New Value'].join(','),
                  ...boardChangeLog.map((entry) =>
                    [
                      format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                      entry.userRole,
                      entry.userName || 'Not specified',
                      entry.boardName,
                      entry.revision,
                      entry.stage,
                      entry.task,
                      entry.field,
                      entry.oldValue,
                      entry.newValue,
                    ]
                      .map((field) => `"${field}"`)
                      .join(',')
                  ),
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `${board.boardName}_${board.revision}_changelog_${format(new Date(), 'yyyyMMdd')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Export CSV
            </Button>
          </div>
          <ChangeLog entries={changeLog} boardId={board.id} />
        </TabsContent>
      </Tabs>

      {/* Delete Board Dialog */}
      <DeleteBoardDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={() => {
          onDeleteBoard(board.id);
          onBack();
        }}
        board={board}
      />
    </div>
  );
}