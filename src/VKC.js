/* eslint-disable no-param-reassign,no-case-declarations */
import connect from '@vkontakte/vk-connect';
import { toAsync, log } from './utils';

// Handlers
import VKWebAppCallAPIMethod from './handlers/VKWebAppCallAPIMethod';
import VKWebAppGetUserInfo from './handlers/VKWebAppGetUserInfo';
import VKWebAppGetAuthToken from './handlers/VKWebAppGetAuthToken';
import VKWebAppGetGeodata from './handlers/VKWebAppGetGeodata';

const handlers = {
    VKWebAppCallAPIMethod,
    VKWebAppGetUserInfo,
    VKWebAppGetAuthToken,
    VKWebAppGetGeodata,
};

// constants
export const API_ADDRESS = 'https://api.vk.com';
export const MODE_DEV = 'DEV';
export const MODE_PROD = 'PROD';
export const MODE_AUTO = 'AUTO';

// options and internal vars
let defaultOptions = {
    corsAddress: 'https://cors-anywhere.herokuapp.com/',
    apiVersion: '5.103',
    accessToken: '',
    appId: 0,
    mode: MODE_AUTO,
    asyncStyle: false,
    enableLog: true,
    defaultScope: '',
};

let accessTokenGot = '';
let initializationFinished = false;

/*
    Check if there is VKConnect presented and set mode to DEV or PROD
 */
function setMode() {
    if (!initializationFinished) {
        if (defaultOptions.mode === MODE_AUTO) {
            // try to init with VKConnect
            if (connect.isWebView() || !defaultOptions.accessToken) {
                connect.send('VKWebAppInit', {});
                defaultOptions.mode = MODE_PROD;
                if (defaultOptions.enableLog) log(`VKC inited in ${MODE_PROD} mode`);
            } else {
                defaultOptions.mode = MODE_DEV;
                if (defaultOptions.enableLog) log(`VKC inited in ${defaultOptions.mode} mode`);
            }
        } else {
            if (defaultOptions.mode === MODE_PROD) {
                // there is probably no answer prom Promise at all
                connect.send('VKWebAppInit', {});
            }
            // force mode by options
            if (defaultOptions.enableLog) log(`VKC inited in ${defaultOptions.mode} mode`);
        }
        initializationFinished = true;
    }
}

/*
    Check if event handler is defined
 */
function supports(event) {
    return !!handlers[event];
}

/*
    Default null value if error is unknown
 */
function nullValue() {
    // async style
    if (defaultOptions.asyncStyle) {
        return [null, null];
    }
    // promise style
    return new Promise((resolve, reject) => {
        reject();
    });
}

/*
    Mock call
 */
function mock(event, params) {
    if (supports(event)) {
        const handler = handlers[event];
        return handler(params, defaultOptions);
    }
    return nullValue();
}

/*
    Send event
 */
async function send(event, params) {
    if (!params) params = {};
    if (!initializationFinished) {
        console.error('You forgot to call VKC.init(...)');
        return nullValue();
    }
    // check some params
    if (event === 'VKWebAppCallAPIMethod') {
        if (!accessTokenGot) {
            if (defaultOptions.defaultScope) {
                // eslint-disable-next-line no-use-before-define
                const authRes = await auth(defaultOptions.defaultScope);
                if (!authRes[0]) {
                    return [null, {
                        type: 'VKWebAppCallAPIMethodFailed',
                        data: 'Auth required',
                    }];
                }
                // because of closure probably
                if (defaultOptions.log) log('Automatic token received');
                accessTokenGot = authRes[0].data.access_token;
                defaultOptions.accessToken = accessTokenGot;
                defaultOptions.appId = params.app_id;
            } else {
                console.error('Please, call API methods only after VKWebAppGetAuthToken or shortcut VKC.auth(scope)');
                return nullValue();
            }
        }
        // fix parameters if needed
        if (!params.params) params.params = {};
        if (!params.params.v) params.params.v = defaultOptions.apiVersion;
        if (!params.params.access_token) params.params.access_token = accessTokenGot;
    }
    if (event === 'VKWebAppGetAuthToken') {
        if (!params.app_id) params.app_id = parseInt(defaultOptions.appId, 10);
        if (!params.app_id) {
            console.error('You forgot app_id parameter in init options or auth call');
            return nullValue();
        }
    }

    let result;
    let caller;
    if (defaultOptions.mode === MODE_DEV) {
        // call mock event instead of VKConnect
        caller = 'Mock';
        result = await toAsync(mock(event, params));
    } else {
        // call VKConnect
        caller = 'VKConnect';
        result = await toAsync(connect.sendPromise(event, params));
    }

    // if it was auth, store token
    if (event === 'VKWebAppGetAuthToken' && result[0] && result[0].data.access_token) {
        accessTokenGot = result[0].data.access_token;
        defaultOptions.accessToken = accessTokenGot;
        defaultOptions.appId = params.app_id;
    }

    // log for dev environment
    if (defaultOptions.enableLog) {
        log(`${caller} call ${result[0] ? 'success' : 'error'}`, event, params, result[0] || result[1]);
    }

    // return async style
    if (defaultOptions.asyncStyle) {
        return result;
    }
    // promise style
    return new Promise((resolve, reject) => {
        if (result[0]) resolve(result[0]);
        else reject(result[1]);
    });
}

function sendPromise(event, params) {
    return send(event, params);
}

/*
    Upload wall photo
*/
async function uploadWallPhoto(file, groupId, caption) {
    const result = [null, null];

    const params = {};
    if (groupId) params.group_id = groupId;
    // eslint-disable-next-line no-use-before-define
    const uploadServer = await api('photos.getWallUploadServer', {});
    const uploadUrl = uploadServer[0] && uploadServer[0].data && uploadServer[0].data.upload_url;
    if (uploadUrl) {
        const photo = file;
        const formData = new FormData();
        formData.append('photo', photo);

        try {
            const response = await fetch(uploadUrl, { method: 'POST', body: formData });
            if (response.ok) {
                const toSave = await response.json();
                if (caption) toSave.caption = caption;
                if (groupId) toSave.group_id = groupId;
                // eslint-disable-next-line no-use-before-define
                const saved = await api('photos.saveWallPhoto', toSave);
                return saved;
            }

            // upload error
            result[1] = await ((response && response.text()) || 'Network error');
        } catch (err) {
            result[1] = err;
        }
    } else {
        // upload server error
        [, result[1]] = uploadServer;
    }

    // return async style
    if (defaultOptions.asyncStyle) {
        return result;
    }
    // promise style
    return new Promise((resolve, reject) => {
        if (result[0]) resolve(result[0]);
        else reject(result[1]);
    });
}

/*
    Shortcut for VKWebAppCallAPIMethod
 */
function api(method, params) {
    return send('VKWebAppCallAPIMethod', { method, params });
}

/*
    Shortcut for VKWebAppAccessToken
 */
function auth(scope) {
    return send('VKWebAppGetAuthToken', { scope });
}

/*
    Init entire module
 */
function init(options) {
    defaultOptions = Object.assign(defaultOptions, options);
    setMode();
}

/*
    Define new event handler
 */
function define(event, handler) {
    handlers[event] = handler;
}

export default {
    send,
    sendPromise,
    init,
    auth,
    api,
    uploadWallPhoto,
    supports,
    define,
};
