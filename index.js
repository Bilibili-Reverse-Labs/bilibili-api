const { addVerifyInfo, getVerifyString } = require('./util/wbi')
const cliProgress = require('cli-progress')
const qrcode = require('qrcode-terminal')
const axios = require('axios')
const _ = require('lodash')
const fs = require('fs')
const qs = require('qs')
const { delay } = require('./util/index')

class BilibiliApi {
    /**
     * @param {host, userAgent, cookie} opt 指定参数
     * @constructor
     */
    constructor(option = {}) {
        this.host = option.host || 'https://api.bilibili.com'
        // this.userAgent = opt.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
        this.userAgent = option.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        this.setCookie(option.cookie || '')
    }

    /**
     * 用户登录 暂时只支持扫码登录
     * @param {string} cookiePath 
     */
    async login(cookiePath = 'cookie.txt') {
        let cookie

        if (fs.existsSync(cookiePath)) {
            cookie = fs.readFileSync(cookiePath, 'utf-8')
        }
        if (!cookie || cookie.length == 0) {
            cookie = await this.qrCodeLogin()
            await fs.writeFileSync(cookiePath, cookie)
        }

        this.setCookie(cookie)

        const userNav = await this.getUserNav()
        if (!userNav.isLogin) {
            console.log('登陆失效，请重新扫码登陆')

            cookie = await this.qrCodeLogin()
            await fs.writeFileSync(cookiePath, cookie)
        }
        this.setCurMid(userNav.mid)
        return true
    }

    getHeaders() {
        return {
            'cookie': this.cookie,
            'user-agent': this.userAgent,
            'origin': 'https://search.bilibili.com',
            'referer': 'https://search.bilibili.com',
            'authority': 'api.bilibili.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
        }
    }

    setCookie(cookie) {
        this.cookie = cookie
        this.setJct(cookie)
    }

    setJct(cookie) {
        const cookies = cookie.split(';')
        for (const cookie of cookies) {
            if (cookie.includes('Securebili_jct')) {
                const match = cookie.match(/Securebili_jct=([^;]*)/)
                this.jct = match ? match[1] : null
                break
            }
        }
    }

    setCurMid(mid) {
        this.mid = mid
    }

