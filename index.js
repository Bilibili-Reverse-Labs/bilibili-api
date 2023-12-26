const { addVerifyInfo, getVerifyString } = require('./util/wbi')
const cliProgress = require('cli-progress')
const qrcode = require('qrcode-terminal')
const axios = require('axios')
const _ = require('lodash')
const fs = require('fs')
const qs = require('qs')
const { delay } = require('./util/index')

class BilibiliApi {
    constructor(opt = {}) {
        this.host = opt.host || 'https://api.bilibili.com'
        this.ua = opt.ua || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
        this.cookie = opt.cookie
        this.jct = ''
    }

    /**
     * 用户登录
     * @param {*} cookiePath 
     */
    async login(cookiePath = 'cache/cookie') {
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
        if (!userNav.data.isLogin) {
            console.log('登陆失效，请重新扫码登陆')

            cookie = await this.qrCodeLogin()
            await fs.writeFileSync(cookiePath, cookie)
        }
        return true
    }

    async getUserNav() {
        const res = await axios.request({
            url: `https://api.bilibili.com/x/web-interface/nav`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取用户导航栏信息失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }

        return res.data
    }

    getHeaders() {
        return {
            'cookie': this.cookie,
            'user-agent': this.ua,
            'origin': 'https://search.bilibili.com',
            'referer': 'https://search.bilibili.com',
            'authority': 'api.bilibili.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        }
    }

    async setCookie(cookie) {
        this.cookie = cookie
        this.jct = ''
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

    async vipScoreTask() {
        const res = await axios.request({
            method: 'post',
            // url: `https://api.bilibili.com/pgc/activity/score/task/sign`,
            url: `${this.host}/x/vip/privilege/receive`,
            data: { type: 1 },
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('大会员签到失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }

        return res.data
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
        }
        return res
    }

    async vipSign() {
        const res = await axios.request({
            url: `${this.host}/pgc/activity/score/task/sign`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('vipSign', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data
    }

    /**
     * 获取用户卡片信息
     * @param {String} mid 用户 id
     * @returns 
     */
    async getUserCard(mid) {
        const res = await axios.request({
            url: `${this.host}/x/web-interface/card?mid=${mid}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取用户卡片失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data.data.card
    }

    async sendMessage() {
        const deviceid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (function (name) {
            let randomInt = 16 * Math.random() | 0;
            return ("x" === name ? randomInt : 3 & randomInt | 8).toString(16).toUpperCase()
        }))
        const res = await axios.request({
            method: 'post',
            url: ` https://api.vc.bilibili.com/web_im/v1/web_im/send_msg`,
            headers: this.getHeaders(),
            data: qs.stringify({
                'msg': {
                    sender_uid: '',
                    receiver_id: '',
                    receiver_type: 1,
                    msg_type: 1,
                    deviceid,
                    timestamp: Date.now(),
                    content: '',
                    crsf: this.biliJtc
                },
            }),
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取用户卡片失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data.data.card
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
        }
        return res.data.data.vip_status
    }

    /**
     * 获取视频所有评论
     * @param {*} vedio 
     * @returns 
     */
    async getVedioAllComments(vedio) {
        const data = await this.getVedioComments(vedio)
        let replies = []

        data.data.replies.map(r => {
            let item = { rpid: r.rpid, uname: r.member.uname, mid: r.member.mid, level: r.member.level_info.current_level, message: r.content.message, ip: r.reply_control.location, ctime: r.ctime, pictures: r.content.pictures }
            item.replies = _.map(r.replies, c => {
                return { rpid: c.rpid, uname: c.member.uname, mid: c.member.mid, level: c.member.level_info.current_level, message: c.content.message, ip: c.reply_control.location, ctime: c.ctime }
            })
            replies.push(item)
        })

        let isEnd = data.data.cursor.is_end
        let next = 2;
        while (!isEnd) {
            const data = await this.getVedioComments(vedio, next)
            data.data.replies.map(r => {
                let item = { rpid: r.rpid, uname: r.member.uname, mid: r.member.mid, level: r.member.level_info.current_level, message: r.content.message, bv: vedio.bvid, ip: r.reply_control.location, ctime: r.ctime, pictures: r.content.pictures }
                item.replies = _.map(r.replies, c => {
                    return { rpid: c.rpid, uname: c.member.uname, mid: c.member.mid, level: c.member.level_info.current_level, message: c.content.message, ip: c.reply_control.location, ctime: c.ctime }
                })
                replies.push(item)
            })
            isEnd = data.data.cursor.is_end
            next++
        }

        return replies
    }

    /**
     * 获取视频单页评论
     * @param {*} vedio 
     * @param {*} next 
     * @param {*} ps 
     * @returns 
     */
    async getVedioComments(vedio, next = 1, ps = 30) {
        let params = addVerifyInfo(`oid=${vedio.aid}&type=1&mode=3&plat=1&web_location=1315875&next=${next}&ps=${ps}`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/v2/reply/wbi/main?${params}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频评论失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data
    }

    /**
     * 获取视频评论数
     * @param {*} vedio 
     * @returns 
     */
    async getVedioCommentCount(vedio) {
        const res = await axios.request({
            url: `${this.host}/x/v2/reply/count?oid=${vedio.aid}&type=1`,
            headers: this.getHeaders()
        })
        return res.data.data.count
    }

    /**
     * 举报稿件新版接口
     * @param {*} vedio 
     * @param {*} desc 
     * @param {*} biliJtc 
     * @param {*} tid  3 4 10021
     * @returns 
     */
    async appealVedioV2(vedio, desc, biliJtc, tid = 3) {
        const res = await axios.request({
            method: 'POST',
            url: `${this.host}/x/web-interface/appeal/v2/submit`,
            data: qs.stringify({
                'aid': vedio.aid,
                'block_author': 'false',
                'csrf': biliJtc,
                desc,
                tid
            }),
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('举报稿件失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data
    }

    /**
     * 获取用户所有视频
     * @param {*} mid 
     * @param {*} ps 
     * @param {*} ct 
     * @returns 
     */
    async getAllVedios(mid, ps = 30, ct) {
        let vlist = []
        let data = await this.getVedios(mid, 1, ps)
        vlist = _.concat(vlist, data.list.vlist)

        let count = ct || data.page.count
        const pages = Math.floor(count / ps)
        for (let p = 2; p < pages + 1; p++) {
            data = await this.getVedios(mid, p, ps)
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
    async getVedios(mid, pn = 1, ps = 30) {
        let params = addVerifyInfo(`mid=${mid}&pn=${pn}&ps=${ps}`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/space/wbi/arc/search?${params}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频列表失败:', pn, _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data.data
    }

    /**
     * 获取视频详情
     * @param {*} vedio 
     * @returns 
     */
    async getVedioView(vedio) {
        const res = await axios.request({
            url: `${this.host}/x/web-interface/view?bvid=${vedio.bvid}`,
            headers: this.getHeaders()
        })
        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频详情失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data.data
    }

    /**
     * 获取视频下载地址
     * @param {*} vedio 
     * @param {*} qn 
     * @returns 
     */
    async getVedioUrl(vedio, qn = 116) {
        const view = await this.getVedioView(vedio)
        const pages = view.pages
        const cid = pages[0].cid

        let params = addVerifyInfo(`qn=${qn}&fnver=0&fnval=4048&fourk=1&voice_balance=1&gaia_source=pre-load&bvid=${vedio.bvid}&cid=${cid}&web_location=1315873`, await getVerifyString())
        const res = await axios.request({
            url: `${this.host}/x/player/wbi/playurl?${params}`,
            headers: this.getHeaders()
        })

        if (!res || !res.data || res.data.code != 0) {
            console.log('获取视频下载链接失败:', _.get(res, 'data.code'), _.get(res, 'data.message'))
        }
        return res.data.data.dash.video
    }

    /**
     * 下载视频
     * @param {*} url 
     * @param {*} path 
     * @returns 
     */
    async downloadVedio(title, url, path) {
        const res = await axios.request({
            maxBodyLength: Infinity,
            url,
            headers: this.getHeaders(),
            responseType: 'stream'
        })

        const totalLength = res.headers['content-length']
        console.log(`开始下载: ${title} ${(totalLength/1024/1024/1024).toFixed(2)}G`)
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