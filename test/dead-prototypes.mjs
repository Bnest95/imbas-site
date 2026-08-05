// Superseded prototypes of workbench-app.jsx, referenced by no page and built by no
// entry point (last touched June 2026). Tests that scan what ships exclude them because
// they ship nothing, not because their contents are acceptable. Deleting them is its own
// cleanup.
//
// The list lives here rather than inside either scanner because two scanners keeping
// their own copy is how one of them ends up policing a file the other has excused.
export const DEAD_PROTOTYPES = new Set(["Workbench.jsx", "GapWorkbench.jsx", "Imbas_Workbench.jsx"]);
