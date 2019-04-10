/*
    Function converts Promise-style call to async/await with [data, err] result
 */
export function toAsync(promise) {
    return promise.then(data => [data, null])
        .catch(err => [null, err]);
}

/*
    Stringify parameters to GET url string
 */
export function stringifyParams(params) {
    const paramsKeys = Object.keys(params);
    return paramsKeys.length > 0
        ? `?${paramsKeys.map(key => `${key}=${params[key]}`).join('&')}`
        : '';
}

export function log(...args) {
    if (console) {
        console.log(...args);
    }
}
