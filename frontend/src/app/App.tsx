import { useState, useEffect } from 'react';
import { PCBBoard, UserRole, ChangeLogEntry, calculateBoardProgress, migrateBoardTasks, STAGE_TEMPLATES } from './types';
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

// Backend base URL:
// - Local dev (docker compose): http://localhost:8000/api
// - Override via Vite env: VITE_API_BASE=http://<host>:8000/api
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000/api';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

function migrateBoards(bs: PCBBoard[]): PCBBoard[] {
  return bs.map((b) => migrateBoardTasks(b));
}

async function apiGetBoards(includeDeleted = false): Promise<PCBBoard[]> {
  return apiRequest<PCBBoard[]>(`/boards?includeDeleted=${includeDeleted ? 'true' : 'false'}`);
}

async function apiCreateBoard(payload: {
  boardName: string;
  partNumber: string;
  revision: string;
  project: string;
  isNewRevision: boolean;
}): Promise<PCBBoard> {
  return apiRequest<PCBBoard>(`/boards`, { method: 'POST', body: JSON.stringify(payload) });
}

async function apiUpdateBoard(board: PCBBoard): Promise<PCBBoard> {
  return apiRequest<PCBBoard>(`/boards/${board.id}`, { method: 'PUT', body: JSON.stringify(board) });
}

async function apiSoftDeleteBoard(boardId: string): Promise<PCBBoard> {
  return apiRequest<PCBBoard>(`/boards/${boardId}/delete`, { method: 'POST' });
}

async function apiRestoreBoard(boardId: string): Promise<PCBBoard> {
  return apiRequest<PCBBoard>(`/boards/${boardId}/restore`, { method: 'POST' });
}

async function apiPermanentDeleteBoard(boardId: string): Promise<void> {
  await apiRequest<void>(`/boards/${boardId}`, { method: 'DELETE' });
}

async function apiGetChangeLog(boardId?: string): Promise<ChangeLogEntry[]> {
  const q = boardId ? `?boardId=${encodeURIComponent(boardId)}` : '';
  return apiRequest<ChangeLogEntry[]>(`/changelog${q}`);
}

async function apiAddChangeLog(entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>): Promise<ChangeLogEntry> {
  return apiRequest<ChangeLogEntry>(`/changelog`, { method: 'POST', body: JSON.stringify(entry) });
}

async function apiGetUsers(): Promise<string[]> {
  return apiRequest<string[]>(`/users`);
}

async function apiAddUser(name: string): Promise<string[]> {
  return apiRequest<string[]>(`/users`, { method: 'POST', body: JSON.stringify({ name }) });
}

async function apiRemoveUser(name: string): Promise<string[]> {
  return apiRequest<string[]>(`/users/${encodeURIComponent(name)}`, { method: 'DELETE' });
}


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

// On mount:
// 1) migrate cached boards (localStorage)
// 2) fetch latest from backend and replace local cache
useEffect(() => {
  // 1) migrate cached boards (if any)
  try {
    const migrated = migrateBoards(boards);
    if (JSON.stringify(migrated) !== JSON.stringify(boards)) {
      setBoards(migrated);
    }
  } catch {
    // ignore migration issues
  }

  // 2) fetch from backend
  (async () => {
    try {
      const [serverBoards, serverLog, serverUsers] = await Promise.all([
        apiGetBoards(true),      // include deleted so Deleted view works
        apiGetChangeLog(),
        apiGetUsers(),
      ]);

      const migratedServerBoards = migrateBoards(serverBoards);
      setBoards(migratedServerBoards);
      setChangeLog(serverLog);
      setUserNames(serverUsers);
    } catch (err: any) {
      console.error('Backend fetch failed:', err);
      toast.error(`Backend not reachable. Using local cache. (${err?.message ?? 'unknown error'})`);
    }
  })();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


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
  (async () => {
    try {
      const created = await apiCreateBoard({
        boardName,
        partNumber,
        revision,
        project,
        isNewRevision,
      });

      // optional migration (keeps compatibility)
      const migrated = migrateBoards([created])[0];

      setBoards((prev) => [...prev, migrated]);
      toast.success('Board created successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to create board: ${err?.message ?? 'unknown error'}`);
    }
  })();
};


  const handleUpdateBoard = (updatedBoard: PCBBoard) => {
  // 1) Optimistic update (UI מגיב מיד)
  setBoards((prev) => prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));

  // 2) Save to backend
  (async () => {
    try {
      const saved = await apiUpdateBoard(updatedBoard);
      const migratedSaved = migrateBoards([saved])[0];

      // Replace with the canonical version from server
      setBoards((prev) => prev.map((b) => (b.id === migratedSaved.id ? migratedSaved : b)));
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to save changes: ${err?.message ?? 'unknown error'}`);
    }
  })();
};


  const handleLogChange = (entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => {
  // add temporary item so UI updates immediately
  const tmp: ChangeLogEntry = {
    ...entry,
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
  setChangeLog((prev) => [...prev, tmp]);

  (async () => {
    try {
      const saved = await apiAddChangeLog(entry);
      setChangeLog((prev) => prev.map((e) => (e.id === tmp.id ? saved : e)));
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to save change log: ${err?.message ?? 'unknown error'}`);
    }
  })();
};

  const handleDeleteBoard = (boardId: string) => {
  setSelectedBoard(null);

  (async () => {
    try {
      const deleted = await apiSoftDeleteBoard(boardId);
      const migratedDeleted = migrateBoards([deleted])[0];

      setBoards((prev) => prev.map((b) => (b.id === boardId ? migratedDeleted : b)));
      toast.success('Board moved to deleted items');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to delete board: ${err?.message ?? 'unknown error'}`);
    }
  })();
};


  const handleRestoreBoard = (boardId: string) => {
  (async () => {
    try {
      const restored = await apiRestoreBoard(boardId);
      const migratedRestored = migrateBoards([restored])[0];

      setBoards((prev) => prev.map((b) => (b.id === boardId ? migratedRestored : b)));
      toast.success('Board restored successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to restore board: ${err?.message ?? 'unknown error'}`);
    }
  })();
};


  const handlePermanentDelete = (boardId: string) => {
  (async () => {
    try {
      await apiPermanentDeleteBoard(boardId);

      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      setChangeLog((prev) => prev.filter((e) => e.boardId !== boardId));
      toast.success('Board permanently deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to permanently delete board: ${err?.message ?? 'unknown error'}`);
    }
  })();
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
  onUpdateUserNames={(nextNames) => {
    (async () => {
      try {
        const prev = userNames;
        const toAdd = nextNames.filter((n) => !prev.includes(n));
        const toRemove = prev.filter((n) => !nextNames.includes(n));

        for (const n of toAdd) await apiAddUser(n);
        for (const n of toRemove) await apiRemoveUser(n);

        const refreshed = await apiGetUsers();
        setUserNames(refreshed);
        toast.success('Users updated');
      } catch (err: any) {
        console.error(err);
        toast.error(`Failed to update users: ${err?.message ?? 'unknown error'}`);
        setUserNames(nextNames);
      }
    })();
  }}
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