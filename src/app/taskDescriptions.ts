// Task descriptions for tooltip display
export const TASK_DESCRIPTIONS: Record<string, string> = {
  // Pre-Schematics
  "Requirements Available":
    "Confirm that all system, electrical, and mechanical requirements are defined and available",
  "EQ Review (Previous revision)":
    "Review Engineering question feedback from the previous board revision",
  "Bringup notes (Previous revision)":
    "Review notes and findings from the previous revision bring-up process",
  "Mechanical notes (Previous revision)":
    "Review mechanical integration notes and issues from the previous revision",
  "Comments 365 (Previous revision)":
    "Review comments and feedback from Comments 365 for the previous revision",
  "Block Diagram Updated":
    "Ensure the system block diagram is current and reflects the design",
  "Power Tree Updated": "Verify power distribution tree",
  Shielding:
    "Determine if EMI/EMC shielding is required for the design",
  "PDR Completed":
    "Preliminary Design Review has been completed and approved",

  // Schematics
  "Schematic design":
    "Complete the schematic capture with all components and connections",
  "Test points":
    "Add appropriate test points for debugging and validation",
  "GND hooks":
    "Ensure proper ground connection points are placed",
  "Validate PCB project":
    "Verify the PCB project settings and configuration",
  "Backward and system compatibility":
    "Check compatibility with previous versions and system requirements",
  DNP: "Mark Do Not Populate components correctly",
  "Connector naming and titles":
    "Ensure all connectors have proper names and labels",
  "Review BOM": "Review and validate the Bill of Materials",
  "Item Manager check":
    "Verify all components in the item management system",
  "Embedded review decision":
    "Obtain embedded team review and approval",
  "Update Issues Excel":
    "Update the issues tracking spreadsheet with current items",

  // Layout
  "Design rules": "Set up and verify PCB design rules",
  "PCB stackup": "Define and approve the PCB layer stackup",
  "Obtain DXF":
    "Get the mechanical outline DXF file from mechanical team",
  "Conceptual component placement":
    "Create initial component placement concept",
  "First mechanical approval":
    "Get initial mechanical team approval on component placement",
  "Component placement":
    "Finalize component positions on the PCB",
  "Second mechanical approval":
    "Get secondary mechanical approval after detailed placement",
  "Impedance control":
    "Design and verify controlled impedance traces",
  Routing: "Complete PCB trace routing",
  "Length matching": "Match critical signal trace lengths",
  "Via filling & capping":
    "Apply via filling and capping where required",
  "Tear drops": "Add teardrop shapes to pad-trace connections",
  "Back drill":
    "Identify and mark vias requiring back drilling",
  "stitching and shielding":
    "Add ground stitching vias and shielding structures",
  "board outline": "Finalize the PCB board outline and shape",
  "Assembly layers": "Complete assembly documentation layers",
  Silkscreen: "Add and verify silkscreen markings",
  "Final mechanical approval":
    "Get final mechanical team sign-off",
  "DRC completion": "Complete Design Rule Check with no errors",

  // Documentation
  "Issues Excel Review":
    "Review and finalize the issues tracking Excel document",
  "Draftsman Preparation":
    "Prepare manufacturing drawings using Draftsman",
  "Confluence – Main Page":
    "Create or update the main Confluence documentation page",
  "Confluence – Bringup":
    "Document the bring-up plan and procedures in Confluence",
  "Software Features Documentation":
    "Document all software features and requirements",

  // Production Files
  "Schematics review":
    "Final review of schematic documentation",
  "Layout review": "Final review of PCB layout",
  "Fixes table":
    "Review and verify the fixes table is complete",
  "Item manager":
    "Final check of all items in the management system",
  "PN silk":
    "Verify part number is correctly marked on silkscreen",
  "Board outline":
    "Final verification of board outline dimensions",
  "BOM components stage":
    "Verify all BOM components are at correct procurement stage",
  Planes: "Verify all power and ground planes are correct",

  // In Production
  "Order Placed":
    "PCB fabrication and assembly order has been placed",
  "Fabrication Complete": "PCB fabrication is complete",
  "Assembly Complete":
    "PCB assembly is complete and boards are ready",

  // Electronic Bring-Up
  "Set serial number on boards":
    "Assign and mark serial numbers on all boards",
  "Start bringup":
    "Begin the electronic bring-up testing process",
  "update confluence":
    "Update Confluence with bring-up progress and findings",
  "Finish electrotonic bringup":
    "Complete all electronic bring-up testing",
  "Write excel issues":
    "Document all issues found during bring-up in Excel",

  // System Bring-Up - Mechanical
  "Mechanical Integration Complete":
    "Board is fully integrated into mechanical assembly",
  "Mechanical Testing Passed":
    "All mechanical interface tests have passed",
  "Mechanical Sign-Off":
    "Mechanical team has approved the design",

  // System Bring-Up - Embedded
  "Firmware Loaded":
    "Firmware has been successfully loaded onto the board",
  "Embedded Testing Complete":
    "All embedded software tests have been completed",
  "Embedded Sign-Off": "Embedded team has approved the design",

  // System Bring-Up - Software
  "Software Integration Complete":
    "Software integration with the board is complete",
  "Software Testing Passed":
    "All software integration tests have passed",
  "Software Sign-Off": "Software team has approved the design",

  // System Bring-Up - System
  "System Integration Complete":
    "Full system integration is complete",
  "System Testing Passed": "All system-level tests have passed",
  "System Sign-Off": "System team has given final approval",
};

export function getTaskDescription(taskName: string): string {
  return (
    TASK_DESCRIPTIONS[taskName] || "No description available"
  );
}