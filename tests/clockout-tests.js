var WorkManager = require('..')
var sinon = require('sinon');
var assert = require('assert');

describe("current-workload", function() {

  beforeEach(function () { clock = sinon.useFakeTimers(); });
  afterEach(function () { clock.restore(); });

  it('should track tasks', function() {
    var wm = new WorkManager();
    var startEvent = sinon.spy();
    var completedEvent = sinon.spy();
    wm.on('job_started', startEvent);
    wm.on('job_completed', completedEvent);


    var webQueue = wm.getQueue('web');

    var report = wm.report();
    assert.equal(report.length, 0);

    var item = webQueue.start({ bob: 1 }, 200);

    report = wm.report();
    assert.equal(report.length, 1);
    assert.strictEqual(report[0].id, 0);
    assert.strictEqual(report[0].start, 0);
    assert.strictEqual(report[0].timeout, 200);
    assert.deepEqual(report[0].meta, { bob: 1 });

    assert(startEvent.calledOnce);
    assert(completedEvent.notCalled);

    startEvent.reset();

    item.complete();

    report = wm.report();
    assert.equal(report.length, 0);

    assert(startEvent.notCalled);
    assert(completedEvent.calledOnce);
  });


  it('should deal with timeouts', function() {
    var wm = new WorkManager();
    var startEvent = sinon.spy();
    var completedEvent = sinon.spy();
    var timeoutEvent = sinon.spy();

    wm.on('job_started', startEvent);
    wm.on('job_completed', completedEvent);
    wm.on('job_timeout', timeoutEvent);

    var webQueue = wm.getQueue('web');

    var report = wm.report();
    assert.equal(report.length, 0);

    var item = webQueue.start({ bob: 1 }, 200);

    report = wm.report();
    assert.equal(report.length, 1);
    assert.strictEqual(report[0].id, 0);
    assert.strictEqual(report[0].start, 0);
    assert.strictEqual(report[0].timeout, 200);
    assert.deepEqual(report[0].meta, { bob: 1 });

    assert(startEvent.calledOnce);
    assert(completedEvent.notCalled);
    assert(timeoutEvent.notCalled);

    startEvent.reset();

    clock.tick(201);

    report = wm.report();
    assert.equal(report.length, 0);

    assert(startEvent.notCalled);
    assert(completedEvent.notCalled);
    assert(timeoutEvent.calledOnce);
  });

  it('should deal with late completions', function() {
    var wm = new WorkManager();
    var startEvent = sinon.spy();
    var completedEvent = sinon.spy();
    var timeoutEvent = sinon.spy();
    var completedLateEvent = sinon.spy();

    wm.on('job_started', startEvent);
    wm.on('job_completed', completedEvent);
    wm.on('job_timeout', timeoutEvent);
    wm.on('job_completed_late', completedLateEvent);

    var webQueue = wm.getQueue('web');

    var report = wm.report();
    assert.equal(report.length, 0);

    var item = webQueue.start({ bob: 1 }, 200);

    report = wm.report();
    assert.equal(report.length, 1);
    assert.strictEqual(report[0].id, 0);
    assert.strictEqual(report[0].start, 0);
    assert.strictEqual(report[0].timeout, 200);
    assert.deepEqual(report[0].meta, { bob: 1 });

    assert(startEvent.calledOnce);
    assert(completedEvent.notCalled);
    assert(timeoutEvent.notCalled);
    assert(completedLateEvent.notCalled);

    startEvent.reset();

    clock.tick(201);

    report = wm.report();
    assert.equal(report.length, 0);

    assert(startEvent.notCalled);
    assert(completedEvent.notCalled);
    assert(timeoutEvent.calledOnce);
    assert(completedLateEvent.notCalled);

    timeoutEvent.reset();
    item.complete();


    assert(startEvent.notCalled);
    assert(completedEvent.notCalled);
    assert(timeoutEvent.notCalled);
    assert(completedLateEvent.calledOnce);

  });

})
