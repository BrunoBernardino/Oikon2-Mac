const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');
const notie = require('notie');
const { ipcRenderer } = require('electron');
const React = require('react');
const ReactDOM = require('react-dom');

const DataDB = require('./utils/DataDB');
const SettingsDB = require('./utils/SettingsDB')(window.localStorage);

const ExpensesTab = require('./components/ExpensesTab');
const TypesTab = require('./components/TypesTab');
const AddTab = require('./components/AddTab');

const settings = SettingsDB.get();
DataDB.init(settings.remoteURL);

class App extends React.Component {

  constructor() {
    super();

    this.state = {
      filtersStartDate: settings.filters.startDate,
      filtersEndDate: settings.filters.endDate,
      filtersSearch: '',
      filtersVisibleTypes: settings.filters.visibleTypes,
      expenses: [],
      types: [],
      totals: {
        global: 0,
        types: {},
      },
      newCost: '',
      newName: '',
      newType: '(auto)',
      newDate: '',
      newTypeName: '',
    };
  }

  async loadData() {
    const { state } = this;

    await DataDB.get('expenses', (expenses) => {
      // Sort by reversed date
      expenses.sort((a, b) => {
        if (a.date > b.date) {
          return -1;
        }

        if (a.date < b.date) {
          return 1;
        }

        return 0;
      });

      // Filter by dates
      expenses = expenses.filter((expense) => {
        return (expense.date >= state.filtersStartDate && expense.date <= state.filtersEndDate);
      });

      // Filter expenses that don't match the filters
      if (state.filtersSearch) {
        expenses = expenses.filter((expense) => expense.name.toLowerCase().indexOf(state.filtersSearch.toLowerCase()) !== -1);
      }

      // Filter by expense types
      if (state.filtersVisibleTypes.length) {
        expenses = expenses.filter((expense) => {
          const foundIndex = _.findIndex(state.filtersVisibleTypes, (type) => {
            return (type.toLowerCase() === expense.type.toLowerCase());
          });

          return (foundIndex !== -1);
        });
      }

      // Calculate totals
      const totals = {
        global: 0,
        types: {},
      };

      expenses.forEach((expense) => {
        totals.global += expense.cost;
        if (typeof totals.types[expense.type] === 'undefined') totals.types[expense.type] = 0;
        totals.types[expense.type] += expense.cost;
      });

      this.setState({
        expenses,
        totals,
      });
    });

    await DataDB.get('types', (types) => {
      types.forEach((type) => {
        // Override "total" cost as we want to show for the selected timeframe here
        type.cost = this.state.totals.types[type.name] || 0;
      });

      // Append "uncategorized"
      types.splice(0, 0, {
        _id: 0,
        name: 'uncategorized',
        cost: this.state.totals.types[''] || 0,
      });

      this.setState({
        types,
      });
    });
  }

