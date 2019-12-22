// eslint-disable-next-line no-unused-vars
export default function (params, options) {
    return new Promise((resolve) => {
        window.location.hash = params.location;
        resolve({});
    });
}
