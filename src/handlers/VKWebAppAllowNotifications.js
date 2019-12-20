/* eslint-disable no-unused-vars */
export default function (_params, _options) {
    return new Promise((resolve) => {
        if (Notification) {
            if (Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        }
        resolve({
            type: 'VKWebAppAllowNotificationsResult',
            data: {
                result: true,
            },
        });
    });
}