  componentDidMount() {
    // Hide loading and show the "tabs"
    document.getElementById('main-app').style.display = 'flex';
    document.getElementById('main-loading').style.display = 'none';

    this.loadData();

    //
    // Apply max-height to expenses-list and types-list based on window size
    //
    const applyMaxListHeight = () => {
      const height = window.innerHeight;

      const expensesMaxHeight = height - 110;
      const typesMaxHeight = height - 190;

      document.querySelector('#expenses-tab .expenses-list').style.maxHeight = `${expensesMaxHeight}px`;
      document.querySelector('#stats-tab .types-list').style.maxHeight = `${typesMaxHeight}px`;
    };
    applyMaxListHeight();
    window.addEventListener('resize', applyMaxListHeight);

    //
    // Listen for changes in expenses
    //
    ipcRenderer.on('finally-update-expense', (event, expense) => {
      DataDB.update('expense', expense)
        .then(() => {
          this.loadData();

          notie.alert({
            type: 'success',
            text: 'Wohoo! Expense updated.',
          });

          ipcRenderer.send('close-edit-expense-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-edit-expense-error', error.toString());
        });
    });

    ipcRenderer.on('finally-delete-expense', (event, expense) => {
      DataDB.delete('expense', expense)
        .then(() => {
          this.loadData();

          notie.alert({
            type: 'success',
            text: 'Wohoo! Expense deleted.',
          });

          ipcRenderer.send('close-edit-expense-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-edit-expense-error', error.toString());
        });
    });

    //
    // Listen for changes in expense types
    //
    ipcRenderer.on('finally-update-type', (event, type) => {
      DataDB.update('type', type)
        .then(() => {
          this.loadData();

          notie.alert({
            type: 'success',
            text: 'Wohoo! Expense Type updated.',
          });

          ipcRenderer.send('close-edit-type-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-edit-type-error', error.toString());
        });
    });

    ipcRenderer.on('finally-delete-type', (event, type) => {
      DataDB.delete('type', type)
        .then(() => {
          this.loadData();

          notie.alert({
            type: 'success',
            text: 'Wohoo! Expense Type deleted.',
          });

          ipcRenderer.send('close-edit-type-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-edit-type-error', error.toString());
        });
    });

    //
    // Listen for changes in settings
    //
    ipcRenderer.on('finally-update-remoteURL', (event, remoteURL) => {
      const success = SettingsDB.set('remoteURL', remoteURL);
      settings.remoteURL = remoteURL;

      if (success) {
        DataDB.init(remoteURL);

        this.loadData();

        // If it's a lot, we'll need this
        setTimeout(() => {
          this.loadData();
        }, 2000);

        notie.alert({
          type: 'success',
          text: 'Wohoo! Remote URL updated. Re-synchronizing...',
        });
      } else {
        ipcRenderer.send('receive-settings-error', 'Error saving new remote URL.');
      }
    });

    ipcRenderer.on('finally-delete-all-data', () => {
      DataDB.deleteDB()
        .then(() => {
          DataDB.init(settings.remoteURL);

          this.loadData();

          notie.alert({
            type: 'success',
            text: 'Wohoo! All data deleted.',
          });

          ipcRenderer.send('close-settings-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-settings-error', error.toString());
        });
    });

    ipcRenderer.on('finally-import-csv', (event, filePath) => {
      const fileContents = fs.readFileSync(filePath, 'utf8');

      this.parseDataFromCSV(fileContents)
        .then(() => {
          this.loadData();

          notie.alert({
            type: 'success',
            text: 'Wohoo! CSV file imported.',
          });

          ipcRenderer.send('close-settings-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-settings-error', error.toString());
        });
    });

    ipcRenderer.on('finally-export-csv', (event, filePath) => {
      this.getCSVContents()
        .then((fileContents) => {
          fs.writeFileSync(filePath, fileContents, 'utf8');

          notie.alert({
            type: 'success',
            text: 'Wohoo! CSV file exported.',
          });

          ipcRenderer.send('close-settings-window');
        })
        .catch((error) => {
          ipcRenderer.send('receive-settings-error', error.toString());
        });
    });

    //
    // Listen for menu requests
    //
    ipcRenderer.on('open-settings-from-menu', () => {
      ipcRenderer.send('open-settings-window', settings.remoteURL);
    });

    ipcRenderer.on('open-import-from-menu', () => {
      ipcRenderer.send('import-csv');
    });

    ipcRenderer.on('open-export-from-menu', () => {
      ipcRenderer.send('export-csv');
    });

    ipcRenderer.on('open-find-from-menu', () => {
      document.querySelector('input[name="search"]').focus();
    });

  }

  //
  // Expenses Tab
  //
  onFromDateClick() {
    swal({
      title: 'From Date',
      text: 'Expenses and totals will be shown only for expenses after this date (inclusive).',
      type: 'input',
      inputType: 'date',
      inputValue: this.state.filtersStartDate,
      showCancelButton: true,
      closeOnConfirm: false,
    }, (fromDate) => {
      if (!fromDate || !moment(fromDate, 'YYYY-MM-DD').isValid()) {
        return swal('Oops!', 'Error: Please choose a valid date!', 'error');
      }

      swal.close();

      SettingsDB.set('filters.startDate', fromDate);

      this.setState({
        filtersStartDate: fromDate,
      });

      // Ugh...
      setTimeout(() => this.loadData(), 0);
    });
  }

  onToDateClick() {
    swal({
      title: 'To Date',
      text: 'Expenses and totals will be shown only for expenses before this date (inclusive).',
      type: 'input',
      inputType: 'date',
      inputValue: this.state.filtersEndDate,
      showCancelButton: true,
      closeOnConfirm: false,
    }, (toDate) => {
      if (!toDate || !moment(toDate, 'YYYY-MM-DD').isValid()) {
        return swal('Oops!', 'Error: Please choose a valid date!', 'error');
      }

      swal.close();

      SettingsDB.set('filters.endDate', toDate);

      this.setState({
        filtersEndDate: toDate,
      });

      // Ugh...
      setTimeout(() => this.loadData(), 0);
    });
  }

  onExpenseClick(expense) {
    const { types } = this.state;

    ipcRenderer.send('open-edit-expense-window', expense, types);
  }

  //
  // Types Tab
  //
  onSearchChange(event) {
    const newValue = event.target.value;

    this.setState({
      filtersSearch: newValue,
    });

    // Ugh...
    setTimeout(() => this.loadData(), 0);
  }

  onTypeClick(type) {
    if (type.name === 'uncategorized') {
      return swal('Oops!', 'Error: You can\'t edit uncategorized!', 'error');
    }

    ipcRenderer.send('open-edit-type-window', type);
  }

