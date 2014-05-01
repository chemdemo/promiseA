var fs = require('fs');
var assert = require('assert');

var Promise = require('./simple-promise');

var testFile = __filename;

var read = function(path) {
    var p = new Promise();

    fs.readFile(path || testFile, function(err, data) {
        console.log('read err', err);
        if(err) p.reject(err);
        else p.resolve({path: './test.js', data: data});
    });

    return p;
};

var write = function(o) {
    var p = new Promise();
    // console.log('write id', p.id)

    fs.writeFile(o.path, o.data, function(err) {
        console.log('write err', err);
        if(err) p.reject(err);
        else p.resolve(o.path);
    });

    return p;
};

var delay = function(ms) {
    return function(v) {
        var p = Promise();
        // console.log('delay id', p.id)

        setTimeout(function() {
            console.log('delaied ' + ms + ' ms');
            p.resolve(v);
        }, ms);

        return p;
    };
};

var sync = function() {
    var p = new Promise();

    p.resolve(testFile);

    return p;
};

// sync()
//     .then(read)
read(testFile)
    .then(function(o) {
        assert.equal('./test.js', o.path);
        o.test = 'test';
        console.log('add test prop')
        return o;
    }, function(e) {
        console.log('error...')
        console.error(e);
    })
    .then(delay(1000))
    .then(write)
    .then(delay(2000), function(e) {
        console.error('delay error')
    })
    .then(function(v) {
        var p = Promise();

        fs.unlink(v, function(err) {
            // console.log('remove err', err)
            if(err) p.reject(err);
            else p.resolve('removed');
        });

        return p;
    })
    .then(function(o) {
        console.log('removed');
        assert.equal('removed', o);
    }, function(e) {
        console.error('remove error', e);
    })
    .then(delay(500))
    .then(function() {
        console.log('finish!')
        console.log('memoryUsage', process.memoryUsage().heapUsed);
    });

var sync2 = Promise(function(resolve, reject) {
    setTimeout(function() {
        resolve(testFile);
    }, 1000);
});

var print = function(v) {
    // console.log('print');
    // return v;
    return {
        then: function(cb) {
            setTimeout(function() {
                console.log('print', v);
                cb(v);
            }, 30);
        }
    };
};

console.log('memoryUsage', process.memoryUsage().heapUsed);
sync2.then(print).then(read).then(delay(300)).then(write);
sync2.then(print);
