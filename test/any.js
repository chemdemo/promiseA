var Promise = require('../lib/Promise');
var comm = require('./common');

var read = comm.read;
var sleep = comm.sleep;
var remove = comm.remove;
var write = comm.write;

// any
Promise.any([read('./nodejs.js'), read(__filename)])
    .then(sleep(1000))
    .then(function(data) {
        return write('./first_readed.js', data);
    }, function(e) {
        console.error('read error', e);
    })
    .then(function(v) {
        console.log('read', v);
    }, function(e) {
        console.error('write error', e);
    });
