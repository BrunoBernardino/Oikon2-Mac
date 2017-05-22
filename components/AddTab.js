const React = require('react');
const PropTypes = require('prop-types');

class AddTab extends React.Component {
  submitOnEnter(event) {
    if (event.key === 'Enter') {
      this.props.onSave();
    }
  }

  submitTypeOnEnter(event) {
    if (event.key === 'Enter') {
      this.props.onTypeSave();
    }
  }

  render() {
    const {
      newCost,
      newName,
      newType,
      newDate,
      newTypeName,
      types,
      onCostChange,
      onNameChange,
      onTypeChange,
      onDateChange,
      onSave,
      onTypeNameChange,
      onTypeSave,
    } = this.props;

    return (
      <section id="add-tab">
        <h1><img src="./assets/logo.png" alt="Oikon 2" /></h1>

        <section id="add-expense">
          <div className="input-field">
            <label htmlFor="cost">Cost</label>
            <input
              name="cost"
              type="number"
              placeholder="9.99"
              onChange={onCostChange}
              value={newCost}
              onKeyPress={this.submitOnEnter.bind(this)}
            />
          </div>
          <div className="input-field">
            <label htmlFor="name">Name</label>
            <input
              name="name"
              type="text"
              placeholder="coffee"
              onChange={onNameChange}
              value={newName}
              onKeyPress={this.submitOnEnter.bind(this)}
            />
          </div>
          <div className="input-field">
            <label htmlFor="type">Type</label>
            <select
              name="type"
              onChange={onTypeChange}
              value={newType}
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
              onChange={onDateChange}
              value={newDate}
              onKeyPress={this.submitOnEnter.bind(this)}
            />
          </div>
          <button onClick={onSave}>
            Add Expense
          </button>
        </section>

        <section id="add-expense-type">
          <div className="input-field">
            <label htmlFor="name">Name</label>
            <input
              name="name"
              type="text"
              placeholder="Food"
              onChange={onTypeNameChange}
              value={newTypeName}
              onKeyPress={this.submitTypeOnEnter.bind(this)}
            />
          </div>
          <button onClick={onTypeSave}>
            Add Expense Type
          </button>
        </section>
      </section>
    );
  }
}

AddTab.propTypes = {
  newCost: PropTypes.string.isRequired,
  newName: PropTypes.string.isRequired,
  newType: PropTypes.string.isRequired,
  newDate: PropTypes.string.isRequired,
  newTypeName: PropTypes.string.isRequired,
  types: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      cost: PropTypes.number.isRequired,
    })
  ),
  onCostChange: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onTypeChange: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onTypeNameChange: PropTypes.func.isRequired,
  onTypeSave: PropTypes.func.isRequired,
};

module.exports = AddTab;
