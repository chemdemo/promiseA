// for browser
var getImg = function(url) {
    var p = new Promise();
    var img = new Image();

    img.load = function() {
        p.resolve(this);
    }

    img.onerror = function(err) {
        p.reject(err);
    }

    img.src = url;

    return p;
};

function upload(params) {
    var p = new Promise();
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    fd.append('url', params.url);

    xhr.onload = function() {
        p.resolve(res);
    }

    xhr.onabort = function() {
        p.reject(new Error('abort'));
    };

    xhr.onerror = function() {
        p.reject(new Error('error'));
    };

    xhr.open('POST', params.target);
    xhr.send(fd);

    return p;
};

// getImg('xxx') // => promise1
//     .then(upload) // => promise2
//     .then(function() { // => promise2
//         console.log('done');
//     })
//     .then(function() { // => promise2
//         console.log('balabala...');
//     });
