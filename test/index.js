const app = require('./init');

describe('Oikon 2', function () {
  beforeEach(function () {
    return app.start();
  });

  afterEach(function () {
    return app.stop();
  });

  it('should open a window', function () {
    app.client.waitUntilWindowLoaded().getWindowCount().should.eventually.equal(1);
    app.client.browserWindow.isMinimized().should.eventually.be.false;
    app.client.browserWindow.isDevToolsOpened().should.eventually.be.false;
    app.client.browserWindow.isVisible().should.eventually.be.true;
    app.client.browserWindow.isFocused().should.eventually.be.true;
    app.client.browserWindow.getBounds().should.eventually.have.property('width').and.be.above(10);
    return app.client.browserWindow.getBounds().should.eventually.have.property('height').and.be.above(10);
  });

  it('should have a proper title set', function () {
    return app.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('Oikon 2');
  });
});
