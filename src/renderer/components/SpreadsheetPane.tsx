import React, { useState, MouseEvent as ReactMouseEvent } from 'react'; // Added MouseEvent
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateNodeData } from '../store/graphSlice';

// import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table';

interface HarnessData {
  id: string;
  csa: number | string | null; // Cross-Sectional Area
  colour: string | null;
  optionCode?: string | null; // Made optional to match sample data
  label?: string; // Added to match sample data
}

// Placeholder for TanStack Table Column Definitions
// const columnHelper = createColumnHelper<HarnessData>();
// const columns: ColumnDef<HarnessData>[] = [
//   columnHelper.accessor('id', { header: () => <span>ID</span>, cell: info => info.getValue() }),
//   columnHelper.accessor('csa', { header: () => <span>CSA</span>, cell: info => info.getValue() }),
//   columnHelper.accessor('colour', { header: () => <span>Colour</span>, cell: info => info.getValue() }),
//   columnHelper.accessor('optionCode', { header: () => <span>Option Code</span>, cell: info => info.getValue() }),
// ];

// Actual placeholder columns
const placeholderColumns = [
  { key: 'id', header: 'ID' },
  { key: 'csa', header: 'CSA' },
  { key: 'colour', header: 'Colour' },
  { key: 'optionCode', header: 'Option Code' },
  { key: 'label', header: 'Label' }, // Added to display more from sample data
];

const SpreadsheetPane: React.FC = () => {
  const dispatch = useDispatch();
  const data: HarnessData[] = useSelector((state: RootState) => state.graph.nodes);
  const [editValueMap, setEditValueMap] = useState<{ [key: string]: string }>({}); // Changed to map

  // State for placeholder context menu
  const [tableMenuVisible, setTableMenuVisible] = useState(false);
  const [tableMenuPosition, setTableMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);


  const handleShowTableContextMenu = (event: ReactMouseEvent<HTMLButtonElement>, rowId: string) => {
    event.preventDefault(); // Prevent default browser context menu
    // In a real scenario, you might get these from the actual right-click event on a table row
    setTableMenuPosition({ x: event.clientX, y: event.clientY });
    setTableMenuVisible(true);
    setSelectedRowId(rowId);
    console.log(`Placeholder: Show context menu for row ${rowId} at (${event.clientX}, ${event.clientY})`);
  };

  const handleTableMenuAction = (action: string) => {
    console.log(`Placeholder: Table context menu action "${action}" triggered for row ${selectedRowId}`);
    setTableMenuVisible(false);
    setSelectedRowId(null);
  };

  // Placeholder for TanStack Table instance
  // const table = useReactTable({
  //   data,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  // });

  return (
    <div className="spreadsheet-pane">
      {/* This is a placeholder table structure because @tanstack/react-table could not be installed. */}
      {/* TODO: Add a caption element here for table summary if appropriate */}
      <table aria-label="Harness Data Spreadsheet">
        <thead>
          <tr>
            {placeholderColumns.map(col => (
              <th key={col.key} scope="col" id={`col-${col.key}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {placeholderColumns.map(col => {
                // Placeholder for an editable CSA cell
                if (col.key === 'csa' && row.id) { // Ensure row.id exists for dispatch
                  const nodeId = row.id; // Capture nodeId
                  return (
                    <td key={`${col.key}-${nodeId}`}>
                      {String(row[col.key as keyof HarnessData] ?? '')}
                      {/* Placeholder input for editing CSA */}
                      <input
                        type="text"
                        placeholder="New CSA"
                        style={{ marginLeft: '5px', width: '60px' }}
                        aria-label={`Edit CSA for row ${nodeId}`} // Accessibility for input
                        // aria-labelledby={`col-csa row-${nodeId}-label`} // More advanced for real tables
                        value={editValueMap[nodeId] || ''}
                        onChange={(e) => setEditValueMap({ ...editValueMap, [nodeId]: e.target.value })}
                        onBlur={() => {
                          const valueToDispatch = editValueMap[nodeId];
                          if (valueToDispatch && valueToDispatch.trim() !== '') {
                            console.log(`Dispatching updateNodeData for ${nodeId} with CSA: ${valueToDispatch}`);
                            dispatch(updateNodeData({ nodeId, newData: { csa: valueToDispatch } }));
                          }
                        }}
                      />
                    </td>
                  );
                }
                 // Add a button to trigger context menu for the 'id' column as an example
                if (col.key === 'id' && row.id) {
                  const nodeId = row.id;
                  return (
                    // In a real table, the cell itself might handle onContextMenu
                    <td key={`${col.key}-${nodeId}`}>
                      {String(row[col.key as keyof HarnessData] ?? '')}
                      <button
                        onClick={(e) => handleShowTableContextMenu(e, nodeId)}
                        style={{ marginLeft: '5px', padding: '2px 5px', fontSize: '0.8em' }}
                        aria-label={`Actions for row ${nodeId}`} // Accessibility for button
                        aria-haspopup="true" // Indicates it opens a menu
                        aria-expanded={tableMenuVisible && selectedRowId === nodeId} // State of the menu
                      >
                        ☰
                      </button>
                    </td>
                  );
                }
                return (
                  <td key={`${col.key}-${row.id || rowIndex}`}>
                    {String(row[col.key as keyof HarnessData] ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={placeholderColumns.length} style={{ textAlign: 'center' }}>
                No data available or store not populated.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p style={{ fontSize: '0.8em', marginTop: '10px' }}>
        Note: CSA column has a placeholder input for demonstrating `updateNodeData` dispatch.
        ID column has a button to simulate context menu.
      </p>

      {/* Placeholder Context Menu for Table */}
      {/* Placeholder Context Menu for Table */}
      {/* TODO: Implement proper focus management when menu opens/closes.
          When menu opens, focus should go to the first item.
          When menu closes, focus should return to the trigger button.
          Keyboard navigation (arrows, Escape) should work within the menu.
      */}
      {tableMenuVisible && (
        <div
          role="menu" // ARIA role for context menu
          aria-label={`Context menu for row ${selectedRowId}`}
          style={{
            position: 'absolute',
            top: tableMenuPosition.y,
            left: tableMenuPosition.x,
            border: '1px solid #ccc',
            backgroundColor: 'white',
            padding: '10px',
            zIndex: 1000,
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
          }}
        >
          {/* Using button for menu items for better accessibility (focusable, announces as button) */}
          <button role="menuitem" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleTableMenuAction('Edit Row')}>Edit Row ({selectedRowId})</button>
          <button role="menuitem" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleTableMenuAction('Delete Row')}>Delete Row ({selectedRowId})</button>
          <button role="menuitem" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleTableMenuAction('Copy Row Data')}>Copy Row Data ({selectedRowId})</button>
          <hr />
          <button role="menuitem" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: 'blue' }} onClick={() => setTableMenuVisible(false)}>Close Menu</button>
        </div>
      )}
      {/* End of placeholder table structure */}
    </div>
  );
};

export default SpreadsheetPane;
