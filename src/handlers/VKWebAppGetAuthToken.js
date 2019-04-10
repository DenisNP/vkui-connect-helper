export default function (params, options) {
    // access token already stored
    return new Promise((resolve) => {
        resolve({
            type: 'VKWebAppAccessTokenReceived',
            data: {
                access_token: options.accessToken,
                scope: params.scope,
            },
        });
    });
}
