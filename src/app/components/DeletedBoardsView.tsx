import { PCBBoard } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RotateCcw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface DeletedBoardsViewProps {
  deletedBoards: PCBBoard[];
  onRestoreBoard: (boardId: string) => void;
  onPermanentDelete: (boardId: string) => void;
}

export function DeletedBoardsView({ 
  deletedBoards, 
  onRestoreBoard,
  onPermanentDelete
}: DeletedBoardsViewProps) {
  if (deletedBoards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">No deleted boards</p>
        <p className="text-sm text-gray-400">Deleted boards will appear here and can be restored</p>
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
            <TableHead className="w-[150px]">Deleted Date</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedBoards.map((board) => (
            <TableRow key={board.id} className="hover:bg-gray-50">
              <TableCell className="text-gray-600">{board.boardName}</TableCell>
              <TableCell className="font-mono text-sm text-gray-600">{board.partNumber}</TableCell>
              <TableCell>
                <Badge variant="outline" className="opacity-60">{board.revision}</Badge>
              </TableCell>
              <TableCell className="text-gray-600">{board.project}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {board.deletedAt && format(new Date(board.deletedAt), 'MM/dd/yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestoreBoard(board.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPermanentDelete(board.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Permanently
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
