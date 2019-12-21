/* eslint-disable no-unused-vars */
export default function (params, options) {
    return new Promise((resolve) => {
        window.open(params.link, '_blank');
        resolve({
            post_id: '0_0',
        });
    });
}
