const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const _ = require('lodash');
const moment = require('moment');

const EXPENSES_URI = 'expenses';
const TYPES_URI = 'types';

const genericErrorHandler = (error) => {
  console.error(error);
};

// Add .find plugin
PouchDB.plugin(PouchDBFind);

const DataDBInit = (localDBPath) => {

  const DataDB = {
    init(remoteHost) {
      this.expensesDB = new PouchDB(`${localDBPath}/${EXPENSES_URI}`);
      this.typesDB = new PouchDB(`${localDBPath}/${TYPES_URI}`);

      // Add indexes
      this.expensesDB.createIndex({
        index: {
          fields: ['name', 'date'],
        },
      });
      this.expensesDB.createIndex({
        index: {
          fields: ['type'],
        },
      });
      this.typesDB.createIndex({
        index: {
          fields: ['name'],
        },
      });

      // Sync w/ Remote if any
      if (remoteHost) {
        const syncOptions = {
          live: true,
          retry: true,
        };

        PouchDB.sync(`${localDBPath}/${EXPENSES_URI}`, `${remoteHost}/${EXPENSES_URI}`, syncOptions);
        PouchDB.sync(`${localDBPath}/${TYPES_URI}`, `${remoteHost}/${TYPES_URI}`, syncOptions);
      }
    },

    chooseDB(type) {
      if (type === 'expense' || type === 'expenses') {
        return this.expensesDB;
      }

      return this.typesDB;
    },

    // Get all data rows
    // TODO: Filter?
    get(type, callback) {
      return this.chooseDB(type)
        .allDocs({
          include_docs: true,
          limit: null
        })
        .then((result) => {
          const rows = result.rows
            .filter((row) => (row.id.indexOf('_design/') === -1)) // strip "indexes"
            .map((row) => row.doc); // get the details/doc

          callback(rows);
        })
        .catch(genericErrorHandler);
    },

    // Gets the last found expense type for a given expense name
    async getLastTypeForExpense(expenseName) {
      return this.expensesDB
        .find({
          selector: {
            name: expenseName,
            /*date: {
              '$gt': null,
              // '$exists': true,
            },*/ // https://github.com/pouchdb/pouchdb/issues/6337
          },
          fields: ['type'],
          /*sort: [{
            date: 'desc',
          }],*/
          limit: 1,
        })
        .then((result) => {
          const rows = result.docs;

          if (rows.length > 0) {
            return rows[0].type;
          }

          // Default "uncategorized"
          return '';
        })
        .catch(genericErrorHandler);
    },

    // Add a new row
    async add(type, data) {
      await this.validate(type, data);

      // If adding a type, confirm the name is unique
      if (type === 'type' || type === 'types') {
        const exists = await this.typeExists(data.name);
        if (exists) {
          throw Error(`An expense type named "${data.name}" already exists.`);
        }
      }

      return this.chooseDB(type)
        .post(data)
        .catch(genericErrorHandler);
    },

    // Update a row
    async update(type, data) {
      await this.validate(type, data);

      return this.chooseDB(type)
        .put(data)
        .catch(genericErrorHandler);
    },

    // Delete a row
    async delete(type, data) {
      // If deleting an expense type, update the expenses
      if (type === 'type' || type === 'types') {
        await this.removeTypeFromExpenses(data.name);
      }

      return this.chooseDB(type)
        .remove(data)
        .catch(genericErrorHandler);
    },

    // Delete the dbs
    async deleteDB() {
      try {
        await this.expensesDB.destroy();
        await this.typesDB.destroy();
      } catch (e) {
        return genericErrorHandler(e);
      }

      return false;
    },

    // Send a callback to act on when something changes
    subscribe(type, callback) {
      this.chooseDB(type)
        .changes({
          since: 'now',
          live: true
        })
        .on('change', callback)
        .catch(genericErrorHandler);
    },

    // Potentially Parse data
    async potentiallyParse(type, data) {
      // Expenses
      if (type === 'expense' || type === 'expenses') {
        // Trim name
        data.name = data.name.trim();

        // Convert cost to number
        if (typeof data.cost !== 'number') {
          // Parse comma into dot
          data.cost = data.cost.replace(',', '.');

          data.cost = parseFloat(data.cost);
        }

        // If no date, make it today
        if (!data.date) {
          data.date = moment().format('YYYY-MM-DD');
        }

        // Convert date to string
        if (typeof data.date !== 'string') {
          data.date = moment(data.date).format('YYYY-MM-DD');
        }

        // Convert empty or '(auto)' to an automatic type
        if (!data.type || data.type === '(auto)') {
          try {
            data.type = await this.getLastTypeForExpense(data.name) || '';
          } catch (e) {
            data.type = '';
          }

          return Promise.resolve();
        }

        // Convert 'uncategorized' to empty string
        if (data.type === 'uncategorized') {
          data.type = '';
        }

      }

      // Expense Types
      if (type === 'type' || type === 'types') {
        // Trim name
        data.name = data.name.trim();
      }

      return Promise.resolve();
    },

    // Validate data
    async validate(type, data) {
      // Common
      if (_.isEmpty(data)) {
        throw Error('No data received.');
      }

      await this.potentiallyParse(type, data);

      // Expenses
      if (type === 'expense' || type === 'expenses') {
        // We need a name
        if (!data.name || !data.name.trim()) {
          throw Error('Expenses need a name.');
        }

        // We need a cost
        if (!_.isNumber(data.cost) || isNaN(data.cost) || data.cost === 0) {
          throw Error('Expenses need a cost.');
        }

        // We need a date
        if (!data.date) {
          throw Error('Expenses need a date.');
        }

      }

      // Expense Types
      if (type === 'type' || type === 'types') {
        // We need a name
        if (!data.name || !data.name.trim()) {
          throw Error('Expense Types need a name.');
        }

        // Prevent reserved words
        if (data.name === 'uncategorized' || data.name === '(auto)') {
          throw Error('Expense Types cannot be named "uncategorized" nor "(auto)".');
        }
      }
    },

    async removeTypeFromExpenses(typeName) {
      try {
        const result = await this.expensesDB.find({
          selector: {
            type: typeName,
          },
          limit: null,
        });

        const rows = result.docs;

        if (rows.length === 0) {
          return false;
        }

        let row = rows.shift();

        while (row) {
          row.type = 'uncategorized'; // auto-parsing will make it ''
          await this.update('expense', row);
          row = rows.shift();
        }

        return true;
      } catch (e) {
        return false;
      }
    },

    // Check if an expense type exists, by a given name
    async typeExists(typeName) {
      try {
        const result = await this.typesDB.find({
          selector: {
            name: typeName,
          },
          limit: 1,
        });

        const rows = result.docs;

        if (rows.length > 0) {
          return true;
        }

        return false;
      } catch (e) {
        return false;
      }
    },
  };

  return DataDB;
};

module.exports = DataDBInit;