  onToggleVisibleType(typeName) {
    if (typeName === 'uncategorized') {
      typeName = '';
    }

    const newVisibleTypes = _.clone(this.state.filtersVisibleTypes);
    const existingIndex = newVisibleTypes.indexOf(typeName);

    if (existingIndex !== -1) {
      newVisibleTypes.splice(existingIndex, 1);
    } else {
      newVisibleTypes.push(typeName);
    }

    SettingsDB.set('filters.visibleTypes', newVisibleTypes);

    this.setState({
      filtersVisibleTypes: newVisibleTypes,
    });

    // Ugh...
    setTimeout(() => this.loadData(), 0);
  }

  //
  // Add Tab
  //
  onValueChange(fieldName, event) {
    const newValue = event.target.value;

    this.setState({
      [fieldName]: newValue,
    });
  }

  onSave() {
    const { state } = this;

    const expense = {
      cost: state.newCost,
      name: state.newName,
      type: state.newType,
      date: state.newDate,
    };

    DataDB.add('expense', expense)
      .then(() => {
        this.setState({
          newCost: '',
          newName: '',
          newType: '(auto)',
          newDate: '',
        });

        this.loadData();

        notie.alert({
          type: 'success',
          text: 'Wohoo! Expense added.',
        });
      })
      .catch((error) => {
        swal('Oops!', error.toString(), 'error');
      });
  }

  onTypeSave() {
    const { state } = this;

    const type = {
      name: state.newTypeName,
      cost: 0,
      count: 0,
    };

    DataDB.add('type', type)
      .then(() => {
        this.setState({
          newTypeName: '',
        });

        this.loadData();

        notie.alert({
          type: 'success',
          text: 'Wohoo! Expense Type added.',
        });
      })
      .catch((error) => {
        swal('Oops!', error.toString(), 'error');
      });
  }

  //
  // Settings Button
  //
  onSettingsClick() {
    ipcRenderer.send('open-settings-window', settings.remoteURL);
  }

  prepareValueForCSV(value) {
    return value.replace(',', ';')
      .replace('\n', ' ')
      .replace('"', '\'');
  }

  async getCSVContents() {
    // Compatible with Oikon 1
    const lines = [
      'Name,Type,Date,Value',
    ];

    await DataDB.get('expenses', (expenses) => {
      expenses.forEach((expense) => {
        const expenseName = this.prepareValueForCSV(expense.name);
        const expenseType = this.prepareValueForCSV(expense.type || 'uncategorized');
        const expenseDate = this.prepareValueForCSV(expense.date);
        const expenseValue = this.prepareValueForCSV(expense.cost.toFixed(2));

        lines.push(`${expenseName},${expenseType},${expenseDate},${expenseValue}`);
      });
    });

    return lines.join('\n');
  }

  async parseDataFromCSV(contents) {
    const lines = contents.split('\n');

    if (lines.length < 1 || lines[0] !== 'Name,Type,Date,Value') {
      return Promise.reject('Invalid format');
    }

    lines.shift();// Remove the first line
    let line = lines.shift();

    while (line) {
      const values = line.split(',');

      const expense = {
        name: values[0],
        type: values[1],
        date: values[2],
        cost: parseFloat(values[3]),
      };

      await DataDB.add('expense', expense);

      // Try to add the expense type, but don't worry about failures
      try {
        const type = {
          name: expense.type,
          count: 0,
          cost: 0,
        };

        await DataDB.add('type', type);
      } catch (e) {
        // Ignore
      }

      line = lines.shift();
    }

    return Promise.resolve(true);
  }

  render() {
    const { state } = this;

    return (
      <div id="main-app-container">
        <ExpensesTab
          expenses={state.expenses}
          fromDate={state.filtersStartDate}
          toDate={state.filtersEndDate}
          onFromDateClick={this.onFromDateClick.bind(this)}
          onToDateClick={this.onToDateClick.bind(this)}
          onExpenseClick={this.onExpenseClick.bind(this)}
        />

        <TypesTab
          types={state.types}
          visibleTypes={state.filtersVisibleTypes}
          search={state.filtersSearch}
          total={state.totals.global}
          onSearchChange={this.onSearchChange.bind(this)}
          onTypeClick={this.onTypeClick.bind(this)}
          onToggleVisibleType={this.onToggleVisibleType.bind(this)}
        />

        <AddTab
          newCost={state.newCost}
          newName={state.newName}
          newType={state.newType}
          newDate={state.newDate}
          newTypeName={state.newTypeName}
          types={state.types}
          onCostChange={this.onValueChange.bind(this, 'newCost')}
          onNameChange={this.onValueChange.bind(this, 'newName')}
          onTypeChange={this.onValueChange.bind(this, 'newType')}
          onDateChange={this.onValueChange.bind(this, 'newDate')}
          onSave={this.onSave.bind(this)}
          onTypeNameChange={this.onValueChange.bind(this, 'newTypeName')}
          onTypeSave={this.onTypeSave.bind(this)}
        />

        <button id="settings-button" onClick={this.onSettingsClick}><img src="./assets/settings.png" alt="Settings" title="Settings" /></button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('main-app'));
