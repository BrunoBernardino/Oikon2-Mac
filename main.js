const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
} = require('electron');

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 570,
    titleBarStyle: 'hidden',
    minWidth: 425,
    minHeight: 250,
    backgroundColor: '#2C9EED',
    scrollBounce: true,
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //
  // Build Menu
  //
  const MenuTemplate = require('./utils/MenuTemplate')(mainWindow);
  const menu = Menu.buildFromTemplate(MenuTemplate);
  Menu.setApplicationMenu(menu);
};

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

//
// Editing Expenses
//
const createExpenseModalWindow = (expense, types) => {
  let child = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height: 345,
    titleBarStyle: 'hidden',
    minWidth: 200,
    minHeight: 250,
    backgroundColor: '#FFFFFF',
    scrollBounce: true,
  });

  child.loadURL(url.format({
    pathname: path.join(__dirname, 'edit-expense.html'),
    protocol: 'file:',
    slashes: true
  }));

  setTimeout(() => {
    child.webContents.send('send-expense-for-edit', expense, types);
  }, 200);// child.on('ready') and 'ready-to-show' didn't work

  // child.webContents.openDevTools();

  // Emitted when the window is closed.
  child.on('closed', () => {
    child = null;
  });

  ipcMain.removeAllListeners('update-expense');
  ipcMain.on('update-expense', (event, expense) => {
    if (mainWindow) {
      mainWindow.webContents.send('finally-update-expense', expense);
    }
  });

  ipcMain.removeAllListeners('delete-expense');
  ipcMain.on('delete-expense', (event, expense) => {
    if (mainWindow) {
      mainWindow.webContents.send('finally-delete-expense', expense);
    }
  });

  ipcMain.removeAllListeners('receive-edit-expense-error');
  ipcMain.on('receive-edit-expense-error', (event, error) => {
    if (child) {
      child.webContents.send('finally-receive-edit-expense-error', error);
    }
  });

  ipcMain.removeAllListeners('close-edit-expense-window');
  ipcMain.on('close-edit-expense-window', () => {
    if (child) {
      child.close();
    }
  });
};

ipcMain.removeAllListeners('open-edit-expense-window');
ipcMain.on('open-edit-expense-window', (event, expense, types) => {
  createExpenseModalWindow(expense, types);
});

//
// Editing Expense Types
//
const createTypeModalWindow = (type) => {
  let child = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height: 310,
    titleBarStyle: 'hidden',
    minWidth: 200,
    minHeight: 200,
    backgroundColor: '#FFFFFF',
    scrollBounce: true,
  });

  child.loadURL(url.format({
    pathname: path.join(__dirname, 'edit-type.html'),
    protocol: 'file:',
    slashes: true
  }));

  setTimeout(() => {
    child.webContents.send('send-type-for-edit', type);
  }, 200);// child.on('ready') and 'ready-to-show' didn't work

  // child.webContents.openDevTools();

  // Emitted when the window is closed.
  child.on('closed', () => {
    child = null;
  });

  ipcMain.removeAllListeners('update-type');
  ipcMain.on('update-type', (event, type) => {
    if (mainWindow) {
      mainWindow.webContents.send('finally-update-type', type);
    }
  });

  ipcMain.removeAllListeners('delete-type');
  ipcMain.on('delete-type', (event, type) => {
    if (mainWindow) {
      mainWindow.webContents.send('finally-delete-type', type);
    }
  });

  ipcMain.removeAllListeners('receive-edit-type-error');
  ipcMain.on('receive-edit-type-error', (event, error) => {
    if (child) {
      child.webContents.send('finally-receive-edit-type-error', error);
    }
  });

  ipcMain.removeAllListeners('close-edit-type-window');
  ipcMain.on('close-edit-type-window', () => {
    if (child) {
      child.close();
    }
  });
};

ipcMain.removeAllListeners('open-edit-type-window');
ipcMain.on('open-edit-type-window', (event, type) => {
  createTypeModalWindow(type);
});

//
// Editing Settings
//
const createSettingsModalWindow = (remoteURL) => {
  let child = new BrowserWindow({
    parent: mainWindow,
    width: 350,
    height: 380,
    titleBarStyle: 'hidden',
    minWidth: 200,
    minHeight: 200,
    backgroundColor: '#FFFFFF',
    scrollBounce: true,
  });

  child.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true
  }));

  setTimeout(() => {
    child.webContents.send('send-remoteURL-for-settings', remoteURL);
  }, 200);// child.on('ready') and 'ready-to-show' didn't work

  // child.webContents.openDevTools();

  // Emitted when the window is closed.
  child.on('closed', () => {
    child = null;
  });

  ipcMain.removeAllListeners('update-remoteURL');
  ipcMain.on('update-remoteURL', (event, remoteURL) => {
    if (mainWindow) {
      mainWindow.webContents.send('finally-update-remoteURL', remoteURL);
    }
  });

  ipcMain.removeAllListeners('delete-all-data');
  ipcMain.on('delete-all-data', () => {
    if (mainWindow) {
      mainWindow.webContents.send('finally-delete-all-data');
    }
  });

  ipcMain.removeAllListeners('import-csv');
  ipcMain.on('import-csv', () => {
    if (mainWindow) {
      dialog.showOpenDialog({
        title: 'Choose CSV File',
        filters: [
          { name: 'CSV', extensions: ['csv'] },
        ],
        properties: ['openFile'],
      }, (filePaths) => {
        if (filePaths && filePaths.length) {
          mainWindow.webContents.send('finally-import-csv', filePaths[0]);
        }
      });
    }
  });

  ipcMain.removeAllListeners('export-csv');
  ipcMain.on('export-csv', () => {
    if (mainWindow) {
      dialog.showSaveDialog({
        title: 'Choose where to create the CSV file',
        defaultPath: `oikon-export-${new Date().getTime()}.csv`,
        filters: [
          { name: 'CSV', extensions: ['csv'] },
        ],
      }, (filePath) => {
        if (filePath) {
          mainWindow.webContents.send('finally-export-csv', filePath);
        }
      });
    }
  });

  ipcMain.removeAllListeners('receive-settings-error');
  ipcMain.on('receive-settings-error', (event, error) => {
    if (child) {
      child.webContents.send('finally-receive-settings-error', error);
    }
  });

  ipcMain.removeAllListeners('close-settings-window');
  ipcMain.on('close-settings-window', () => {
    if (child) {
      child.close();
    }
  });
};

ipcMain.removeAllListeners('open-settings-window');
ipcMain.on('open-settings-window', (event, remoteURL) => {
  createSettingsModalWindow(remoteURL);
});
