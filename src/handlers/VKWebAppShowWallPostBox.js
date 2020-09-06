/* eslint-disable prefer-promise-reject-errors */
import api from '../api';

export default function (params, options) {
    return new Promise((resolve, reject) => {
        const requestData = {
            ...params,
            v: options.apiVersion,
            access_token: options.accessToken,
        };

        api('wall.post', requestData, options)
            .then(data => resolve(data.response))
            .catch(error => reject(error));
    });
}
