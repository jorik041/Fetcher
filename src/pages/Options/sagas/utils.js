import _ from "lodash";

const cyrb53 = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

const applyStyleListBFS = (mainEle, hashToStyleMap, eleHashToStyleHashMap) => {
    let queue = [mainEle]
    while (queue.length > 0) {
        const ele = queue.shift()
        // const eleHash = cyrb53(ele.outerHTML)
        const eleHash = ele.outerHTML.hashCode()

        const styleHash = eleHashToStyleHashMap[eleHash]
        const style = hashToStyleMap[styleHash]

        //todo this is good defensive, checks whether style empty - implement on scrape side too
        const isValid = style && Object.keys(style).reduce((acc, styleKey) => {
            if (style[styleKey]) return true
            return acc
        }, false)
        if (style && isValid) {
            const styleStr = Object.entries(style).map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`).join(';')
            if (styleStr) {
                ele.setAttribute('style', styleStr)
                ele.setAttribute('class', styleHash)
            }
        } else {
            // most likely corrupted! - so kill it
            return false
        }
        const children = [...ele.children]
        queue = queue.concat(children)
    }
    return true
}

const replaceAllLinks = (mainEle, url) => {
    const linksArr = [...mainEle.getElementsByTagName('a')]
    const actualURL = new URL(url)
    const origin = actualURL.origin
    linksArr.forEach(link => {
        const href = link.getAttribute('href')
        if (href && href[0] === '/' && origin) {
            link.href = origin + href
        }
        link.target = '_blank'
    })
}

const convertTrTdToDivs = (htmlString = '') => {
    // experimental - for hackernews - https://stackoverflow.com/questions/66273869/domparser-is-not-parsing-everything-as-expected
    let finalString = htmlString
    finalString = finalString.replace('<tr', '<div')
    finalString = finalString.replace('</tr>', '</div>')
    finalString = finalString.replace('<td', '<div')
    finalString = finalString.replace('</td>', '</div>')
    return finalString
}

export const setStyleOnHtml = (htmlString, eleHashToStyleHashMap, hashToStyleMap, url) => {
    htmlString = convertTrTdToDivs(htmlString)
    if (htmlString && !_.isEmpty(eleHashToStyleHashMap)) {
        const parser = new DOMParser();
        let htmlDoc = parser.parseFromString(htmlString, 'text/html');
        let mainEle = htmlDoc.children[0].children[1].children[0]
        const succesfullyAppliedStyles = applyStyleListBFS(mainEle, hashToStyleMap, eleHashToStyleHashMap)
        if (!succesfullyAppliedStyles) return null

        replaceAllLinks(mainEle, url)
        const innerHtml = htmlDoc.querySelector('body').innerHTML
        mainEle.remove()
        return innerHtml
    }
}
















