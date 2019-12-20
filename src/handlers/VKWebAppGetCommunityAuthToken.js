export default function (params, options) {
    // access token already stored
    return new Promise((resolve) => {
        resolve({
            type: 'VKWebAppCommunityAccessTokenResult',
            data: {
                access_token: options.communityToken,
            },
        });
    });
}
