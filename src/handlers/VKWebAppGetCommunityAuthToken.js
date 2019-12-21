export default function (params, options) {
    // access token already stored
    return new Promise((resolve) => {
        resolve({
            access_token: options.communityToken,
        });
    });
}
