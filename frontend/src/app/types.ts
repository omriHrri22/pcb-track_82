// Core data types for PCB Tracking System

export type UserRole = 'Designer' | 'Reviewer';

export interface Task {
  name: string;
  designerApproved: boolean;
  reviewerApproved: boolean;
  required?: boolean; // Optional field - only certain tasks can be marked as not required
  url?: string; // Optional URL field for tasks that support linking
  comments?: string; // Optional comments field for all tasks
}

export interface Subcategory {
  name: string;
  designerApproved?: boolean;
  reviewerApproved?: boolean;
  tasks: Task[];
}

export interface Stage {
  name: string;
  tasks?: Task[];
  subcategories?: Subcategory[];
}

export interface PCBBoard {
  id: string;
  boardName: string;
  partNumber: string;
  revision: string;
  project: string;
  arrivedDate: string;
  isArrived: boolean;
  passFailStatus: 'Pass' | 'Fail' | null;
  isNewRevision: boolean;
  stages: Stage[];
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  boardId: string;
  boardName: string;
  revision: string;
  stage: string;
  task: string;
  field: string;
  oldValue: string;
  newValue: string;
}

// Stage templates
export const STAGE_TEMPLATES: { name: string; tasks?: string[]; subcategories?: { name: string; tasks: string[] }[] }[] = [
  {
    name: 'Pre-Schematics',
    tasks: [
      'Requirements Available',
      'EQ Review (Previous revision)',
      'Bringup notes (Previous revision)',
      'Mechanical notes (Previous revision)',
      'Comments 365 (Previous revision)',
      'Block Diagram Updated',
      'Power Tree Updated',
      'Shielding',
      'PDR Completed',
    ],
  },
  {
    name: 'Schematics',
    tasks: [
      'Schematic design',
      'Test points',
      'GND hooks',
      'Shielding',
      'Validate PCB project',
      'Backward and system compatibility',
      'DNP',
      'Connector naming and titles',
      'Review BOM',
      'Item Manager check',
      'Embedded review decision',
      'Update Issues Excel',
    ],
  },
  {
    name: 'Layout',
    tasks: [
      'Design rules',
      'PCB stackup',
      'Obtain DXF',
      'Conceptual component placement',
      'First mechanical approval',
      'Component placement',
      'Second mechanical approval',
      'Impedance control',
      'Routing',
      'Length matching',
      'Via filling & capping',
      'Tear drops',
      'Back drill',
      'stitching and shielding',
      'board outline',
      'Assembly layers',
      'Silkscreen',
      'Final mechanical approval',
      'DRC completion',
      'Update Issues Excel',
    ],
  },
  {
    name: 'Documentation',
    tasks: [
      'Issues Excel Review',
      'Draftsman Preparation',
      'Confluence – Main Page',
      'Confluence – Bringup',
      'Software Features Documentation',
    ],
  },
  {
    name: 'Production Files',
    tasks: [
      'Schematics review',
      'Layout review',
      'Fixes table',
      'Item manager',
      'PN silk',
      'Board outline',
      'BOM components stage',
      'Planes',
    ],
  },
  {
    name: 'In Production',
    tasks: ['Order Placed', 'Fabrication Complete', 'Assembly Complete'],
  },
  {
    name: 'Electronic Bring-Up',
    tasks: [
      'Set serial number on boards',
      'Start bringup',
      'update confluence',
      'Finish electrotonic bringup',
      'Write excel issues',
    ],
  },
  {
    name: 'System Bring-Up',
    subcategories: [
      {
        name: 'Mechanical',
        tasks: ['Mechanical Integration Complete', 'Mechanical Testing Passed', 'Mechanical Sign-Off'],
      },
      {
        name: 'Embedded',
        tasks: ['Firmware Loaded', 'Embedded Testing Complete', 'Embedded Sign-Off'],
      },
      {
        name: 'Software',
        tasks: ['Software Integration Complete', 'Software Testing Passed', 'Software Sign-Off'],
      },
      {
        name: 'System',
        tasks: ['System Integration Complete', 'System Testing Passed', 'System Sign-Off'],
      },
    ],
  },
];

