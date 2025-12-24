import { PCBBoard, calculateBoardProgress, Stage } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Check, X, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BoardsOverviewProps {
  boards: PCBBoard[];
  onSelectBoard: (board: PCBBoard) => void;
}

// Helper function to determine the current lifecycle stage
function getCurrentStage(board: PCBBoard): string {
  // Iterate through stages in reverse to find the most recent stage with any completed task
  for (let i = board.stages.length - 1; i >= 0; i--) {
    const stage = board.stages[i];
    
    // Check regular tasks
    if (stage.tasks && stage.tasks.some(task => task.designerApproved)) {
      return stage.name;
    }
    
    // Check subcategory tasks
    if (stage.subcategories) {
      for (const subcategory of stage.subcategories) {
        if (subcategory.tasks.some(task => task.designerApproved)) {
          return stage.name;
        }
      }
    }
  }
  
  // If no tasks are completed, return the first stage
  return board.stages.length > 0 ? board.stages[0].name : 'Not Started';
}

export function BoardsOverview({ boards, onSelectBoard }: BoardsOverviewProps) {
  if (boards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No boards created yet</p>
        <p className="text-sm text-gray-400">Click "New Board" to create your first PCB board</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[250px]">Board Name</TableHead>
            <TableHead className="w-[150px]">Part Number</TableHead>
            <TableHead className="w-[100px]">Revision</TableHead>
            <TableHead className="w-[200px]">Project</TableHead>
            <TableHead className="w-[120px] text-center">Arrived</TableHead>
            <TableHead className="w-[100px] text-center">Status</TableHead>
            <TableHead className="w-[200px]">Progress & Current Stage</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boards.map((board) => {
            const progress = calculateBoardProgress(board);
            const currentStage = getCurrentStage(board);
            const isComplete = progress === 100;
            const isWaiting = progress === 0;
            
            // Determine row className based on status
            let rowClassName = "bg-yellow-50 hover:bg-yellow-100"; // Default: in-progress (yellow)
            if (isComplete) {
              rowClassName = "bg-green-50 hover:bg-green-100"; // Complete (green)
            } else if (isWaiting) {
              rowClassName = "hover:bg-gray-50"; // Waiting (default/white)
            }
            
            return (
              <TableRow 
                key={board.id} 
                className={rowClassName}
              >
                <TableCell>
                  <button
                    onClick={() => onSelectBoard(board)}
                    className="text-left hover:underline hover:text-blue-600 transition-colors"
                  >
                    {board.boardName}
                  </button>
                </TableCell>
                <TableCell className="font-mono text-sm">{board.partNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline">{board.revision}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{board.project}</span>
                    {board.isNewRevision && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        New Revision
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    {board.isArrived ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        {board.arrivedDate && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(board.arrivedDate), 'MM/dd/yyyy')}
                          </span>
                        )}
                      </>
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {board.passFailStatus ? (
                    <Badge
                      variant={board.passFailStatus === 'Pass' ? 'default' : 'destructive'}
                      className={board.passFailStatus === 'Pass' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {board.passFailStatus}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-sm text-gray-600 min-w-[45px] text-right">
                        {progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Stage:</span>
                      <Badge variant="secondary" className="text-xs">
                        {isComplete ? 'Done' : isWaiting ? 'Waiting' : currentStage}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectBoard(board)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}