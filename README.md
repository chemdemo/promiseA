promiseA

A simple Promises/A+ implementation.

## Useage

``` javascript
// useage 1
var read = function(path) {
    var p = Promise();
    
    fs.readFile(path, function(err, data) {
        if(!err) p.resolve(data);
        else p.reject(err);
    });
    
    return p;
};

// useage 2
var write = function(data) {
    return Promise(function(resolve, reject) {
        fs.writeFile('bar.js', function(err) {
            if(!err) resolve();
            else reject(err);
        });
    });
};

// useage 3
var sleep = function(ms) {
    return function(v) {
        var p = Promise();

        setTimeout(function() {
            p.resolve(v);
        }, ms);

        return p;
    };
};

read('foo.js')
    .then(sleep(1000))
    .then(write)
    .then(sleep(1000))
    .then(function() {
        console.log('done!');
    });
```

## API list

### constructor

- `Promise()`

### instance methods

- `then()`

- `resolve()`

- `reject()`

### static methods

- `Promise.resove()`

- `Promise.reject()`

- `Promise.all()`

- `Promise.any()`

## Idea About Promise

[JavaScript Promise](https://github.com/chemdemo/chemdemo.github.io/issues/6)