// Helper functions
export function createNewBoard(
  boardName: string,
  partNumber: string,
  revision: string,
  project: string,
  isNewRevision: boolean = false
): PCBBoard {
  // Tasks that support the 'Required' checkbox (default to true)
  const optionalTasks = [
    'Block Diagram Updated',
    'Power Tree Updated',
    'PDR Completed',
    'Embedded review decision',
    'Tear drops',
    'Back drill',
    'Software Features Documentation',
  ];

  return {
    id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    boardName,
    partNumber,
    revision,
    project,
    arrivedDate: '',
    isArrived: false,
    passFailStatus: null,
    isNewRevision,
    stages: STAGE_TEMPLATES.map((template) => ({
      name: template.name,
      tasks: template.tasks
        ? template.tasks.map((taskName) => ({
            name: taskName,
            designerApproved: false,
            reviewerApproved: false,
            required: optionalTasks.includes(taskName) ? true : undefined,
          }))
        : undefined,
      subcategories: template.subcategories
        ? template.subcategories.map((subcategory) => ({
            name: subcategory.name,
            designerApproved: false,
            reviewerApproved: false,
            tasks: subcategory.tasks.map((taskName) => ({
              name: taskName,
              designerApproved: false,
              reviewerApproved: false,
            })),
          }))
        : undefined,
    })),
    createdAt: new Date().toISOString(),
  };
}

export function calculateBoardProgress(board: PCBBoard): number {
  let totalTasks = 0;
  let completedTasks = 0;

  // Tasks that should only be counted when isNewRevision is true
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

  // Filter function to exclude new revision only tasks when not a new revision and non-required tasks
  const shouldCountTask = (task: Task) => {
    if (newRevisionOnlyTasks.includes(task.name) && !board.isNewRevision) {
      return false;
    }
    // Exclude tasks where required is explicitly set to false
    if (task.required === false) {
      return false;
    }
    return true;
  };

  board.stages.forEach((stage) => {
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
          // Otherwise count individual tasks
          const visibleTasks = subcategory.tasks.filter(shouldCountTask);
          totalTasks += visibleTasks.length;
          completedTasks += visibleTasks.filter((task) => task.designerApproved).length;
        }
      });
    }
  });

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

export function isStageComplete(stage: Stage, isNewRevision: boolean = false): boolean {
  // Tasks that should only be counted when isNewRevision is true
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

  // Filter function to exclude new revision only tasks when not a new revision and non-required tasks
  const shouldCountTask = (task: Task) => {
    if (newRevisionOnlyTasks.includes(task.name) && !isNewRevision) {
      return false;
    }
    // Exclude tasks where required is explicitly set to false
    if (task.required === false) {
      return false;
    }
    return true;
  };

  if (stage.tasks) {
    const visibleTasks = stage.tasks.filter(shouldCountTask);
    if (!visibleTasks.every((task) => task.designerApproved)) {
      return false;
    }
  }

  if (stage.subcategories) {
    return stage.subcategories.every((subcategory) => {
      // Check if this subcategory should be treated as a single checkbox
      if (subcategoryCheckboxes.includes(subcategory.name)) {
        return subcategory.designerApproved === true;
      } else {
        const visibleTasks = subcategory.tasks.filter(shouldCountTask);
        return visibleTasks.every((task) => task.designerApproved);
      }
    });
  }

  return true;
}

export function isTaskComplete(task: Task): boolean {
  return task.designerApproved;
}

