/* eslint-disable no-unused-vars */
export default function (params, options) {
    // access token already stored
    return new Promise((resolve, reject) => {
        try {
            const widget = JSON.parse(params.code);
            console.log('Widget approved');
            console.log(widget);
            resolve({
                result: true,
            });
        } catch (err) {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({
                error_type: 'client_error',
                error_data: {
                    err,
                },
            });
        }
    });
}
