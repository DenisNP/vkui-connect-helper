/* eslint-disable no-param-reassign,no-case-declarations */
import connect from '@vkontakte/vkui-connect-promise';
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
    apiVersion: '5.95',
    accessToken: '',
    appId: 0,
    mode: MODE_AUTO,
    asyncStyle: false,
    enableLog: true,
    initWaitTime: 1000,
};

let accessTokenGot = '';
let timeout = -1;
let initializationInProgress = false;
let initializationStarted = false;
let initializationFinished = false;

/*
    Wait for init process ready
 */
function initWait(resolve) {
    if (initializationFinished) {
        resolve([{}, null]);
    } else {
        setTimeout(() => {
            initWait(resolve);
        }, 100);
    }
}

/*
    Check if there is VKConnect presented and set mode to DEV or PROD
 */
function setMode() {
    return new Promise((resolve) => {
        if (initializationFinished) {
            // if mode already assigned just continue
            resolve([{}, null]);
        } else if (initializationInProgress) {
            // initialization process already run, wait for its finish
            initWait(resolve);
        } else {
            initializationInProgress = true;
            // try to init with VKConnect
            connect.send('VKWebAppInit', {}).then((data) => {
                if (initializationFinished) {
                    console.warn('Too long initialization, please, control mode and initWaitTime options');
                }
                defaultOptions.mode = MODE_PROD;
                initializationFinished = true;
                if (defaultOptions.enableLog) log(`VKC inited in ${MODE_PROD} mode`);
                clearTimeout(timeout);
                resolve([data, null]);
            }).catch((error) => {
                // if it was inited with error mode is still PROD because VKConnect works
                if (initializationFinished) {
                    console.warn('Too long initialization, please, control mode and initWaitTime options');
                }
                defaultOptions.mode = MODE_PROD;
                initializationFinished = true;
                if (defaultOptions.enableLog) log(`VKC inited in ${MODE_PROD} mode`);
                clearTimeout(timeout);
                resolve([null, error]);
            });
            // if it will not inited in 100ms, change mode
            timeout = setTimeout(() => {
                defaultOptions.mode = MODE_DEV;
                initializationFinished = true;
                if (defaultOptions.enableLog) log(`VKC inited in ${MODE_DEV} mode`);
                resolve([{}, null]);
            }, defaultOptions.initWaitTime);
        }
    });
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
    if (!initializationStarted) {
        console.error('You forgot to call VKC.init(...)');
        return nullValue();
    }
    if (!initializationFinished) await setMode(); // wait for initialization finish
    // check some params
    if (event === 'VKWebAppCallAPIMethod') {
        if (!accessTokenGot) {
            console.error('Please, call API methods only after VKWebAppGetAuthToken or shortcut VKC.auth(scope)');
            return nullValue();
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
        result = await toAsync(connect.send(event, params));
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
    initializationStarted = true;
    return setMode(true);
}

/*
    Define new event handler
 */
function define(event, handler) {
    handlers[event] = handler;
}

export default {
    send,
    init,
    auth,
    api,
    supports,
    define,
};
