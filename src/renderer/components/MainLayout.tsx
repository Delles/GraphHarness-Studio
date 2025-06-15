import React, { useEffect } from 'react'; // Added useEffect
import SpreadsheetPane from './SpreadsheetPane';
import CanvasPane from './CanvasPane';

const MainLayout: React.FC = () => {
  // Placeholder for view-specific keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Example: Ctrl+Shift+K
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
        console.log('Placeholder: MainLayout - Ctrl+Shift+K pressed. Would trigger a view-specific action.');
        // Prevent default browser behavior if necessary
        // event.preventDefault();
      }
      // Example: Simple 'Escape' key press
      if (event.key === 'Escape') {
        console.log('Placeholder: MainLayout - Escape key pressed. Could be used to close modals or context menus.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('MainLayout: Keydown listener added for placeholder shortcuts.');

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('MainLayout: Keydown listener removed.');
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    // Conceptual main wrapper for the application content
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }} role="application" aria-label="GraphHarness Studio Application">
      {/* TODO: Define .visually-hidden CSS class globally (e.g., in index.css)
          .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
      */}
      {/* Header area - h1 is usually part of a header landmark */}
      <header style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <h1>Main Layout</h1>
        {/* Add other header controls/nav here if any */}
      </header>
      {/* Main content area housing the two panes */}
      <div style={{ display: 'flex', flexGrow: 1 }} role="main"> {/* Conceptual main content landmark */}
        {/* Spreadsheet Pane Section - could be an aside or a main section depending on app structure */}
        <section style={{ flex: 1, overflow: 'auto', padding: '10px' }} aria-labelledby="spreadsheet-pane-heading">
          <h2 id="spreadsheet-pane-heading" className="visually-hidden">Spreadsheet Data View</h2> {/* Visually hidden heading for screen readers */}
          <SpreadsheetPane />
        </section>
        {/* Canvas Pane Section - could be an aside or a main section */}
        <section style={{ flex: 1, overflow: 'auto', padding: '10px' }} aria-labelledby="canvas-pane-heading">
          <h2 id="canvas-pane-heading" className="visually-hidden">Canvas Visualization View</h2> {/* Visually hidden heading */}
          <CanvasPane />
        </section>
      </div>
      {/* Potential footer area */}
      {/* <footer style={{ padding: '10px', borderTop: '1px solid #ccc' }}>
        <p>Status bar or footer information</p>
      </footer> */}
    </div>
  );
};

export default MainLayout;