    /**
     * 获取当前用户导航栏信息
     * @returns 
     */
    async getUserNav() {
        const res = await axios.request({
            url: `${this.host}/x/web-interface/nav`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取用户导航栏信息失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取用户导航栏信息失败')
        }

        return res.data.data
    }

    /**
     * 二维码登录
     * @returns 
     */
    async qrCodeLogin() {
        const res = await this.qrCodeGenatator()
        qrcode.generate(res.data.url, { small: true }, function (qrcode) {
            console.log(qrcode)
        })

        let success = false
        let count = 0
        let qrCodePollRes
        while (!success && count < 60) {
            await delay(1000)
            qrCodePollRes = await this.qrCodePoll(res.data.qrcode_key)
            if (qrCodePollRes.data.code == 0 && !qrCodePollRes.data.data.code) {
                success = true
            }
            count++
        }

        if (success) {
            console.log('扫码登陆成功')
            return qrCodePollRes.headers['set-cookie'].join('')
        }
        return null
    }

    /**
    * 生成登录二维码
    * @returns 
    */
    async qrCodeGenatator() {
        const res = await axios.request({
            url: `https://passport.bilibili.com/x/passport-login/web/qrcode/generate`
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('请求二维码失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }

        return res.data
    }

    /**
     * 查询扫码状态
     * @param {*} qrcode_key 
     * @returns 
     */
    async qrCodePoll(qrcode_key) {
        const res = await axios.request({
            url: `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcode_key}`
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('扫码登陆失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('扫码登陆失败')
        }
        return res
    }

    /**
     * 大会员签到
     * @returns { code, message }
     */
    async vipScoreTask() {
        const res = await axios.request({
            method: 'post',
            url: `${this.host}/pgc/activity/score/task/sign`,
            data: { type: 1 },
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('大会员签到失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('大会员签到失败')
        }
        return res.data
    }

    /**
     * 获取用户卡片信息
     * @param {string} mid 用户 id
     * @returns { following, archive_count, follower, like_num, card{} }
     */
    async getUserCard(mid) {
        const res = await axios.request({
            url: `${this.host}/x/web-interface/card?mid=${mid}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取用户卡片失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取用户卡片失败')
        }
        return res.data.data
    }

    /**
     * 私信
     * @returns 
     */
    async sendMessage(receiver_id, content) {
        const deviceid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function (name) {
            let randomInt = 16 * Math.random() | 0;
            return ("x" === name ? randomInt : 3 & randomInt | 8).toString(16).toUpperCase()
        }))
        const data = qs.stringify({
            'msg[sender_uid]': this.mid,
            'msg[receiver_id]': receiver_id,
            'msg[receiver_type]': '1',
            'msg[msg_type]': '1',
            'msg[msg_status]': '0',
            'msg[content]': JSON.stringify({ content }),
            'msg[timestamp]': '1704303022',
            'msg[new_face_version]': '0',
            'msg[dev_id]': deviceid,
            'from_firework': '0',
            'build': '0',
            'mobi_app': 'web',
            'csrf_token': this.jct,
            'csrf': this.jct
        })
        let params = addVerifyInfo(`w_sender_uid=${this.mid}&w_receiver_id=${receiver_id}&w_dev_id=${deviceid}`, await getVerifyString())
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.vc.bilibili.com/web_im/v1/web_im/send_msg?${params}`,
            headers: this.getHeaders(),
            data: data
        }

        const res = await axios.request(config)
        if (!res || !res.data || res.data.code != 0) {
            console.log('发送信息失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('发送信息失败')
        }
        return res.data.data
    }

    /**
     * 查询 vip 状态
     * @returns 
     */
    async checkVipStatus() {
        const res = await axios.request({
            url: `${this.host}/x/vip/web/user/info`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取会员信息失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取会员信息失败')
        }
        return res.data.data
    }

    /**
     * 获取视频所有评论
     * @param {*} videoAid 
     * @returns 
     */
    async getVideoAllComments(videoAid) {
        const data = await this.getVideoComments(videoAid)
        let replies = data.data.replies

        let isEnd = data.data.cursor.is_end
        let next = 2;
        while (!isEnd) {
            const data = await this.getVideoComments(videoAid, next)
            replies = _.concat(replies, data.data.replies)
            isEnd = data.data.cursor.is_end
            next++
        }

        return replies
    }

    /**
     * 获取视频单页评论
     * @param {*} videoAid 
     * @param {*} next 
     * @param {*} ps 
     * @returns 
     */
    async getVideoComments(videoAid, next = 1, ps = 30) {
        let params = addVerifyInfo(`oid=${videoAid}&type=1&mode=3&plat=1&web_location=1315875&next=${next}&ps=${ps}`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/v2/reply/wbi/main?${params}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频评论失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取视频评论失败')
        }
        return res.data
    }

    /**
     * 获取视频评论数
     * @param {*} videoAid 
     * @returns 
     */
    async getVideoCommentCount(videoAid) {
        const res = await axios.request({
            url: `${this.host}/x/v2/reply/count?oid=${videoAid}&type=1`,
            headers: this.getHeaders()
        })
        return res.data.data.count
    }

    /**
     * 举报稿件新版接口
     * @param {*} videoAid 
     * @param {*} desc 
     * @param {*} biliJtc 
     * @param {*} tid  3 4 10021
     * @returns 
     */
    async appealVideoV2(videoAid, desc, tid = 3) {
        const res = await axios.request({
            method: 'POST',
            url: `${this.host}/x/web-interface/appeal/v2/submit`,
            data: qs.stringify({
                'aid': videoAid,
                'block_author': 'false',
                'csrf': this.jct,
                desc,
                tid
            }),
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('举报稿件失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('举报稿件失败')
        }
        return res.data
    }

    /**
     * 获取用户所有视频
     * @param {*} mid 
     * @param {*} ps 条数 最多 30
     * @param {*} ct 获取前几条
     * @returns 
     */
    async getAllVideos(mid, ps = 30, ct) {
        let vlist = []
        let data = await this.getVideos(mid, 1, ps)
        vlist = _.concat(vlist, data.list.vlist)

        let count = ct || data.page.count
        const pages = Math.ceil(count / ps)
        for (let p = 2; p < pages + 1; p++) {
            data = await this.getVideos(mid, p, ps)
            vlist = _.concat(vlist, data.list.vlist)
        }
        return vlist
    }

    /**
     * 获取用户单页视频
     * @param {*} mid 
     * @param {*} pn 
     * @param {*} ps 
     * @returns 
     */
    async getVideos(mid, pn = 1, ps = 30) {
        let params = addVerifyInfo(`mid=${mid}&pn=${pn}&ps=${ps}`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/space/wbi/arc/search?${params}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频列表失败:', pn, _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取视频列表失败')
        }
        return res.data.data
    }

    /**
     * 获取用户合集
     * @param {*} mid 目标 mid
     * @param {*} page_num 
     * @param {*} page_size 
     * @returns 
     */
    async getUserSeriesList(mid, page_num = 1, page_size = 20) {
        const res = await axios.request({
            url: `${this.host}/x/polymer/web-space/seasons_series_list?mid=${mid}&page_num=${page_num}&page_size=${page_size}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取用户合集失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取用户合集失败')
        }
        return res.data.data
    }

    /**
     * 获取指定用户创建的所有收藏夹信息
     * @param {*} up_mid 目标用户 mid
     * @param {*} type 目标内容属性 默认全部 0：全部 2：视频稿件
     * @returns 
     */
    async getUserFavFolders(up_mid, type = 0) {
        const res = await axios.request({
            url: `${this.host}/x/v3/fav/folder/created/list-all?up_mid=${up_mid}&type=${type}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取收藏夹列表失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取收藏夹列表失败')
        }
        return res.data.data
    }

    /**
     * 获取指定收藏夹视频列表
     * @param {*} media_id 收藏夹 id
     * @param {*} pn 
     * @param {*} ps 
     * @returns 
     */
    async getUserFavResources(media_id, pn = 1, ps = 20) {
        const res = await axios.request({
            url: `${this.host}/x/v3/fav/resource/list?media_id=${media_id}&pn=${pn}&ps=${ps}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取收藏夹视频列表失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取收藏夹视频列表失败')
        }
        return res.data.data
    }

    /**
     * 获取视频详情
     * @param {*} bvid 
     * @returns 
     */
    async getVideoView(bvid) {
        const res = await axios.request({
            url: `${this.host}/x/web-interface/view?bvid=${bvid}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频详情失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取视频详情失败')
        }
        return res.data.data
    }

    /**
    * 获取充电详情
    * @param {*} mid 
    * @returns 
    */
    async getUpElecMonth(mid) {
        let params = addVerifyInfo(`up_mid=${mid}`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/ugcpay-rank/elec/month/up?${params}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取充电详情失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取充电详情失败')
        }
        return res.data.data
    }

    /**
     * 获取视频下载地址
     * @param {*} bvid 
     * @param {*} qn 
     * @returns 
     */
    async getVideoUrl(bvid, qn = 116) {
        const view = await this.getVideoView(bvid)
        const pages = view.pages
        const cid = pages[0].cid

        let params = addVerifyInfo(`qn=${qn}&fnver=0&fnval=4048&fourk=1&voice_balance=1&gaia_source=pre-load&bvid=${view.bvid}&cid=${cid}&web_location=1315873`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/player/wbi/playurl?${params}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频下载链接失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取视频下载链接失败')
        }
        return res.data.data
    }

    /**
     * 获取番剧下载地址
     * @param {*} ep_id 
     * @param {*} qn 
     * @returns 
     */
    async getFilmUrl(ep_id, qn = 116) {
        const params = `support_multi_audio=true&qn=${qn}&fnver=0&fnval=4048&fourk=1&ep_id=${ep_id}`
        const res = await axios.request({
            url: `${this.host}/pgc/player/web/playurl?${params}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取番剧下载链接失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
            throw new Error('获取番剧下载链接失败')
        }
        return res.data.result
    }

    /**
     * 下载视频
     * @param {*} url 
     * @param {*} path 
     * @returns 
     */
    async downloadVideo(url, path) {
        const res = await axios.request({
            maxBodyLength: Infinity,
            url,
            headers: this.getHeaders(),
            responseType: 'stream'
        })

        const totalLength = res.headers['content-length']
        console.log(`开始下载: ${path} ${(totalLength / 1024 / 1024 / 1024).toFixed(2)}G`)
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
        progressBar.start(totalLength, 0)

        const writer = fs.createWriteStream(path)
        let downloaded = 0
        res.data.on('data', chunk => {
            downloaded += chunk.length
            progressBar.update(downloaded)
        })

        res.data.pipe(writer)
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                progressBar.stop()
                resolve()
            })
            writer.on('error', reject)
        })
    }
}

module.exports = BilibiliApi