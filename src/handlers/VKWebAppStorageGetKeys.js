/* eslint-disable no-unused-vars */
export default function (params, options) {
    return new Promise((resolve) => {
        const start = params.offset || 0;
        const end = Math.min(localStorage.length, start + (params.count || localStorage.length));
        const keys = [];
        for (let i = start; i < end; i++) {
            keys.add(localStorage.key(i));
        }

        resolve({
            type: 'VKWebAppStorageGetKeysResult',
            data: {
                keys,
            },
        });
    });
}
