const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const { dialog } = electron.remote;
const React = require('react');
const ReactDOM = require('react-dom');

// TODO: Ideally this component could reuse most of the AddTab one

class App extends React.Component {

  constructor() {
    super();

    this.state = {
      _id: '',
      _rev: '',
      name: '',
      cost: '',
      type: '',
      date: '',
    };
  }

  componentDidMount() {
    const { expense } = this.props;

    this.setState({
      _id: expense._id,
      _rev: expense._rev,
      name: expense.name,
      cost: expense.cost,
      type: expense.type,
      date: expense.date,
    });
  }

  onCancel() {
    ipcRenderer.send('close-edit-expense-window');
  }

  onDelete() {
    const confirmation = confirm('Are you sure?', 'Are you sure you want to delete this expense?');

    if (!confirmation) {
      return;
    }

    const { state } = this;

    const expense = {
      _id: state._id,
      _rev: state._rev,
      name: state.name,
      cost: state.cost,
      type: state.type,
      date: state.date,
    };

    ipcRenderer.send('delete-expense', expense);
  }

  onSave() {
    const { state } = this;

    const expense = {
      _id: state._id,
      _rev: state._rev,
      name: state.name,
      cost: state.cost,
      type: state.type,
      date: state.date,
    };

    ipcRenderer.send('update-expense', expense);
  }

  onValueChange(fieldName, event) {
    const newValue = event.target.value;

    this.setState({
      [fieldName]: newValue,
    });
  }

  submitOnEnter(event) {
    if (event.key === 'Enter') {
      this.onSave();
    }
  }

  render() {
    const { state } = this;
    const { types } = this.props;

    const expense = {
      name: state.name,
      cost: state.cost,
      type: state.type,
      date: state.date,
    };

    return (
      <div id="main-app-container">
        <h1>Edit Expense</h1>
        <div className="input-field">
          <label htmlFor="cost">Cost</label>
          <input
            name="cost"
            type="number"
            placeholder="9.99"
            value={expense.cost}
            onChange={this.onValueChange.bind(this, 'cost')}
          />
        </div>
        <div className="input-field">
          <label htmlFor="name">Name</label>
          <input
            name="name"
            type="text"
            placeholder="coffee"
            value={expense.name}
            onChange={this.onValueChange.bind(this, 'name')}
          />
        </div>
        <div className="input-field">
          <label htmlFor="type">Type</label>
          <select
            name="type"
            onChange={this.onValueChange.bind(this, 'type')}
            value={expense.type}
            onKeyPress={this.submitOnEnter.bind(this)}
          >
            <option value="(auto)">(auto)</option>
            {types.map((type) => (
              <option key={type._id} value={(type.name === 'uncategorized' ? '' : type.name)}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="input-field">
          <label htmlFor="date">Date</label>
          <input
            name="date"
            type="date"
            placeholder="today"
            value={expense.date}
            onChange={this.onValueChange.bind(this, 'date')}
            onKeyPress={this.submitOnEnter.bind(this)}
          />
        </div>
        <div className="buttons-wrapper">
          <button onClick={this.onCancel}>
            Cancel
          </button>
          <button onClick={this.onSave.bind(this)}>
            Update Expense
          </button>
          <button className="delete" onClick={this.onDelete.bind(this)}>
            Delete
          </button>
        </div>
      </div>
    );
  }
}

//
// Render expense
//
ipcRenderer.on('send-expense-for-edit', (event, expense, types) => {
  ReactDOM.render(<App expense={expense} types={types} />, document.getElementById('main-app'));
});

ipcRenderer.on('finally-receive-edit-expense-error', (event, error) => {
  dialog.showErrorBox('Oops!', error);
});
