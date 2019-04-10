# vkui-connect-helper

[![npm version](https://img.shields.io/npm/v/@denisnp/vkui-connect-helper.svg)](https://www.npmjs.com/package/@denisnp/vkui-connect-helper)

## Описание
Библиотека-обёртка вокруг [vkui-connect-promise](https://github.com/VKCOM/vkui-connect-promise), которая при недоступности модуля [VKUI Connect](https://github.com/VKCOM/vkui-connect) будет выполнять все те же самые вызовы иными способами.

Таким образом, разработчик практически на живых данных без необходимости создавать объекты-пустышки получает возможность отладки прямо в окне браузера за пределами сайта VK.
1. Не отвлекают уведомления и интерфейс сайта
2. Возможность использовать **hot reload**
3. Возможность использовать имитацию мобильного интерфейса в **Chrome DevTools**
4. Нет лишних вызовов в **Network**, относящихся к ВКонтакте, а не к вашему приложению
5. Возможность использовать расширения для разработки, такие как **Vue DevTools**

## Установка и подключение
```bash
npm install --save @denisnp/vkui-connect-helper
```

```js
import VKC from '@denisnp/vkui-connect-helper';
```

## Инициализация
```js
VKC.init(options); // эта фукнция автоматически вызывает VKWebAppInit
```
### options
Поле | Тип | Описание | Обязательное ли | По-умолачнию
-- | -- | -- | -- | --
`appId` | _string_ или _int_ | Идентификатор приложения VK Apps. Сюда **не нужно** вводить id Standalone-приложения, в котором вы получили токен. | **да** | `0`
`accessToken` | _string_ | Токен разработчика для вызова методов, полученный с помощью **Standalone API**, см. ниже подробнее. | **да** для работы с `GetUserInfo` и `CallAPIMethod` | `empty string`
`mode` | _MODE_PROD, MODE_AUTO, MODE_DEV_ | Режим работы библиотеки, смотрите ниже в примере инициализации. **Не используйте в продакшене режим AUTO!** | нет | `MODE_AUTO`
`initWaitTime` | _int_ | Время ожидания инициализации в миллисекундах. Если сервер не вернул ответ на `VKWebAppInit` в заданный срок, то считается, что VKConnect отсутствует. | нет | `1000`
`apiVersion` | _string_ | Версия API ВКонтакте для передачи в вызовы методов. | нет | `5.92`
`enableLog` | _boolean_ | Вести ли лог вызовов к VKConnect в консоли. | нет | `true`
`corsAddress` | _string_ | Адрес сервера для обхода `CORS` к api.vk.com, см. ниже подробнее. | нет | [https://cors-anywhere.herokuapp.com/](https://github.com/marcus2vinicius/cors-anywhere)
`asyncStyle` | _boolean_ | Использовать ли специальный синтаксис для получения ошибок в режиме `async/await`, см. подробнее ниже. | нет | `false`

### Пример инициализации
```js
import VKC from '@denisnp/vkui-connect-helper';
import { MODE_PROD, MODE_AUTO } from '@denisnp/vkui-connect-helper';

VKC.init({
  appId: 123456,
  accessToken: 'sDdbad3qddba3d38d9......', // инструкция по получению такого ключа ниже
  mode: process.env.NODE_ENV !== 'production' ? MODE_AUTO : MODE_PROD, // ставим для разработки автоопределение режима
  initWaitTime: 1500, // если у нас не самое быстрое соединение и нужно тестировать в том числе режим VKConnect на сайте
  corsAddress: 'https://my-own-server.ru/cors/', // https://github.com/marcus2vinicius/cors-anywhere
  asyncStyle: true, // см ниже
}); 
```

## Работа с библиотекой
### Promise-режим
Библиотека повторяет интерфейс [vkui-connect-promise](https://github.com/VKCOM/vkui-connect-promise). То есть в обычном режиме можно вызвать в любом месте функцию `VKC.send(event, params)` и получить в ответ `Promise`. Например:
```js
VKC.send('VKWebAppGetUserInfo', {})
  .then((userData) => {
    // делаем что нужно с данными пользователя
    // userData = { type: 'VKWebAppGetUserInfoResult', data: { first_name: ..., last_name: ..., ...} }
  })
  .catch((error) => {
    // произошла ошибка при вызове события
    // error = { type: 'VKWebAppGetUserInfoFailed', data: {...some error data...} }
  });
```

### Async-режим
Мы всегда можем использовать синтаксис `async/await` для получения результата, но в такой ситуации для поимки ошибки нам придётся оборачивать код в `try/catch` блок. Чтобы избежать этого, в функцию `VKC.init()` можно передать параметр `asyncMode: true`. Тогда результат работы методов будет такой:
```js
VKC.init({
  ...
  asyncStyle: true,
}); 

// some async block
const [data, error] = await VKC.send('VKWebAppCallAPIMethod', { method: 'friends.get' });

if (data) {
  // в объекте data всегда успешный ответ от метода
  // при этом error = null
} else {
  // если data = null, значит произошла ошибка, можно её вывести
  console.log(error);
}
```

### Вызов методов API
События `VKWebAppGetUserInfo` и `VKWebAppCallAPIMethod` в отсутствии **VKConnect** производят запрос к `https://api.vk.com`. Для правильности работы этих методов нужно передать в `options` параметр `accessToken`, который **в целях разработки** можно получить, создав [Standalone-приложение](https://vk.com/editapp?act=create).

Затем вызовите в браузере следующую ссылку:

```html
https://oauth.vk.com/authorize?client_id=CLIENT_ID&display=page&redirect_uri=&scope=SCOPE&response_type=token&v=5.92&state=123456
```

Где
- `CLIENT_ID` — это app_id только что созданного приложения
- `SCOPE` — желаемые уровни доступа для разработки, например `friends,offline,wall`

**ВНИМАНИЕ!** Никому не давайте этот токен. Не допускайте, чтобы токен попал в **production**-сборку приложения или в публичный репозиторий.

### CORS
На сайте `api.vk.com` не прописаны нужные заголовки, поэтому вызывать методы из браузера вне ВК придётся с помощью CORS-прокси. Быстрый и удобный прокси с открытым исходным кодом есть вот тут: https://github.com/marcus2vinicius/cors-anywhere, а его демонстрационная версия доступна по адресу https://cors-anywhere.herokuapp.com/. Настоятельно рекомендую вам поднять свою копию у себя, потому что при частых запросах этот прокси будет вас отключать.

В параметр `corsAddress` передаётся строка, которая будет подставлена перед **полным адресом вызова**. Например:

`https://api.vk.com/method/users.get?user_ids=1`

Будет заменено на:

`https://cors-anywhere.herokuapp.com/https://api.vk.com/method/users.get?user_ids=1`

Не забывайте про `/` в конце `corsAddress`.

## Поддерживаемые события
Идеология этой библиотеки в том, чтобы создать ситуацию, максимально близкую к живым данным. На текущий момент реализована поддержка следующих событий:
- `VKWebAppInit` — отправляется автоматически при инициализации библиотеки
- `VKWebAppGetUserInfo` — получает данные владельца токена с помощью API
- `VKWebAppGetAuthToken` — в DEV-режиме это событие ничего не делает, но вызов его обязателен, о чём библиотека предупреждает, чтобы не забыть вызвать его в основном режиме. Обратите внимание, `scope`, который передан сюда, будет актуален только в PROD-режиме. В DEV-режиме будет использоваться `scope`, полученный при создании токена
- `VKWebAppCallAPIMethod` — вызывает настоящий метод API ВК, возвращает результат или ошибку
- `VKWebAppGetGeodata` — вызывает функцию браузера о получении координат, после ответа пользователя возвращает результат или ошибку

Проверить наличие поддержки нужного события можно с помощью
```js
VKC.supports('VKWebAppGetUserInfo'); // возвращает true
```

## Собственные функции для реакции на события
Можно задать собственную функцию для ответа на событие, если встроенная вас не устраивает, или если событие ещё не поддерживается библиотекой. Функция должна возвращать **Promise**. На вход она принимает:

- `params` — объект который будет потом передан в событие
- `options` — текущие опции библиотеки

```js
import { MODE_DEV } from '@denisnp/vkui-connect-helper';

VKC.define('VKWebAppGetEmail', (params, options) => {
  // в options.mode хранится текущий режим MODE_DEV или MODE_PROD
  return new Promise((resolve, reject) => {
    if (options.mode === MODE_DEV) {
        resolve({
          type: 'VKWebAppGetEmailResult',
          data: { 
            email: 'blahblah@mail.com',
            sign: ''
          },
        });
    }
  });
});
```

## Шорткаты
Для некоторых распространённых событий есть шорткаты

### Авторизация
```js
VKC.auth(scope); // аналог VKC.send('VKWebAppGetAuthToken', { scope: ... } );

// Не забываем, что это промис, и нужно обработать ответ:
VKC.auth('friends,photos').then((authData) => {
  if (authData.data.scope.indexOf('friends') >= 0) {
    // пользователя дал нам друзей
  }
});
```

### Вызов API
```js
// в async-режиме
const [result, fail] = await VKC.api('friends.get', { fields: 'sex' }); // это аналог вызова VKC.send('VKWebAppCallAPIMethod'...)

if (result) {
  const firstFriendSex = result.data.items[0].sex;
}
```

## Поддержка остальных событий и участие в разработке
Если кто-то возьмётся за реализацию ещё какие-то событий, присылайте пулл-реквесты. Не забывайте проверить свой код на соответствие правилам, я использую [code-style от Airbnb](https://github.com/airbnb/javascript) с отступом **4 пробела**.

```bash
npm run lint
```

Напоминаю, что идея библиотеки в приближенности к настоящим данным. И если некоторые значения получить из ВК в принципе невозможно (например, email пользователя), то вместо других можно написать работоспособную замену. 
