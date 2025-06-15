import { contextBridge, ipcRenderer } from 'electron';

// It's good practice to list the channels you expect to use.
// This provides a clear overview and can help with debugging.
const validChannels = {
  // Wire
  createWire: 'graph:createWire',
  getWireById: 'graph:getWireById',
  updateWire: 'graph:updateWire',
  deleteWire: 'graph:deleteWire',
  // Connector
  createConnector: 'graph:createConnector',
  getConnectorById: 'graph:getConnectorById',
  updateConnector: 'graph:updateConnector',
  deleteConnector: 'graph:deleteConnector',
  // Cavity
  createCavity: 'graph:createCavity',
  getCavityById: 'graph:getCavityById',
  updateCavity: 'graph:updateCavity',
  deleteCavity: 'graph:deleteCavity',
  // Splice
  createSplice: 'graph:createSplice',
  getSpliceById: 'graph:getSpliceById',
  updateSplice: 'graph:updateSplice',
  deleteSplice: 'graph:deleteSplice',
  // Relationships
  addWireToCavity: 'graph:addWireToCavity',
  addCavityToConnector: 'graph:addCavityToConnector',
  addWireToSplice: 'graph:addWireToSplice',
};

contextBridge.exposeInMainWorld('api', {
  graph: {
    // Wire CRUD
    createWire: (data: any) => ipcRenderer.invoke(validChannels.createWire, data),
    getWireById: (wireId: string) => ipcRenderer.invoke(validChannels.getWireById, wireId),
    updateWire: (wireId: string, data: any) => ipcRenderer.invoke(validChannels.updateWire, wireId, data),
    deleteWire: (wireId: string) => ipcRenderer.invoke(validChannels.deleteWire, wireId),

    // Connector CRUD
    createConnector: (data: any) => ipcRenderer.invoke(validChannels.createConnector, data),
    getConnectorById: (connectorId: string) => ipcRenderer.invoke(validChannels.getConnectorById, connectorId),
    updateConnector: (connectorId: string, data: any) => ipcRenderer.invoke(validChannels.updateConnector, connectorId, data),
    deleteConnector: (connectorId: string) => ipcRenderer.invoke(validChannels.deleteConnector, connectorId),

    // Cavity CRUD
    createCavity: (data: any) => ipcRenderer.invoke(validChannels.createCavity, data),
    getCavityById: (cavityId: string) => ipcRenderer.invoke(validChannels.getCavityById, cavityId),
    updateCavity: (cavityId: string, data: any) => ipcRenderer.invoke(validChannels.updateCavity, cavityId, data),
    deleteCavity: (cavityId: string) => ipcRenderer.invoke(validChannels.deleteCavity, cavityId),

    // Splice CRUD
    createSplice: (data: any) => ipcRenderer.invoke(validChannels.createSplice, data),
    getSpliceById: (spliceId: string) => ipcRenderer.invoke(validChannels.getSpliceById, spliceId),
    updateSplice: (spliceId: string, data: any) => ipcRenderer.invoke(validChannels.updateSplice, spliceId, data),
    deleteSplice: (spliceId: string) => ipcRenderer.invoke(validChannels.deleteSplice, spliceId),

    // Relationship Management
    addWireToCavity: (wireId: string, cavityId: string, props: any) => ipcRenderer.invoke(validChannels.addWireToCavity, wireId, cavityId, props),
    addCavityToConnector: (cavityId: string, connectorId: string) => ipcRenderer.invoke(validChannels.addCavityToConnector, cavityId, connectorId),
    addWireToSplice: (wireId: string, spliceId: string, props: any) => ipcRenderer.invoke(validChannels.addWireToSplice, wireId, spliceId, props),
  }
});

console.log('Preload script processed and API exposed to window.api.graph');
// For type safety, you would import types from graph-service.ts (or a shared types file)
// and use them for `data` and `props` parameters, e.g.
// createWire: (data: CreateWireInput) => ipcRenderer.invoke(validChannels.createWire, data),
// This requires your build process to handle TypeScript in preload.ts correctly.
// The `any` type is used here for simplicity in this step, assuming type checking
// is primarily handled in the main process (by Zod) and in the renderer-side calls.
