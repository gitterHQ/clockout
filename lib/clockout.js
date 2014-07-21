"use strict";

function WorkManager() {
  this.queues = {};
}

WorkManager.prototype = Object.create(require('events').EventEmitter.prototype);

WorkManager.prototype.getQueue = function getQueue(queue) {
  var q = this.queues[queue];
  if(!q) {
    q = new WorkQueue(this, queue)
    this.queues[queue] = q;
  }
  return q;
}

WorkManager.prototype.report = function report() {
  return Array.prototype.concat.apply([], Object.keys(this.queues).map(function(queue) {
    return this.queues[queue].report();
  }.bind(this)));
}

function WorkQueue(manager, queue) {
  this.manager = manager;
  this.queue = queue;
  this.data = {};
  this.counter = 0;
}

WorkQueue.prototype.start = function start(meta, timeout) {
  var id = this.counter++;
  var start = Date.now();
  var workItem = new WorkItem(this, id, start, timeout, meta);
  this.data[id] = workItem;

  this.manager.emit('job_started', this.queue, meta, start, timeout);

  return workItem;
}

WorkQueue.prototype.report = function report() {
  return Object.keys(this.data).map(function(id) {
    var item = this.data[id];
    return { id: item.id, start: item.start, timeout: item.timeout, meta: item.meta }
  }.bind(this));
}

function WorkItem(workQueue, id, start, timeout, meta) {
  this.workQueue = workQueue;
  this.id = id;
  this.start = start;
  this.timeout = timeout;
  this.meta = meta;
  this.timer = setTimeout(this.onTimeout.bind(this), timeout);

}

WorkItem.prototype.complete = function complete() {
  var item = this.workQueue.data[this.id];
  if(!item) {
    this.workQueue.manager.emit('job_completed_late', this.workQueue.queue, this.meta, this.start, this.timeout);
    return;
  }

  delete this.workQueue.data[this.id];
  clearTimeout(this.timer);
  this.workQueue.manager.emit('job_completed', this.workQueue.queue, this.meta, this.start, this.timeout);
}

WorkItem.prototype.onTimeout = function timeout() {
  var item = this.workQueue.data[this.id];
  if(!item) return;

  delete this.workQueue.data[this.id];
  this.workQueue.manager.emit('job_timeout', this.queue, this.meta, this.start, this.timeout);
}


module.exports = WorkManager;
