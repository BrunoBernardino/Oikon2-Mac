const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

const appPath = path.join(__dirname, '..');

const app = new Application({
  path: electronPath,
  args: [appPath],
});

global.before(function () {
  chai.should();
  chai.use(chaiAsPromised);
});

module.exports = app;
