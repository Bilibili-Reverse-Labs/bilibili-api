const { expect } = require('chai')
const fs = require('fs')
const BilibiliApi = require('../index')
const api = new BilibiliApi()

describe.skip('登陆验证', function () {
    it('扫码登陆成功', async function () {
        const res = await api.login('test/cookie')
        expect(res).to.be.equal(true)
        await fs.unlinkSync('test/cookie')
    })
})

describe('获取番剧详情', function () {
    it('成功', async function () {
        let res = await api.login('test/cookie')
        expect(res).to.be.equal(true)

        res = await api.getFilmUrl('733691')
        expect(res.dash.video[0].base_url).to.be.not.equal(true)

        await fs.unlinkSync('test/cookie')
    })
})