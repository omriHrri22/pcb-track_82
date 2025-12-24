import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface NewBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBoard: (
    boardName: string,
    partNumber: string,
    revision: string,
    project: string,
    isNewRevision: boolean,
  ) => void;
  existingProjects: string[];
}

export function NewBoardDialog({
  open,
  onOpenChange,
  onCreateBoard,
  existingProjects = [],
}: NewBoardDialogProps) {
  const [boardName, setBoardName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [revision, setRevision] = useState("");
  const [projectSelection, setProjectSelection] =
    useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [isNewRevision, setIsNewRevision] = useState(false);

  const isNewProject = projectSelection === "__new__";
  const finalProject = isNewProject
    ? newProjectName
    : projectSelection;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boardName && partNumber && revision && finalProject) {
      onCreateBoard(
        boardName,
        partNumber,
        revision,
        finalProject,
        isNewRevision,
      );
      // Reset form
      setBoardName("");
      setPartNumber("");
      setRevision("");
      setProjectSelection("");
      setNewProjectName("");
      setIsNewRevision(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New PCB Board</DialogTitle>
          <DialogDescription>
            Enter the details for the new PCB board revision.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Board Name</Label>
              <Input
                id="boardName"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g., Main Control Board"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partNumber">
                Part Number (P/N)
              </Label>
              <Input
                id="partNumber"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g., PCB-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revision">Revision</Label>
              <Input
                id="revision"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="e.g., A, B, Rev 1.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={projectSelection}
                onValueChange={(value) =>
                  setProjectSelection(value)
                }
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project or create a new one">
                    {projectSelection
                      ? isNewProject
                        ? newProjectName || "New project"
                        : projectSelection
                      : "Select a project"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {existingProjects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">
                    Create New Project
                  </SelectItem>
                </SelectContent>
              </Select>
              {isNewProject && (
                <Input
                  id="newProjectName"
                  value={newProjectName}
                  onChange={(e) =>
                    setNewProjectName(e.target.value)
                  }
                  placeholder="e.g., XTEND-2024"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isNewRevision"
                  checked={isNewRevision}
                  onCheckedChange={(checked) =>
                    setIsNewRevision(checked as boolean)
                  }
                />
                <Label htmlFor="isNewRevision" className="cursor-pointer font-normal">
                  Is a new revision
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Board</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}