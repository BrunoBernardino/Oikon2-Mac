const React = require('react');
const PropTypes = require('prop-types');

// TODO: type list should be its own component

class TypesTab extends React.Component {
  render() {
    const {
      types,
      visibleTypes,
      search,
      total,
      onSearchChange,
      onTypeClick,
      onToggleVisibleType,
    } = this.props;

    const numberOptions = {
      maximumFractionDigits: 2,
    };

    const formattedTotal = total.toLocaleString(2, numberOptions);

    return (
      <section id="stats-tab">
        <input name="search" type="text" placeholder="Search" value={search} onChange={onSearchChange} />
        <h5>Total</h5>
        <h2>{formattedTotal}</h2>

        <section className="types-list">
        {types.map((type) => (
          <div className="list-item"
            key={type._id}
          >
            <span onClick={onTypeClick.bind(this, type)}>{type.name}</span>
            <span onClick={onTypeClick.bind(this, type)}>{type.cost.toLocaleString(2, numberOptions)}</span>
            <span><input type="checkbox" onChange={onToggleVisibleType.bind(this, type.name)} checked={(visibleTypes.indexOf(type.name) !== -1 || (visibleTypes.indexOf('') !== -1 && type.name === 'uncategorized'))} /></span>
          </div>
        ))}
        </section>
      </section>
    );
  }
}

TypesTab.propTypes = {
  types: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      cost: PropTypes.number.isRequired,
    })
  ),
  visibleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  search: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onTypeClick: PropTypes.func.isRequired,
  onToggleVisibleType: PropTypes.func.isRequired,
};

module.exports = TypesTab;
