const { expect } = require('chai')
const fs = require('fs')
const BilibiliApi = require('../index')
const api = new BilibiliApi()

describe('', function () {
    before(async function () {
        const res = await api.login('test/cookie')
        expect(res).to.be.equal(true)
    })

    after(async function () {
        await fs.unlinkSync('test/cookie')
    })

    it('Success # getUserNav', async function () {
        let res = await api.getUserNav()
        expect(res.isLogin).to.be.equal(true)
    })

    it('Success # vipScoreTask', async function () {
        let res = await api.vipScoreTask()
        expect(res.message).to.be.equal('success')
    })

    it('Success # getUserCard', async function () {
        let res = await api.getUserCard('26321770')
        expect(res.card.mid).to.be.equal('26321770')
    })

    it('Success # sendMessage', async function () {
        let res = await api.sendMessage('647193094', 'ceshi')
        expect(res.msg_key).to.be.not.equal(null)
    })

    it('Success # checkVipStatus', async function () {
        let res = await api.checkVipStatus()
        expect(res.mid).to.be.equal(api.mid)
    })

    it.skip('Success # getVideoAllComments', async function () {
        let res = await api.getVideoAllComments('325070392')
        expect(res.length).to.be.not.equal(0)
    })

    it('Success # getVideoCommentCount', async function () {
        let res = await api.getVideoCommentCount('325070392')
        expect(res).to.be.not.equal(0)
    })

    it('Success # getAllVideos', async function () {
        let res = await api.getAllVideos('1462401621', 30, 30)
        expect(res.length).to.be.equal(30)
    })

    it('Success # getVideos', async function () {
        let res = await api.getVideos('1462401621')
        expect(res.list.vlist.length).to.be.equal(30)
    })

    it('Success # getUserFavResources', async function () {
        let res = await api.getUserFavFolders(api.mid)
        expect(res.list).to.be.not.equal(0)
        res = await api.getUserFavResources(res.list[0].id)
        expect(res.medias.length).to.be.not.equal(0)
    })

    it('Success # getFavAllResources', async function () {
        let res = await api.getUserFavFolders(api.mid)
        expect(res.list).to.be.not.equal(0)
        res = await api.getFavAllResources(res.list[0].id)
        expect(res.length).to.be.not.equal(0)
    })

    it('Success # getUserSeriesList', async function () {
        let res = await api.getUserSeriesList(api.mid)
        expect(res.items_lists).to.be.not.equal(undefined)
        // await api.getSeriesAllVideos(api.mid, res.items_lists.seasons_list[0].meta.season_id)
        // expect(res.meta).to.be.not.equal(undefined)
    })

    it('Success # getVideoView', async function () {
        let res = await api.getVideoView('BV1Yp4y1R7aQ')
        expect(res.bvid).to.be.equal('BV1Yp4y1R7aQ')
    })

    it.skip('Success # likeVideo', async function () {
        let res = await api.likeVideo('BV1Yp4y1R7aQ')
        expect(res.code).to.be.equal(0)
    })

    it.skip('Success # addCoinVideo', async function () {
        let res = await api.addCoinVideo('BV1Yp4y1R7aQ')
        expect(res.code).to.be.equal(0)
    })

    it('Success # getVideoUrl', async function () {
        let res = await api.getVideoUrl('BV1Yp4y1R7aQ')
        expect(res.dash.video[0].base_url).to.be.not.equal('')
    })

    it('Success # getFilmUrl', async function () {
        let res = await api.getFilmUrl('733691')
        expect(res.dash.video[0].base_url).to.be.not.equal('')
    })
})
