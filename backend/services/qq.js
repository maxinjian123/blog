const https = require('https')
const axios = require('axios')
const iconv = require('iconv-lite')

/**
 * 通过 QQ 号获取用户头像和昵称
 * API: https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins={QQ号}
 * 返回 JSONP 格式: portraitCallBack({"QQ号":["头像URL",...,"昵称",...]})
 * 数组第一项为头像URL，倒数第二项(索引 -2)为昵称
 */
async function getQQInfo(qqNumber) {
    const url = `https://ffapi.cn/int/v1/qqname?qq=${qqNumber}`

    try {
        const response = await axios({
            method: 'get',
            url: url,
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/json',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            }
        })
        const data = response.data;
        return {
            avatar: data.avatar,
            nickname: data.name
        }

    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            console.error('[QQ] 请求超时')
        } else {
            console.error('[QQ] 请求失败:', err.message)
        }
        return {avatar: null, nickname: null}
    }
}
// 获取qq头像兜底方法
function getQQAvatar(qqNumber) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=640`
}
module.exports = {getQQInfo, getQQAvatar}