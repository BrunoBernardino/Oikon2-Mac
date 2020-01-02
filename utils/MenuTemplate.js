const localShortcut = require('electron-localshortcut');
const { shell, app } = require('electron');

const MenuTemplate = (mainWindow) => {

  const openSettings = () => {
    if (mainWindow) {
      mainWindow.webContents.send('open-settings-from-menu');
    }
  };
  localShortcut.register(mainWindow, 'CommandOrControl+,', openSettings);

  const openImport = () => {
    if (mainWindow) {
      mainWindow.webContents.send('open-settings-from-menu');
      setTimeout(() => {
        mainWindow.webContents.send('open-import-from-menu');
      }, 500);
    }
  };
  localShortcut.register(mainWindow, 'CommandOrControl+I', openImport);

  const openExport = () => {
    if (mainWindow) {
      mainWindow.webContents.send('open-settings-from-menu');
      setTimeout(() => {
        mainWindow.webContents.send('open-export-from-menu');
      }, 500);
    }
  };
  localShortcut.register(mainWindow, 'CommandOrControl+E', openExport);

  const openFind = () => {
    if (mainWindow) {
      mainWindow.webContents.send('open-find-from-menu');
    }
  };
  localShortcut.register(mainWindow, 'CommandOrControl+F', openFind);

  const template = [
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'},
        {type: 'separator'},
        {
          label: 'Find...',
          click: openFind,
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'},
      ],
    },
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'},
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Visit Website',
          click () {
            shell.openExternal('https://oikon.brn.sh/');
          },
        },
        {
          label: 'Visit FAQ',
          click () {
            shell.openExternal('https://oikon.brn.sh/faq.html');
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {
          label: 'Preferences...',
          click: openSettings,
        },
        {type: 'separator'},
        {
          label: 'Import CSV',
          click: openImport,
        },
        {
          label: 'Export CSV',
          click: openExport,
        },
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    });

    // Edit menu
    template[1].submenu.push(
      {type: 'separator'},
      {
        label: 'Speech',
        submenu: [
          {role: 'startspeaking'},
          {role: 'stopspeaking'}
        ]
      }
    );

    // Window menu
    template[3].submenu = [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ];
  }

  return template;
};

module.exports = MenuTemplate;
