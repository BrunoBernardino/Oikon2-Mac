const app = require('./init');

describe('Oikon 2', function () {
  beforeEach(function () {
    return app.start();
  });

  afterEach(function () {
    return app.stop();
  });

  it('should open a window', function () {
    return app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1);
  });

  it('should have a proper title set', function () {
    return app.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('Oikon 2');
  });
});
