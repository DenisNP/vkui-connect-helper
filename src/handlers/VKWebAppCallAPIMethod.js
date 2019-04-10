/* eslint-disable prefer-promise-reject-errors */
import api from '../api';

export default function (params, options) {
    return new Promise((resolve, reject) => {
        api(params.method, params.params, options)
            .then(data => resolve({
                type: 'VKWebAppCallAPIMethodResult',
                data,
            }))
            .catch(error => reject({
                type: 'VKWebAppCallAPIMethodFailed',
                data: error,
            }));
    });
}
