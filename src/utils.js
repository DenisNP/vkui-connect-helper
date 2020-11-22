/*
    Function converts Promise-style call to async/await with [data, err] result
 */
export function toAsync(promise) {
    return promise.then(data => [data, null])
        .catch(err => [null, err]);
}

export function log(...args) {
    if (console) {
        console.log(...args);
    }
}
