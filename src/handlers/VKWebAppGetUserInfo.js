/* eslint-disable prefer-promise-reject-errors */
import api from '../api';

export default function (params, options) {
    return new Promise((resolve, reject) => {
        const requestData = {
            fields: 'photo_200, photo_100, bdate, sex, city, country',
            v: options.apiVersion,
            access_token: options.accessToken,
        };

        api('users.get', requestData, options)
            .then(data => resolve(data.response[0]))
            .catch(error => reject(error));
    });
}
