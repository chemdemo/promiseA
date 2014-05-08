var Promise = require('../lib/Promise');
var comm = require('./common');

var read = comm.read;
var sleep = comm.sleep;
var remove = comm.remove;
var write = comm.write;

Promise.all([read('./nodejs.js'), read(__filename)])
    .then(sleep(1000), function(e) {
        console.log('read err', e);
    })
    .then(function(arr) {console.log('buffer arr', arr)
        var buf = Buffer.concat(arr);

        return write('./combined.js', buf);
    }, function(e) {
        console.error('combine error', e);
    })
    .then(function(v) {
        console.log('read', v);
    }, function(e) {
        console.error('write error', e);
    });
