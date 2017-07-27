const moment = require('moment');
const React = require('react');
const PropTypes = require('prop-types');

// TODO: expense list should be its own component

class ExpensesTab extends React.Component {
  render() {
    const {
      fromDate,
      toDate,
      expenses,
      onFromDateClick,
      onToDateClick,
      onExpenseClick,
    } = this.props;

    const fromDateLabel = moment(fromDate, 'YYYY-MM-DD').format('D MMM \'YY');
    const toDateLabel = moment(toDate, 'YYYY-MM-DD').format('D MMM \'YY');

    const numberOptions = {
      maximumFractionDigits: 2,
    };

    return (
      <section id="expenses-tab">
        <section className="dates-filter">
          <div className="date date-from" onClick={onFromDateClick}>
            <label>From:</label>
            <span>{fromDateLabel}</span>
          </div>
          <div className="date date-to" onClick={onToDateClick}>
            <label>To:</label>
            <span>{toDateLabel}</span>
          </div>
        </section>

        <section className="expenses-list">
          {expenses.map((expense) => (
            <div className="list-item"
              key={expense._id}
              onClick={onExpenseClick.bind(this, expense)}
            >
              <span>{expense.name}</span>
              <span>{expense.type || '-'}</span>
              <span>{moment(expense.date, 'YYYY-MM-DD').format('D MMM')}</span>
              <span>{expense.cost.toLocaleString(2, numberOptions)}</span>
            </div>
          ))}
        </section>
      </section>
    );
  }
}

ExpensesTab.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      cost: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
    })
  ),
  fromDate: PropTypes.string.isRequired,
  toDate: PropTypes.string.isRequired,
  onFromDateClick: PropTypes.func.isRequired,
  onToDateClick: PropTypes.func.isRequired,
  onExpenseClick: PropTypes.func.isRequired,
};

module.exports = ExpensesTab;
