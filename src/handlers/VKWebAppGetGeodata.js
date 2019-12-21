/* eslint-disable prefer-promise-reject-errors */
function getErrorData(errorCode) {
    switch (errorCode) {
    case errorCode.PERMISSION_DENIED:
        return 'User denied the request for Geolocation.';
    case errorCode.POSITION_UNAVAILABLE:
        return 'Location information is unavailable.';
    case errorCode.TIMEOUT:
        return 'The request to get user location timed out.';
    case errorCode.UNKNOWN_ERROR:
        return 'An unknown error occurred.';
    default:
        return '';
    }
}

export default function () {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        available: 1,
                        lat: position.coords.latitude,
                        long: position.coords.longitude,
                    });
                },
                (error) => {
                    reject({
                        error_type: error.code,
                        error_data: getErrorData(error.code),
                    });
                },
            );
        } else {
            reject({
                error_type: 'Not supported',
                error_data: '',
            });
        }
    });
}
