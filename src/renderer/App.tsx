import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';

// TODO: Future Scalability - Consider refactoring to a feature-based folder structure
// as outlined in "docs/GraphHarness Studio – Technical Blueprint.md" (section 8.4).
// For example: src/renderer/features/dualPane/ (containing MainLayout, SpreadsheetPane, CanvasPane)
// and src/renderer/features/graphData/ (containing graphSlice and related store logic).
// This would involve moving components and store slices into their respective feature folders.
// For now, the current components/ and store/ structure is adequate for the initial placeholder phase.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
