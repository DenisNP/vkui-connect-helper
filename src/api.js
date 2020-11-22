/* eslint-disable no-param-reassign */
import { MODE_DEV, API_ADDRESS } from './VKC';
/*
    VK API call
 */
export default function (method, parameters, options) {
    // construct string
    let address = `${options.mode === MODE_DEV ? options.corsAddress : ''}${API_ADDRESS}/method/${method}?v=${parameters.v}`;
    if (parameters.access_token) address += `&access_token=${parameters.access_token}`;

    delete parameters.v;
    delete parameters.access_token;

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(parameters),
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
                    return resolve(data);
                }
                // API or parse error
                return reject(data);
            })
            .catch(error => reject(error));
    });
}
