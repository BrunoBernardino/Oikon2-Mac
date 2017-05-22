const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const { dialog } = electron.remote;
const React = require('react');
const ReactDOM = require('react-dom');

class App extends React.Component {

  constructor() {
    super();

    this.state = {
      _id: '',
      _rev: '',
      name: '',
      cost: 0,
      count: 0,
    };
  }

  componentDidMount() {
    const { type } = this.props;

    this.setState({
      _id: type._id,
      _rev: type._rev,
      name: type.name,
      cost: type.cost,
      count: type.count,
    });
  }

  onCancel() {
    ipcRenderer.send('close-edit-type-window');
  }

  onDelete() {
    const confirmation = confirm('Are you sure?', 'Are you sure you want to delete this expense type?');

    if (!confirmation) {
      return;
    }

    const { state } = this;

    const type = {
      _id: state._id,
      _rev: state._rev,
      name: state.name,
      cost: state.cost,
      count: state.count,
    };

    ipcRenderer.send('delete-type', type);
  }

  onSave() {
    const { state } = this;

    const type = {
      _id: state._id,
      _rev: state._rev,
      name: state.name,
      cost: state.cost,
      count: state.count,
    };

    ipcRenderer.send('update-type', type);
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

    const type = {
      name: state.name,
    };

    return (
      <div id="main-app-container">
        <h1>Edit Expense Type</h1>
        <div className="input-field">
          <label htmlFor="name">Name</label>
          <input
            name="name"
            type="text"
            placeholder="coffee"
            value={type.name}
            onChange={this.onValueChange.bind(this, 'name')}
          />
        </div>
        <div className="buttons-wrapper">
          <button onClick={this.onCancel}>
            Cancel
          </button>
          <button onClick={this.onSave.bind(this)}>
            Update Type
          </button>
          <button className="delete" onClick={this.onDelete.bind(this)}>
            Delete
          </button>
        </div>
        <p>Please note that updating an expense type does not update all related expenses.</p>
        <p>You will have to update them manually.</p>
      </div>
    );
  }
}

//
// Render expense type
//
ipcRenderer.on('send-type-for-edit', (event, type) => {
  ReactDOM.render(<App type={type} />, document.getElementById('main-app'));
});

ipcRenderer.on('finally-receive-edit-type-error', (event, error) => {
  dialog.showErrorBox('Oops!', error);
});
