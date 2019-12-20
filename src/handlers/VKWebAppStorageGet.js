/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
export default function (params, options) {
    return new Promise((resolve) => {
        const keys = [];
        for (const key of params.keys) {
            const value = localStorage.getItem(key);
            if (value) {
                keys.push({
                    key,
                    value,
                });
            }
        }

        resolve({
            type: 'VKWebAppStorageGetResult',
            data: {
                keys,
            },
        });
    });
}
