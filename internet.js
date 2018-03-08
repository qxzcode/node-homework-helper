exports.get = function(url, headers) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url
        const lib = url.startsWith('https')? require('https') : require('http');
        const options = makeOptions(url, headers);
        const request = lib.get(options, (response) => {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err))
    })
};

function makeOptions(url, headers) {
    const hostStart = url.indexOf("//") + 2;
    const pathStart = url.indexOf("/", hostStart);
    
    const host = url.slice(hostStart, pathStart);
    const path = url.slice(pathStart);
    return {host, path, headers};
}