// Migration function to update existing boards with new task structure
export function migrateBoardTasks(board: PCBBoard): PCBBoard {
  const migratedStages = board.stages.map(stage => {
    // Migrate Pre-Schematics tasks
    if (stage.name === 'Pre-Schematics' && stage.tasks) {
      const oldToNewTaskMap: Record<string, string> = {
        'EQ Review Completed': 'EQ Review (Previous revision)',
        'Bring-Up Review Completed': 'Bringup notes (Previous revision)',
        'Mechanical Review Completed': 'Mechanical notes (Previous revision)',
        'Comments Review Completed': 'Comments 365 (Previous revision)',
        'Shielding Required?': 'Shielding',
      };

      const updatedTasks = stage.tasks.map(task => {
        if (oldToNewTaskMap[task.name]) {
          return {
            ...task,
            name: oldToNewTaskMap[task.name]
          };
        }
        return task;
      });

      return { ...stage, tasks: updatedTasks };
    }

    // Migrate Schematics tasks - check if this stage has old tasks
    if (stage.name === 'Schematics' && stage.tasks) {
      const hasOldTasks = stage.tasks.some(task => 
        task.name === 'Schematic Design Complete' || 
        task.name === 'Schematic Review Complete' || 
        task.name === 'BOM Generated'
      );

      if (hasOldTasks) {
        // Replace with new task structure
        const newTasks = [
          'Schematic design',
          'Test points',
          'GND hooks',
          'Shielding',
          'Validate PCB project',
          'Backward and system compatibility',
          'DNP',
          'Connector naming and titles',
          'Review BOM',
          'Item Manager check',
          'Embedded review decision',
          'Update Issues Excel',
        ].map(taskName => ({
          name: taskName,
          designerApproved: false,
          reviewerApproved: false,
        }));

        return { ...stage, tasks: newTasks };
      }
    }

    // Migrate Layout tasks - check if this stage has old tasks
    if (stage.name === 'Layout' && stage.tasks) {
      const hasOldTasks = stage.tasks.some(task => 
        task.name === 'Layout Design Complete' || 
        task.name === 'Layout Review Complete' || 
        task.name === 'DRC Passed'
      );

      if (hasOldTasks) {
        // Replace with new task structure
        const newTasks = [
          'Design rules',
          'PCB stackup',
          'Obtain DXF',
          'Conceptual component placement',
          'First mechanical approval',
          'Component placement',
          'Second mechanical approval',
          'Impedance control',
          'Routing',
          'Length matching',
          'Via filling & capping',
          'Tear drops',
          'Back drill',
          'stitching and shielding',
          'board outline',
          'Assembly layers',
          'Silkscreen',
          'Final mechanical approval',
          'DRC completion',
          'Update Issues Excel',
        ].map(taskName => ({
          name: taskName,
          designerApproved: false,
          reviewerApproved: false,
        }));

        return { ...stage, tasks: newTasks };
      }
    }

    // Migrate Documentation tasks - check if this stage has old tasks
    if (stage.name === 'Documentation' && stage.tasks) {
      const hasOldTasks = stage.tasks.some(task => 
        task.name === 'Assembly Drawings Complete' || 
        task.name === 'User Documentation Complete' || 
        task.name === 'Test Procedures Complete'
      );

      if (hasOldTasks) {
        // Replace with new task structure
        const newTasks = [
          'Issues Excel Review',
          'Draftsman Preparation',
          'Confluence – Main Page',
          'Confluence – Bringup',
          'Software Features Documentation',
        ].map(taskName => ({
          name: taskName,
          designerApproved: false,
          reviewerApproved: false,
        }));

        return { ...stage, tasks: newTasks };
      }
    }

    // Migrate Production Files tasks - check if this stage has old tasks
    if (stage.name === 'Production Files' && stage.tasks) {
      const hasOldTasks = stage.tasks.some(task => 
        task.name === 'Gerber Files Generated' || 
        task.name === 'NC Drill Files Generated' || 
        task.name === 'Fabrication Drawing Complete'
      );

      if (hasOldTasks) {
        // Replace with new task structure
        const newTasks = [
          'Schematics review',
          'Layout review',
          'Fixes table',
          'Item manager',
          'PN silk',
          'Board outline',
          'BOM components stage',
          'Planes',
        ].map(taskName => ({
          name: taskName,
          designerApproved: false,
          reviewerApproved: false,
        }));

        return { ...stage, tasks: newTasks };
      }
    }

    // Migrate Electronic Bring-Up tasks - check if this stage has old tasks
    if (stage.name === 'Electronic Bring-Up' && stage.tasks) {
      const hasOldTasks = stage.tasks.some(task => 
        task.name === 'Power-On Test Passed' || 
        task.name === 'Functional Test Passed' || 
        task.name === 'Final Validation Complete'
      );

      if (hasOldTasks) {
        // Replace with new task structure
        const newTasks = [
          'Set serial number on boards',
          'Start bringup',
          'update confluence',
          'Finish electrotonic bringup',
          'Write excel issues',
        ].map(taskName => ({
          name: taskName,
          designerApproved: false,
          reviewerApproved: false,
        }));

        return { ...stage, tasks: newTasks };
      }
    }

    return stage;
  });

  return { ...board, stages: migratedStages };
}