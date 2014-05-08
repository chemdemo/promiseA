var fs = require('fs');

var Promise = require('../lib/Promise');

var sleep = function(ms) {
    return function(v) {
        console.log('sleep %d ms.', ms);
        var p = Promise();

        setTimeout(function() {
            p.resolve(v);
        }, ms);

        return p;
    };
};

var remove = function(_p) {
    return Promise(function(resolve, reject) {
        fs.unlink(_p, function(err) {
            if(!err) resolve('removed');
            else reject(err);
        });
    });
};

var read = function(_p) {
    console.log('start read at', new Date());
    return Promise(function(resolve, reject) {
        fs.readFile(_p, function(err, data) {
            if(!err) {
                setTimeout(function() {
                    console.log('read %s ok.', _p);
                    resolve(data);
                }, 1000);
            } else {
                reject(err);
            }
        });
    });
};

var write = function(_p, data) {
    console.log('start write at', new Date());
    var p = Promise();

    fs.writeFile(_p, data, function(err) {
        if(!err) {
            setTimeout(function() {
                p.resolve('done');
                console.log('write ok.');
            }, 1000);
        } else {
            p.reject(err);
        }
    });

    return p;
};

exports.read = read;
exports.write = write;
exports.sleep = sleep;
exports.remove = remove;
