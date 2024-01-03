## [Github page](https://github.com/Bilibili-Reverse-Labs/bilibili-api)

## Base usage

`sh
npm i qxr-bilibili-api
`

`js
const BilibiliApi = require('qxr-bilibili-api')
const biliApi = new BilibiliApi()

// qrcode login
const loginRes = await biliApi.login()
`

## Test

- `npm run test`

## Feature

见 index.js 文件

## Thanks To

- https://github.com/SocialSisterYi/bilibili-API-collect
- https://github.com/DIYgod/RSSHub