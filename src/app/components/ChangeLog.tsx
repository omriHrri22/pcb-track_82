import { ChangeLogEntry } from '../types';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface ChangeLogProps {
  entries: ChangeLogEntry[];
  boardId?: string;
}

export function ChangeLog({ entries, boardId }: ChangeLogProps) {
  // Filter entries for specific board if boardId is provided
  const filteredEntries = boardId
    ? entries.filter((entry) => entry.boardId === boardId)
    : entries;

  // Sort by timestamp descending (newest first)
  const sortedEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No changes recorded yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-3">
        {sortedEntries.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {entry.userRole}
                  </Badge>
                  {entry.userName && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.userName}
                    </Badge>
                  )}
                  <span className="text-sm text-gray-600">
                    {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                </div>
                {!boardId && (
                  <div className="text-sm">
                    <span className="text-gray-900">{entry.boardName}</span>
                    <span className="text-gray-500"> (Rev {entry.revision})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="text-gray-700">
                <span className="font-medium">{entry.stage}</span> → {entry.task}
              </div>
              <div className="text-gray-600">
                {entry.field}: <span className="line-through text-red-600">{entry.oldValue}</span>
                {' → '}
                <span className="text-green-600">{entry.newValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}