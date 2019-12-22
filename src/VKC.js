/* eslint-disable no-param-reassign,no-case-declarations */
import connect from '@vkontakte/vk-connect';
import { toAsync, log } from './utils';

// Handlers
import VKWebAppCallAPIMethod from './handlers/VKWebAppCallAPIMethod';
import VKWebAppGetUserInfo from './handlers/VKWebAppGetUserInfo';
import VKWebAppGetAuthToken from './handlers/VKWebAppGetAuthToken';
import VKWebAppGetGeodata from './handlers/VKWebAppGetGeodata';
import VKWebAppCopyText from './handlers/VKWebAppCopyText';
import VKWebAppShowWallPostBox from './handlers/VKWebAppShowWallPostBox';
import VKWebAppShare from './handlers/VKWebAppShare';
import VKWebAppGetCommunityAuthToken from './handlers/VKWebAppGetCommunityAuthToken';
import VKWebAppShowCommunityWidgetPreviewBox from './handlers/VKWebAppShowCommunityWidgetPreviewBox';
import VKWebAppAllowNotifications from './handlers/VKWebAppAllowNotifications';
import VKWebAppStorageGet from './handlers/VKWebAppStorageGet';
import VKWebAppStorageGetKeys from './handlers/VKWebAppStorageGetKeys';
import VKWebAppStorageSet from './handlers/VKWebAppStorageSet';
import VKWebAppAddToCommunity from './handlers/VKWebAppAddToCommunity';
import VKWebAppSetLocation from './handlers/VKWebAppSetLocation';

const handlers = {
    VKWebAppCallAPIMethod,
    VKWebAppGetUserInfo,
    VKWebAppGetAuthToken,
    VKWebAppGetGeodata,
    VKWebAppCopyText,
    VKWebAppShowWallPostBox,
    VKWebAppShare,
    VKWebAppGetCommunityAuthToken,
    VKWebAppShowCommunityWidgetPreviewBox,
    VKWebAppAllowNotifications,
    VKWebAppStorageGet,
    VKWebAppStorageGetKeys,
    VKWebAppStorageSet,
    VKWebAppAddToCommunity,
    VKWebAppSetLocation,
};

// constants
export const API_ADDRESS = 'https://api.vk.com';
export const MODE_DEV = 'DEV';
export const MODE_PROD = 'PROD';
export const MODE_AUTO = 'AUTO';
export const SCOPE_EMPTY = 'empty';

// options and internal vars
let defaultOptions = {
    corsAddress: 'https://cors-anywhere.herokuapp.com/',
    apiVersion: '5.103',
    accessToken: '',
    communityToken: '',
    appId: 0,
    mode: MODE_AUTO,
    asyncStyle: false,
    enableLog: true,
    defaultScope: '',
    disableAutoTheme: false,
    uploadProxy: '',
};

let accessTokenGot = '';
let currentScope = '';
let currentScheme = 'client_light';
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

        // auto change theme
        if (defaultOptions.mode === MODE_PROD && !defaultOptions.disableAutoTheme) {
            connect.subscribe((e) => {
                if (e.detail.type === 'VKWebAppUpdateConfig') {
                    const schemeAttribute = document.createAttribute('scheme');
                    currentScheme = e.detail.data.scheme || 'client_light';
                    schemeAttribute.value = currentScheme;
                    document.body.attributes.setNamedItem(schemeAttribute);
                }
            });
        }

        if (defaultOptions.mode === MODE_DEV) {
            currentScope = '*'; // set scope to anything because it is dev token
        }
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

function addScope(scope) {
    const s = scope === '' ? SCOPE_EMPTY : scope;
    if (currentScope.indexOf(s) >= 0) return;

    if (currentScope !== '') {
        currentScope += ',';
    }
    currentScope += scope;
}

/*
    Auto auth
*/
async function autoAuth(scope, addToScopes) {
    let result = [null, null];
    if (defaultOptions.asyncStyle) {
        // eslint-disable-next-line no-use-before-define
        result = await auth(scope);
    } else {
        // eslint-disable-next-line no-use-before-define
        result = await toAsync(auth(scope));
    }

    if (result[0]) {
        if (addToScopes) {
            addScope(result[0].scope);
        }
        accessTokenGot = result[0].access_token;
        defaultOptions.accessToken = accessTokenGot;
        return null;
    }

    // error
    if (defaultOptions.asyncStyle) {
        return [null, result[1]];
    }
    // promise style
    return new Promise((resolve, reject) => {
        reject(result[1]);
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
    if (defaultOptions.enableLog) {
        console.log(['...', event, params, accessTokenGot, currentScope]);
    }
    if (!params) params = {};
    if (!initializationFinished) {
        console.error('You forgot to call VKC.init(...)');
        return nullValue();
    }
    // check some params
    if (event === 'VKWebAppCallAPIMethod') {
        if (!accessTokenGot || (params.needScope && currentScope.indexOf(params.needScope) < 0)) {
            if (defaultOptions.defaultScope) {
                const authRes = await autoAuth(defaultOptions.defaultScope);
                if (authRes) {
                    return authRes;
                }
            } else if (params.needScope) {
                if (currentScope !== '*' && currentScope.indexOf(params.needScope) < 0) {
                    const authRes = await autoAuth(params.needScope, true);
                    if (authRes) {
                        return authRes;
                    }
                }
                delete params.needScope;
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
    if (event === 'VKWebAppGetAuthToken' || event === 'VKWebAppGetCommunityAuthToken') {
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
    if (event === 'VKWebAppGetAuthToken' && result[0] && result[0].access_token) {
        if (!accessTokenGot) {
            addScope(SCOPE_EMPTY);
        }
        accessTokenGot = result[0].access_token;
        defaultOptions.accessToken = accessTokenGot;
        defaultOptions.appId = params.app_id;
        addScope(result[0].scope);
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
async function uploadWallPhoto(file, groupId, caption, requestAuthWithScope) {
    const result = [null, null];

    const params = {};
    if (groupId) params.group_id = groupId;
    // eslint-disable-next-line no-use-before-define
    const uploadServer = await api('photos.getWallUploadServer', params, requestAuthWithScope);
    const uploadUrl = uploadServer[0]
        && uploadServer[0]
        && uploadServer[0].response.upload_url;

    if (uploadUrl) {
        const photo = file;
        const formData = new FormData();
        formData.append('photo', photo, 'image.jpg');

        try {
            let response;
            if (defaultOptions.uploadProxy) {
                response = await fetch(`${defaultOptions.uploadProxy}?server=${encodeURIComponent(uploadUrl)}`, {
                    method: 'POST',
                    body: formData,
                });
            } else {
                response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                });
            }
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
function api(method, params, needScope) {
    return send('VKWebAppCallAPIMethod', { method, params, needScope });
}

/*
    Shortcut for VKWebAppAccessToken
 */
function auth(scope) {
    return send('VKWebAppGetAuthToken', { scope: (scope === SCOPE_EMPTY ? '' : scope) });
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

/*
    Get scheme
*/
function scheme() {
    return currentScheme;
}

/*
    Is dark scheme
*/
function isDark() {
    return currentScheme.indexOf('_light') < 0;
}

/*
    return current mode
*/
function mode() {
    return defaultOptions.mode;
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
    scheme,
    isDark,
    mode,
};
