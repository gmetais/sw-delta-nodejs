## sw-delta-nodejs

**sw-delta-nodejs** is a NodeJS server-side implementation for **sw-delta**.

**sw-delta** is a browser cache - based on a Service Worker - that only loads the delta (=diff) of a file when it's modified.

Please have a look at [the sw-delta repository](https://github.com/gmetais/sw-delta) for more information.


## Usage example with Express

```js
var path        = require('path');
var url         = require('url');
var app         = require('express')();
var compress    = require('compression');
var swDelta     = require('sw-delta-nodejs');

// Don't forget to set gzip compression on your server
app.use(compress());

// This example only handles /assets/scripts/*.js files
app.get('/assets/scripts/:name-:version.js', function(req, res) {
    // Example: "/assets/scripts/main-2.3.5.js?cached=2.3.4"

    // We look at the querystring to determine if it's a request for a delta
    if (req.query.cached) {
        // A querystring such as "?cached=2.3.4" is detected.
        // This was added by the Service Worker, it expects a delta response.

        var askedVersion = req.params.version;
        var cachedVersion = req.query.cached;
        console.log('Asked version: %s - Cached version: %s', askedVersion, cachedVersion);

        // You need to provide the system path of the two files to the sw-delta-nodejs library
        var pathname = url.parse(req.url).pathname;
        var askedFilePath = path.join(__dirname, 'client', pathname);
        var cachedFilePath = path.join(__dirname, 'client', pathname.replace(askedVersion, cachedVersion));

        console.log('askedFilePath: %s', askedFilePath);
        // askedFilePath: /var/www/client/assets/scripts/main-2.3.5.js
        console.log('cachedFilePath: %s', cachedFilePath);
        // cachedFilePath: /var/www/client/assets/scripts/main-2.3.4.js

        // The getDelta method returns a promise
        swDelta.getDelta(askedFilePath, cachedFilePath)

            .then(function(result) {
                res.type(result.contentType);
                res.send(result.body);
            })

            .catch(function(error) {
                console.log('An error occured: %s %s', error.statusCode, error.status);
                res.status(error.statusCode).send(error.status);
            });

    } else {
        // No querystring, it's just a normal request, grab the file and send it...
        res.sendFile(path.join(__dirname, 'client', req.url));
    }
});

// Serve the service worker file. Make sure it's available at the root of your server,
// or at least at the root of the files you want to be controlled by sw-delta.
app.get('/sw-delta.js', function (req, res) {
    res.sendFile(path.resolve(__dirname, 'path-to-the-clientside-sw-delta-file-in-your-file-system/sw-delta-min.js'));
});

app.listen(80, function () {
    console.log('Server is running on port 80');
});
```


## API explanation

### swDelta.getDelta(askedFilePath, cachedFilePath)

The function checks if both files exist and calculates the delta between them. `askedFilePath` and `cachedFilePath` need to be file system paths of the files on your server.

It returns a promise that you need to handle.

```js
swDelta.getDelta(askedFilePath, cachedFilePath)
    .then(successCallback)
    .fail(failureCallback)
```

#### function successCallback(result) {...}

The `result` object contains the `contentType` and the `body` that should be sent to the client, along with a 200 status code.

**Success scenario 1:** the two files were found on the server and a delta file was correctly computed.
```
result = {
    body: '...', // the delta file as a string
    contentType: 'text/sw-delta' // will be understood by the Service Worker as a delta file
}
```

**Success scenario 2:** one of the two files could not be found on the server. The other file is sent.
```
result = {
     body: '...', // the content of the other file as a string
     contentType: 'application/javascript' // the actual mime-type of the file, guessed from extension.
}
```

**Success scenario 3:** the delta was correctly calculated, but there are so many changes between the two files that the weight of the delta file would be bigger than the asked file. The asked file is sent.
```
result = {
     body: '...', // the content of the asked file as a string
     contentType: 'application/javascript' // the actual mime-type of the file, guessed from extension.
}
```


### function failureCallback(error) {...}

The `error` object contains a `statusCode` and a `status`, ready to be sent to the client.

**Failure scenarii:**
- `404 Not found` - none of the two files were found on the server.
- `400 Bad request: missing askedFilePath` - the `askedFilePath` argument is empty.
- `400 Bad request: missing cachedFilePath` - the `cachedFilePath` argument is empty.
- `500 Internal Server Error: reason` - any other failure.



## What's next

This package needs to become more robust! I'm more a frontend developer than a backend developer, so issues and pull-requests are more than welcome.



## Author
Gaël Métais. I'm a webperf freelance. Follow me on Twitter [@gaelmetais](https://twitter.com/gaelmetais), I tweet about Web Performances and Front-end!

I can also help your company implement Service Workers, visit [my website](https://www.gaelmetais.com).