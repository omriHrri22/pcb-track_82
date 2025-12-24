import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { FileJson, FileSpreadsheet } from "lucide-react";

interface DownloadFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFormat: (format: 'json' | 'csv') => void;
}

export function DownloadFormatDialog({
  open,
  onOpenChange,
  onSelectFormat,
}: DownloadFormatDialogProps) {
  const handleFormatSelection = (format: 'json' | 'csv') => {
    onSelectFormat(format);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Download Format</DialogTitle>
          <DialogDescription>
            Choose the format for downloading board data
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => handleFormatSelection('json')}
          >
            <FileJson className="w-8 h-8 text-blue-600" />
            <div className="text-center">
              <div className="font-semibold">JSON Format</div>
              <div className="text-xs text-gray-500">Structured data with all board details</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
            onClick={() => handleFormatSelection('csv')}
          >
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <div className="text-center">
              <div className="font-semibold">CSV Format</div>
              <div className="text-xs text-gray-500">Spreadsheet-compatible tabular data</div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}