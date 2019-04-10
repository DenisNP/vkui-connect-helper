/* eslint-disable no-param-reassign */
import { stringifyParams } from './utils';
import { MODE_DEV, API_ADDRESS } from './VKC';
/*
    VK API call
 */
export default function (method, parameters, options) {
    // construct string
    const paramsString = stringifyParams(parameters);
    const address = `${options.mode === MODE_DEV ? options.corsAddress : ''}${API_ADDRESS}/method/${method}${paramsString}`;
    // request options // TODO POST
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };
    // construct promise
    return new Promise((resolve, reject) => {
        fetch(address, requestOptions)
            .then(async (response) => {
                const text = await response.text();
                // try parse result if JSON
                const data = text && JSON.parse(text);
                if (!response.ok) {
                    // Web error
                    const error = data || response.statusText;
                    return reject(error);
                }
                if (data.response) {
                    // Result OK
                    return resolve(data.response);
                }
                // API or parse error
                return reject(data);
            })
            .catch(error => reject(error));
    });
}
