/* eslint-disable no-unused-vars */
export default function (params, options) {
    return new Promise((resolve) => {
        localStorage.setItem(params.key, params.value);
        resolve({
            type: 'VKWebAppStorageSetResult',
            data: {
                result: true,
            },
        });
    });
}
