const { expect } = require('chai')
const fs = require('fs')
const BilibiliApi = require('../index')
const api = new BilibiliApi()

describe('登陆验证', function () {
    it('扫码登陆成功', async function () {
        const res = await api.login('test/cookie')
        expect(res).to.be.equal(true)
        await fs.unlinkSync('test/cookie')
    })
})