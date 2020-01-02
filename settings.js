const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const { dialog } = electron.remote;
const { shell } = electron;
const React = require('react');
const ReactDOM = require('react-dom');

class App extends React.Component {

  constructor() {
    super();

    this.state = {
      remoteURL: '',
    };
  }

  componentDidMount() {
    const { remoteURL } = this.props;

    this.setState({
      remoteURL,
    });
  }

  onFAQClick() {
    shell.openExternal('https://oikon.brn.sh/faq.html');
  }

  onDelete() {
    const confirmation = confirm('Are you sure?', 'Are you sure you want to delete all data, including the data synchronized?');

    if (!confirmation) {
      return;
    }

    ipcRenderer.send('delete-all-data');
  }

  onImport() {
    ipcRenderer.send('import-csv');
  }

  onExport() {
    ipcRenderer.send('export-csv');
  }

  onChangeRemoteURLValue(event) {
    const remoteURL = event.target.value;

    this.setState({
      remoteURL,
    });
  }

  onChangeRemoteURL() {
    const { remoteURL } = this.state;

    ipcRenderer.send('update-remoteURL', remoteURL);
  }

  render() {
    const { state } = this;

    return (
      <div id="main-app-container">
        <h1>Settings</h1>
        <div className="input-field">
          <label htmlFor="remoteURL">URL</label>
          <input
            name="remoteURL"
            type="password"
            placeholder="https://example.com"
            value={state.remoteURL}
            onChange={this.onChangeRemoteURLValue.bind(this)}
            onBlur={this.onChangeRemoteURL.bind(this)}
          />
        </div>
        <p>URL for a Remote CouchDB server. No trailing slash.</p>
        <div className="buttons-wrapper">
          <button onClick={this.onImport} style={{flex: 0.5}}>
            Import CSV
          </button>
          <button onClick={this.onExport} style={{flex: 0.5}}>
            Export CSV
          </button>
        </div>
        <p>If you need more information, visit <a href="#" onClick={this.onFAQClick}>our FAQ</a>.</p>
        <div className="buttons-wrapper">
          <button className="delete" onClick={this.onDelete} style={{flex: 1}}>
            Delete All Data
          </button>
        </div>
      </div>
    );
  }
}

//
// Render settings
//
ipcRenderer.on('send-remoteURL-for-settings', (event, remoteURL) => {
  ReactDOM.render(<App remoteURL={remoteURL} />, document.getElementById('main-app'));
});

ipcRenderer.on('finally-receive-settings-error', (event, error) => {
  dialog.showErrorBox('Oops!', error);
});
