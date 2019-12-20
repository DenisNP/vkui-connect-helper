/* eslint-disable no-unused-vars */
export default function (params, options) {
    return new Promise((resolve) => {
        window.open(params.link, '_blank');
        resolve({
            type: 'VKWebAppShareResult',
            data: {
                post_id: '0_0',
            },
        });
    });
}
