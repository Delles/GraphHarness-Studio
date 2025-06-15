import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import * as graphService from './services/graph-service';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200, // Increased width
    height: 800,  // Increased height
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // If you need a preload script
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server URL
    mainWindow.webContents.openDevTools();
  } else {
    // Adjust path for production build; this might vary based on your build output structure
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  createWindow();

  try {
    await graphService.getDriver(); // Initialize driver
    console.log('Neo4j Driver initialized.');
    await graphService.createIndexes();
    console.log('Neo4j indexes checked/created successfully.');
  } catch (error) {
    console.error('Failed to initialize graph service or create indexes:', error);
    // Consider informing the user or quitting the app
  }

  // IPC Handlers for Graph Service
  // Wire CRUD
  ipcMain.handle('graph:createWire', async (_event, data) => graphService.createWire(data));
  ipcMain.handle('graph:getWireById', async (_event, wireId) => graphService.getWireById(wireId));
  ipcMain.handle('graph:updateWire', async (_event, wireId, data) => graphService.updateWire(wireId, data));
  ipcMain.handle('graph:deleteWire', async (_event, wireId) => graphService.deleteWire(wireId));

  // Connector CRUD
  ipcMain.handle('graph:createConnector', async (_event, data) => graphService.createConnector(data));
  ipcMain.handle('graph:getConnectorById', async (_event, connectorId) => graphService.getConnectorById(connectorId));
  ipcMain.handle('graph:updateConnector', async (_event, connectorId, data) => graphService.updateConnector(connectorId, data));
  ipcMain.handle('graph:deleteConnector', async (_event, connectorId) => graphService.deleteConnector(connectorId));

  // Cavity CRUD
  ipcMain.handle('graph:createCavity', async (_event, data) => graphService.createCavity(data));
  ipcMain.handle('graph:getCavityById', async (_event, cavityId) => graphService.getCavityById(cavityId));
  ipcMain.handle('graph:updateCavity', async (_event, cavityId, data) => graphService.updateCavity(cavityId, data));
  ipcMain.handle('graph:deleteCavity', async (_event, cavityId) => graphService.deleteCavity(cavityId));

  // Splice CRUD
  ipcMain.handle('graph:createSplice', async (_event, data) => graphService.createSplice(data));
  ipcMain.handle('graph:getSpliceById', async (_event, spliceId) => graphService.getSpliceById(spliceId));
  ipcMain.handle('graph:updateSplice', async (_event, spliceId, data) => graphService.updateSplice(spliceId, data));
  ipcMain.handle('graph:deleteSplice', async (_event, spliceId) => graphService.deleteSplice(spliceId));

  // Relationship Management
  ipcMain.handle('graph:addWireToCavity', async (_event, wireId, cavityId, props) => graphService.addWireToCavity(wireId, cavityId, props));
  ipcMain.handle('graph:addCavityToConnector', async (_event, cavityId, connectorId) => graphService.addCavityToConnector(cavityId, connectorId));
  ipcMain.handle('graph:addWireToSplice', async (_event, wireId, spliceId, props) => graphService.addWireToSplice(wireId, spliceId, props));

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    await graphService.closeDriver(); // Close Neo4j driver connection
    console.log('Neo4j driver closed.');
    app.quit();
  }
});
