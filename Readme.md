# qxr-bilibili-api ![](https://img.shields.io/badge/API-qxr/bilibili-fb7299.svg)

基于 [哔哩哔哩-API收集整理](https://github.com/SocialSisterYi/bilibili-API-collect) 项目对接的 Bilibili 主站第三方接口，开箱即用。其中 wbi 校验算法借鉴自 [RSSHub](https://github.com/DIYgod/RSSHub)。

当前版本不稳定， 2.0 后为稳定版本。

## 快速开始

```javascript
// 扫码登录并存储 cookie 到 ./cookie.txt
const BilibiliApi = require('qxr-bilibili-api')
const biliApi = new BilibiliApi()
const loginRes = await biliApi.login('./cookie.txt')
```

## 开发计划

> 说明
> 链接指向 [哔哩哔哩-API收集整理](https://github.com/SocialSisterYi/bilibili-API-collect) 项目维护的接口详情
> B 站接口返回结构为 `{   "code": 0,   "data": {},   "message": "" }` 时, 除特殊情况, 本项目直接返回 `data` 属性。

- 登录
  - [x] [二维码登录](https://socialsisteryi.github.io/bilibili-API-collect/docs/login/login_action/QR.md) `login()`
  - [x] [导航栏用户信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/login/login_info.html#%E5%AF%BC%E8%88%AA%E6%A0%8F%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF) `getUserNav()`
  - [ ] [个人中心](https://socialsisteryi.github.io/bilibili-API-collect/docs/login/member_center.md)
  - [ ] [注销登录](https://socialsisteryi.github.io/bilibili-API-collect/docs/login/exit.md)
  - [ ] [登录记录](https://socialsisteryi.github.io/bilibili-API-collect/docs/login/login_notice.md)
- 消息中心
  - [x] [发送私信](https://socialsisteryi.github.io/bilibili-API-collect/docs/message/private_msg.html#%E5%8F%91%E9%80%81%E7%A7%81%E4%BF%A1-web%E7%AB%AF) `sendMessage(receiver_id, content)`
- 用户
  - [ ] [基本信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/user/info.md)
    - [x] [获取用户卡片信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/user/info.html#%E7%94%A8%E6%88%B7%E5%90%8D%E7%89%87%E4%BF%A1%E6%81%AF) `getUserCard(mid)`
  - [ ] [状态数](https://socialsisteryi.github.io/bilibili-API-collect/docs/user/status_number.md)
  - [ ] [关系](https://socialsisteryi.github.io/bilibili-API-collect/docs/user/relation.md)
  - [ ] [个人空间](https://socialsisteryi.github.io/bilibili-API-collect/docs/user/space.md)
- 大会员
  - [ ] [大会员基本信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/vip/info.md)
  - [x] [大会员签到](https://socialsisteryi.github.io/bilibili-API-collect/docs/vip/clockin.md) `vipScoreTask()`
- 视频
  - [ ] [视频分区一览 (分区代码)](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/video_zone.md)
  - [ ] [状态数](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/status_number.md)
  - [ ] [点赞 & 投币 & 收藏 & 分享](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/action.md)
  - [x] [播放&下载地址 (视频流)](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.md) `getVideoUrl(bvid, qn = 116)`
  - [x] [稿件投诉](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/appeal.md) `appealVideoV2(videoAid, desc, tid = 3)`
- 剧集 (番剧、影视)
  - [ ] [基本信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/bangumi/info.md)
  - [ ] [播放&下载地址（视频流）](https://socialsisteryi.github.io/bilibili-API-collect/docs/bangumi/videostream_url.md)
- 排行榜 & 最新视频
  - [ ] [排行榜](https://socialsisteryi.github.io/bilibili-API-collect/docs/video_ranking/ranking.md)
  - [ ] [热门视频](https://socialsisteryi.github.io/bilibili-API-collect/docs/video_ranking/popular.md)
  - [ ] [最新视频](https://socialsisteryi.github.io/bilibili-API-collect/docs/video_ranking/dynamic.md)
- 评论区
  - [x] [获取评论区评论总数](https://socialsisteryi.github.io/bilibili-API-collect/docs/comment/list.html#%E8%8E%B7%E5%8F%96%E8%AF%84%E8%AE%BA%E5%8C%BA%E8%AF%84%E8%AE%BA%E6%80%BB%E6%95%B0) `getVideoCommentCount(videoAid)`
  - [x] [评论区明细-懒加载](https://socialsisteryi.github.io/bilibili-API-collect/docs/comment/list.html#%E8%8E%B7%E5%8F%96%E8%AF%84%E8%AE%BA%E5%8C%BA%E6%98%8E%E7%BB%86-%E6%87%92%E5%8A%A0%E8%BD%BD) `getVideoComments(videoAid, next = 1, ps = 30)`
  - [ ] [操作](https://socialsisteryi.github.io/bilibili-API-collect/docs/comment/action.md)
  - [ ] [表情及表情包信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/emoji/list.md)
- 创作中心
  - [ ] [统计与数据](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/statistics&data.md)
- 列表查询相关
  - [ ] [电磁力数据](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/railgun.md)
- 充电
  - [ ] [充电列表](https://socialsisteryi.github.io/bilibili-API-collect/docs/electric/charge_list.md)
- [历史记录 & 稍后再看](https://socialsisteryi.github.io/bilibili-API-collect/docs/history&toview)
  - [ ] [历史记录](https://socialsisteryi.github.io/bilibili-API-collect/docs/history&toview/history.md)
  - [ ] [稍后再看](https://socialsisteryi.github.io/bilibili-API-collect/docs/history&toview/toview.md)
- 收藏夹
  - [ ] [基本信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/fav/info.md)
  - [ ] [收藏夹内容](https://socialsisteryi.github.io/bilibili-API-collect/docs/fav/list.md)
  - [ ] [收藏夹操作](https://socialsisteryi.github.io/bilibili-API-collect/docs/fav/action.md)
- web端组件
  - [ ] [分区当日投稿数](https://socialsisteryi.github.io/bilibili-API-collect/docs/web_widget/zone_upload.md)
- 视频合集
  - [x] 获取用户合集 `getUserSeriesList(mid, page_num = 1, page_size = 20)`
  - [x] 获取合集分页视频列表 `getSeriesVideos(mid, season_id, pn = 1, ps = 30, sort_reverse = false)`
  - [x] 获取合集所有视频 `getSeriesAllVideos(mid, season_id, ps = 30, ct)`

## 更新日志

- **1.0.13**: 调整视频相关接口入参
