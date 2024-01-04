

[Github page](https://github.com/Bilibili-Reverse-Labs/bilibili-api)

## Base usage

- 安装

```sh
npm i qxr-bilibili-api
```

- 扫码登录

```js
const BilibiliApi = require('qxr-bilibili-api')
const biliApi = new BilibiliApi()
const loginRes = await biliApi.login()
```

## Test

- `npm run test`

## Feature

见 `index.js` 文件

## Thanks To

- 接口文档: [bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
- Wbi 核心算法: [RSSHub](https://github.com/DIYgod/RSSHub)
