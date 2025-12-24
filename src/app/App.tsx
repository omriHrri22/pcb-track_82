import { useState, useEffect } from 'react';
import { PCBBoard, UserRole, ChangeLogEntry, createNewBoard, calculateBoardProgress, migrateBoardTasks, STAGE_TEMPLATES } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BoardsOverview } from './components/BoardsOverview';
import { BoardDetail } from './components/BoardDetail';
import { NewBoardDialog } from './components/NewBoardDialog';
import { ManageUsersDialog } from './components/ManageUsersDialog';
import { DeletedBoardsView } from './components/DeletedBoardsView';
import { DownloadFormatDialog } from './components/DownloadFormatDialog';
import { FilterBar, FilterCriteria } from './components/FilterBar';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Plus, User, Users, Trash2, Download } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [boards, setBoards] = useLocalStorage<PCBBoard[]>('pcb-boards', []);
  const [changeLog, setChangeLog] = useLocalStorage<ChangeLogEntry[]>('pcb-changelog', []);
  const [userNames, setUserNames] = useLocalStorage<string[]>('pcb-user-names', []);
  const [userRole, setUserRole] = useState<UserRole>('Designer');
  const [userName, setUserName] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<PCBBoard | null>(null);
  const [isNewBoardDialogOpen, setIsNewBoardDialogOpen] = useState(false);
  const [isManageUsersDialogOpen, setIsManageUsersDialogOpen] = useState(false);
  const [isDownloadFormatDialogOpen, setIsDownloadFormatDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    searchText: '',
    project: 'all',
    currentStage: 'all',
    arrived: 'all',
  });

  // Migrate existing boards on app load
  useEffect(() => {
    const migratedBoards = boards.map(board => migrateBoardTasks(board));
    // Only update if there were actual changes
    if (JSON.stringify(migratedBoards) !== JSON.stringify(boards)) {
      setBoards(migratedBoards);
    }
  }, []); // Only run once on mount

  // Separate active and deleted boards
  const activeBoards = boards.filter(board => !board.isDeleted);
  const deletedBoards = boards.filter(board => board.isDeleted);

  // Extract unique existing projects from active boards
  const existingProjects = Array.from(new Set(activeBoards.map(board => board.project))).sort();

  // Extract unique stage names from templates
  const allStages = STAGE_TEMPLATES.map(template => template.name);

  // Helper function to determine the current lifecycle stage (same logic as BoardsOverview)
  const getCurrentStage = (board: PCBBoard): string => {
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
  };

  // Filter boards based on criteria
  const filteredBoards = activeBoards.filter((board) => {
    // Search text filter
    if (filterCriteria.searchText) {
      const searchLower = filterCriteria.searchText.toLowerCase();
      const matchesSearch = 
        board.boardName.toLowerCase().includes(searchLower) ||
        board.partNumber.toLowerCase().includes(searchLower) ||
        board.revision.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Project filter
    if (filterCriteria.project !== 'all' && board.project !== filterCriteria.project) {
      return false;
    }

    // Current stage filter
    if (filterCriteria.currentStage !== 'all') {
      const currentStage = getCurrentStage(board);
      if (currentStage !== filterCriteria.currentStage) return false;
    }

    // Arrived filter
    if (filterCriteria.arrived !== 'all') {
      if (filterCriteria.arrived === 'arrived' && !board.isArrived) return false;
      if (filterCriteria.arrived === 'not-arrived' && board.isArrived) return false;
    }

    return true;
  });

  const handleCreateBoard = (
    boardName: string,
    partNumber: string,
    revision: string,
    project: string,
    isNewRevision: boolean
  ) => {
    const newBoard = createNewBoard(boardName, partNumber, revision, project, isNewRevision);
    setBoards([...boards, newBoard]);
    toast.success('Board created successfully');
  };

  const handleUpdateBoard = (updatedBoard: PCBBoard) => {
    setBoards(boards.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));
  };

  const handleLogChange = (entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ChangeLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setChangeLog([...changeLog, newEntry]);
  };

  const handleDeleteBoard = (boardId: string) => {
    setBoards(boards.map((b) => 
      b.id === boardId 
        ? { ...b, isDeleted: true, deletedAt: new Date().toISOString() } 
        : b
    ));
    setSelectedBoard(null);
    toast.success('Board moved to deleted items');
  };

  const handleRestoreBoard = (boardId: string) => {
    setBoards(boards.map((b) => 
      b.id === boardId 
        ? { ...b, isDeleted: false, deletedAt: undefined } 
        : b
    ));
    toast.success('Board restored successfully');
  };

  const handlePermanentDelete = (boardId: string) => {
    setBoards(boards.filter((b) => b.id !== boardId));
    setChangeLog(changeLog.filter((entry) => entry.boardId !== boardId));
    toast.success('Board permanently deleted');
  };

  const handleSelectBoard = (board: PCBBoard) => {
    // Get the latest version of the board from state
    const latestBoard = boards.find((b) => b.id === board.id);
    setSelectedBoard(latestBoard || board);
  };

  const handleDownloadData = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'json') {
      // Create board data with only high-level information
      const boardsExportData = boards.map(board => {
        const progress = calculateBoardProgress(board);
        const currentStageName = getCurrentStage(board);
        
        return {
          boardName: board.boardName,
          partNumber: board.partNumber,
          revision: board.revision,
          project: board.project,
          isNewRevision: board.isNewRevision,
          isArrived: board.isArrived,
          arrivedDate: board.arrivedDate,
          passFailStatus: board.passFailStatus,
          progress: progress,
          createdAt: board.createdAt,
          isDeleted: board.isDeleted,
          currentStage: currentStageName
        };
      });

      const dataToDownload = {
        boards: boardsExportData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(dataToDownload, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pcb-boards-export-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Board data downloaded as JSON');
    } else if (format === 'csv') {
      // CSV export - one row per board with high-level information only
      const csvRows: string[] = [];
      
      // Header row
      csvRows.push([
        'Board Name',
        'Part Number',
        'Revision',
        'Project',
        'Is New Revision',
        'Arrived',
        'Arrived Date',
        'Pass/Fail Status',
        'Progress (%)',
        'Created At',
        'Deleted',
        'Current Stage'
      ].join(','));

      // Data rows - one per board
      boards.forEach(board => {
        const progress = calculateBoardProgress(board);
        const currentStageName = getCurrentStage(board);
        
        csvRows.push([
          `"${board.boardName}"`,
          `"${board.partNumber}"`,
          `"${board.revision}"`,
          `"${board.project}"`,
          board.isNewRevision ? 'Yes' : 'No',
          board.isArrived ? 'Yes' : 'No',
          `"${board.arrivedDate}"`,
          board.passFailStatus || 'Not Set',
          progress.toString(),
          `"${board.createdAt}"`,
          board.isDeleted ? 'Yes' : 'No',
          `"${currentStageName}"`
        ].join(','));
      });

      const csvContent = csvRows.join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pcb-boards-export-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Board data downloaded as CSV');
    }
  };

  // Update selected board when boards change
  const currentBoard = selectedBoard
    ? boards.find((b) => b.id === selectedBoard.id) || selectedBoard
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1">PCB Tracking System</h1>
              <p className="text-sm text-gray-600">
                Track PCB lifecycle from design to bring-up
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Role selector */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <Select value={userRole} onValueChange={(value) => setUserRole(value as UserRole)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User name selector */}
              <div className="flex items-center gap-2">
                <Select value={userName} onValueChange={setUserName}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select your name" />
                  </SelectTrigger>
                  <SelectContent>
                    {userNames.length === 0 ? (
                      <div className="px-2 py-6 text-sm text-gray-500 text-center">
                        No users configured
                      </div>
                    ) : (
                      userNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManageUsersDialogOpen(true)}
                  title="Manage Users"
                >
                  <Users className="w-4 h-4" />
                </Button>
              </div>

              {!currentBoard && (
                <Button onClick={() => setIsNewBoardDialogOpen(true)} className="text-[rgb(255,255,255)] bg-[rgb(38,141,50)]">
                  <Plus className="w-4 h-4 mr-2" />
                  New Board
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {currentBoard ? (
          <BoardDetail
            board={currentBoard}
            userRole={userRole}
            userName={userName}
            changeLog={changeLog}
            onBack={() => setSelectedBoard(null)}
            onUpdateBoard={handleUpdateBoard}
            onLogChange={handleLogChange}
            onDeleteBoard={handleDeleteBoard}
          />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1">
                  {viewMode === 'active' ? 'Active PCB Boards' : 'Deleted Boards'}
                </h2>
                <p className="text-sm text-gray-600">
                  {viewMode === 'active' 
                    ? `${activeBoards.length} active ${activeBoards.length === 1 ? 'board' : 'boards'}`
                    : `${deletedBoards.length} deleted ${deletedBoards.length === 1 ? 'board' : 'boards'}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={viewMode === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('active')}
                >
                  Active Boards
                </Button>
                <Button
                  variant={viewMode === 'deleted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('deleted')}
                  className="relative"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deleted
                  {deletedBoards.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 px-1.5 py-0 text-xs"
                    >
                      {deletedBoards.length}
                    </Badge>
                  )}
                </Button>
                <Badge variant="outline" className="text-sm">
                  Current Role: {userRole}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDownloadFormatDialogOpen(true)}
                  title="Download all board data"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Data
                </Button>
              </div>
            </div>
            
            {viewMode === 'active' ? (
              <>
                <div className="mb-6">
                  <FilterBar
                    filters={filterCriteria}
                    onFiltersChange={setFilterCriteria}
                    projects={existingProjects}
                    stages={allStages}
                    totalBoards={activeBoards.length}
                    filteredBoards={filteredBoards.length}
                  />
                </div>
                <BoardsOverview boards={filteredBoards} onSelectBoard={handleSelectBoard} />
              </>
            ) : (
              <DeletedBoardsView
                deletedBoards={deletedBoards}
                onRestoreBoard={handleRestoreBoard}
                onPermanentDelete={handlePermanentDelete}
              />
            )}
          </>
        )}
      </main>

      {/* New board dialog */}
      <NewBoardDialog
        open={isNewBoardDialogOpen}
        onOpenChange={setIsNewBoardDialogOpen}
        onCreateBoard={handleCreateBoard}
        existingProjects={existingProjects}
      />

      {/* Manage users dialog */}
      <ManageUsersDialog
        open={isManageUsersDialogOpen}
        onOpenChange={setIsManageUsersDialogOpen}
        userNames={userNames}
        onUpdateUserNames={setUserNames}
      />

      {/* Download format dialog */}
      <DownloadFormatDialog
        open={isDownloadFormatDialogOpen}
        onOpenChange={setIsDownloadFormatDialogOpen}
        onSelectFormat={handleDownloadData}
      />
    </div>
  );
}