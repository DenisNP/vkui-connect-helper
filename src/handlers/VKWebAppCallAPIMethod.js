/* eslint-disable prefer-promise-reject-errors */
import api from '../api';

export default function (params, options) {
    return new Promise((resolve, reject) => {
        api(params.method, params.params, options)
            .then(data => resolve(data))
            .catch(error => reject(error));
    });
}
