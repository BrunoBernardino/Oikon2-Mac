const moment = require('moment');

const SettingsDBInit = (localStorage) => {
  const settings = {
    filters: {
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD'),
      visibleTypes: [],
    },
    remoteURL: '',
  };

  // Update with whatever might exist from previous sessions
  settings.filters.startDate = localStorage.getItem('settings.filters.startDate') || settings.filters.startDate;
  settings.filters.endDate = localStorage.getItem('settings.filters.endDate') || settings.filters.endDate;
  settings.filters.visibleTypes = (localStorage.getItem('settings.filters.visibleTypes') || '').split(',,,') || settings.filters.visibleTypes;
  settings.remoteURL = localStorage.getItem('settings.remoteURL') || settings.remoteURL;

  // Edge case with empty visibleTypes
  if (settings.filters.visibleTypes.length === 1 && settings.filters.visibleTypes[0] === '') {
    settings.filters.visibleTypes.length = [];
  }

  const allowedSettingsKeys = [
    'filters.startDate',
    'filters.endDate',
    'filters.visibleTypes',
    'remoteURL'
  ];

  const SettingsDB = {
    get: () => settings,

    set: (key, value) => {
      if (typeof value === 'undefined' || value === null) {
        console.error('Got undefined or null for value and those are not allowed.');
        return false;
      }

      if (allowedSettingsKeys.indexOf(key) === -1) {
        console.error(`Key "${key}" is not allowed. Allowed keys are: "${allowedSettingsKeys.join(', ')}"`);
        return false;
      }

      // Convert arrays to ,,,-split strings
      if (key === 'filters.visibleTypes') {
        value = value.join(',,,');
      }

      localStorage.setItem(`settings.${key}`, value);

      return true;
    },
  };

  return SettingsDB;
};

module.exports = SettingsDBInit;
