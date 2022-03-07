import _ from "lodash";

export const cleanAndGetUrlObj = (url) => {
    let cleanedUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        cleanedUrl = 'https://' + url
    }
    cleanedUrl = cleanedUrl.replace('www.', '')
    if (cleanedUrl[cleanedUrl.length-1] === '/') {
        cleanedUrl = cleanedUrl.slice(0, url.length-1)
    }
    try {
        const url = new URL(cleanedUrl)
        return {
            cleanedUrl,
            origin: url.origin
        }
    } catch (e) {
        console.log(e)
        return false
    }
}

const convertToUrlRegex = (url) => {
    let finalUrlRegex = '^' + url.replace('*', '(.+)') + '$'
    finalUrlRegex = '^' + finalUrlRegex.replace('?', '\\?')
    return finalUrlRegex
}

const getRegexToDataMap = _.memoize((data) => Object.keys(data).reduce((acc, itr) => {
    acc[convertToUrlRegex(itr)] = {...data[itr], originalUrl: itr}
    return acc
}, {}));


export const getDataMapForUrl = (url, data) => {
    let dataMap = {}
    const regexToDataMap = getRegexToDataMap(data)
    Object.keys(regexToDataMap).forEach(regexStr => {
        let re = new RegExp(regexStr)
        if (re.test(url)) {
            dataMap = regexToDataMap[regexStr]
            dataMap.wildcard = url.replace(dataMap.originalUrl.replace('*', ''), '')
        }
    })
    return dataMap
}