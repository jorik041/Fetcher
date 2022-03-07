import levenshtein from 'js-levenshtein';
import {CONTENT_SCRAPE, SCRAPER_RESULTS} from "../messaging.constants";
import _ from 'lodash'
const MAX_ARTICLES_SCRAPED = 10

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

const getNonNumericStyleKeys = (ele) => {
    const style = window.getComputedStyle(ele)
    return Object.keys(style).filter(key => isNaN(key))
}

const necessaryStyles = ['fontSize', 'fontWeight', 'display', 'flexDirection', 'height',
    'border', 'color', 'margin', 'padding', 'borderRadius', 'marginRight', 'marginLeft', 'marginTop',
    'marginBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'textTransform',
    'borderRadius', 'backgroundColor']

const getEleHashToStyleHashMap = (element, hashToStyleMap) => {

    const bodyEle = window.document.body
    const bodyStyles = window.getComputedStyle(bodyEle)
    const bodyBackgroundColor = bodyEle.style.backgroundColor

    const nonNumericStyleKeys = getNonNumericStyleKeys(element)

    const eleHashToStyleHashMap = {}
    // const styleHashList = []

    let queue = [element]

    while (queue.length > 0) {
        const ele = queue.shift()

        const styles = window.getComputedStyle(ele)

        let finalStyles = {};
        Object.entries(bodyStyles).forEach(p=>{
            const styleKey = p[0]
            const styleVal = p[1]

            if (!styles[styleKey]) return

            if (styles[styleKey] !== styleVal){
                finalStyles[styleKey] = styles[styleKey];
            }

            if (necessaryStyles.includes(styleKey)) {
                finalStyles[styleKey] = styles[styleKey];
            }
        });

        if (Object.keys(eleHashToStyleHashMap).length === 0) {
            finalStyles.backgroundColor = bodyBackgroundColor
        }

        // ensure max width is 900
        if (finalStyles.width && finalStyles.width.includes('px')) {
            const width = parseInt(finalStyles.width.replace('px',''))
            if (width > 900) {
                finalStyles.width = '900px'
            }
        }

        finalStyles = _.pick(finalStyles, nonNumericStyleKeys)

        // const styleHash = cyrb53(JSON.stringify(finalStyles))
        const styleHash = JSON.stringify(finalStyles).hashCode()
        if (!hashToStyleMap[styleHash]) {
            hashToStyleMap[styleHash] = finalStyles
        }

        // eleHashToStyleHashMap[cyrb53(ele.outerHTML)] = styleHash
        eleHashToStyleHashMap[ele.outerHTML.hashCode()] = styleHash
        const children = [...ele.children]
        queue = queue.concat(children)
    }

    return eleHashToStyleHashMap
}

const STATE_READY = 'STATE_READY'
const STATE_FAILED = 'STATE_FAILED'
const transformDom = async (originalElement, ignoreData) => {

    const ignoreClassname = ignoreData && ignoreData.classname

    // const element = originalElement.cloneNode(true)
    let queue = [originalElement]

    while (queue.length > 0) {
        const ele = queue.shift()

        if (ignoreClassname && ele.className === ignoreClassname) {
            ele.remove()
        }

        if (ele.tagName === 'IMG') {

            // wait for image to finish download
            const promise1 = new Promise(async resolve => {
                while (!(ele.complete && ele.naturalHeight && ele.naturalHeight !== 0)) {
                    await wait(50)
                }
                await wait(50)
                resolve(STATE_READY)
            })

            const promise2 = wait(250)
            const finalState = await Promise.race([promise1, promise2]).then((state) => {
                return state || STATE_FAILED
            })

            if (finalState === STATE_FAILED) {
                console.log('IMG FAILED')
                return true  // return true anyways - test UX of this
            }
            console.log('IMG SUCCESS')
        }

        if (ele.tagName === 'VIDEO') {

            // wait for video to resolve
            const promise1 = new Promise(async resolve => {
                while (ele.readyState < 4) {
                    await wait(50)
                }
                resolve(STATE_READY)
            })

            const promise2 = wait(500)
            const finalState = await Promise.race([promise1, promise2]).then((state) => {
                return state || STATE_FAILED
            });

            if (finalState === STATE_READY) {
                console.log('VIDEO SUCCESS')

                // ele here is video
                const canvas = document.createElement("canvas");
                try {
                    const width = ele.videoWidth;
                    const height = ele.videoHeight;
                    canvas.width = width
                    canvas.height = height
                    canvas.getContext('2d')
                        .drawImage(ele, 0, 0, width, height);
                    const dataURL = canvas.toDataURL();

                    const imgEle = document.createElement('img')
                    imgEle.setAttribute('crossorigin', 'anonymous')
                    imgEle.src = dataURL
                    imgEle.width = width
                    imgEle.height = height

                    ele.parentElement.insertBefore(imgEle, ele)
                    ele.parentElement.removeChild(ele)
                } catch (e) {
                    console.log(e)
                    return false
                }
                canvas.remove()
            } else {
                console.log('VIDEO FAILED')
                return false
            }
        }

        const children = ele ? [...ele.children] : []

        if (children.length > 0) {
            queue = queue.concat(children)
        }
    }
    return true
}

const getHtmlHashAndInnerText = async (originalElement, ignoreData) => {

    const ignoreClassname = ignoreData && ignoreData.classname

    const element = originalElement.cloneNode(true)
    let queue = [element]

    while (queue.length > 0) {
        const ele = queue.shift()

        if (ignoreClassname && ele.className === ignoreClassname) {
            ele.remove()
        }

        while (ele && ele.attributes.length > 0) {
            ele.removeAttribute(ele.attributes[0].name);
        }

        const children = ele ? [...ele.children] : []

        if (children.length > 0) {
            queue = queue.concat(children)
        }
    }

    return {
        // htmlHash: cyrb53(element.outerHTML),
        htmlHash: element.outerHTML.hashCode(),
        htmlInnerText: element.innerText.replaceAll(/[0-9]/g, '')
    }
}

const getElements = (classname, tagName) => {
    let htmlCollection = []
    if (classname) {
        htmlCollection = document.getElementsByClassName(classname)
    } else if (tagName) {
        htmlCollection = document.getElementsByTagName(tagName)
    }
    return htmlCollection
}

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function elementInViewport(el) {
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while(el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
    }

    return (
        top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        (top + height) <= (window.pageYOffset + window.innerHeight) &&
        (left + width) <= (window.pageXOffset + window.innerWidth)
    );
}


const collectAndSendScrape = async (request) => {
    const existingHtmlHashes = request.existingHtmlHashes || []
    const existingHtmlHashToHtmlInnerTextMap = request.existingHtmlHashToHtmlInnerTextMap || {}

    let newHtmlHashes = []
    const htmlHashToHtmlStrMap = {}
    const htmlHashToEleHashToStyleHashMapMap = {}
    const htmlHashToHtmlInnerText = {}
    const styleHashToStyleMap = {}

    let count = 0
    let articleCount = 0
    let htmlCollection

    let elements = [];
    const eleSet = new Set()
    let i = 0
    while (count < 5) {
        await wait(100)
        htmlCollection = getElements(request.classname, request.tagName)
        // window.scroll(0, 0)

        elements = [...htmlCollection].slice(i)

        for (let j = 0; j < elements.length; j++) {
            const ele = elements[j]
            if (articleCount < MAX_ARTICLES_SCRAPED && !eleSet.has(ele)) {
                if (!elementInViewport(ele)) {
                    ele.scrollIntoView();
                    await wait(100)
                }
                // ele.style.backgroundColor = bodyBackgroundColor
                const {ignore} = request
                const {htmlHash, htmlInnerText} = await getHtmlHashAndInnerText(ele, ignore)
                console.log('htmlHash', htmlHash)
                if (!(ignore && ignore.text && htmlInnerText.toLowerCase().includes(ignore.text.toLowerCase()))) {
                    console.log('not ignore', htmlHash)
                    if (!existingHtmlHashes.includes(htmlHash) && !newHtmlHashes.includes(htmlHash)) {
                        const isOldHtmlHash =
                            Object.keys(existingHtmlHashToHtmlInnerTextMap).reduce((acc, itr) => {
                                if (!acc) {
                                    const oldHtmlInnerText = existingHtmlHashToHtmlInnerTextMap[itr]
                                    const lDist = levenshtein(oldHtmlInnerText, htmlInnerText)
                                    if (lDist / htmlInnerText.length < 0.15) return true
                                }
                                return acc
                            }, false)

                        if (!isOldHtmlHash && htmlInnerText && htmlInnerText.length > 0) {
                            console.log('not oldhtml hash', htmlHash)
                            const successfullyTransformed = await transformDom(ele)
                            console.log('successfullyTransormed', successfullyTransformed, htmlHash)
                            if (successfullyTransformed) {
                                const eleHashToStyleHashMap = getEleHashToStyleHashMap(ele, styleHashToStyleMap) // side effect here, hashToStyleMap
                                const htmlString = ele.outerHTML
                                htmlHashToHtmlStrMap[htmlHash] = htmlString
                                newHtmlHashes.push(htmlHash)
                                htmlHashToEleHashToStyleHashMapMap[htmlHash] = eleHashToStyleHashMap
                                htmlHashToHtmlInnerText[htmlHash] = htmlInnerText
                                articleCount += 1
                            }
                        }
                    }
                }
            }
            eleSet.add(ele)
            i += 1
        }
        htmlCollection[htmlCollection.length - 1].scrollIntoView();
        count += 1
    }


    console.log('SENDING RESULTS!!!')
    // console.log('newHtmlHashes', newHtmlHashes)
    // console.log('htmlHashToHtmlStrMap', htmlHashToHtmlStrMap)
    // console.log('htmlHashToEleHashToStyleHashMapMap', htmlHashToEleHashToStyleHashMapMap)
    // console.log('styleHashToStyleMap',styleHashToStyleMap )

    const message = {
        type: SCRAPER_RESULTS,
        tabId: request.tabId,
        newHtmlHashes,
        htmlHashToHtmlStrMap,
        htmlHashToEleHashToStyleHashMapMap,
        styleHashToStyleMap,
        htmlHashToHtmlInnerText,
        url: request.url
    }
    console.log(message)
    chrome.runtime.sendMessage(message)
    // window.close()
}

const checkIsPageReady = (request) => {
    const htmlCollection = getElements(request.classname, request.tagName)
    if (htmlCollection.length > 0) {
        console.log('CHECK READY')
        return true
    }
    return false
}

let scrapeInterval = null

const startScrapeInterval = (request) => {
    console.log('STARTING SCRAPE')
    document.body.style.zoom=0.8
    if (!scrapeInterval) {
        scrapeInterval = setInterval(async () => {
            const isPageReady = checkIsPageReady(request)

            if (isPageReady) {
                clearInterval(scrapeInterval)
                scrapeInterval = null
                await wait(250)
                await collectAndSendScrape(request)
            }

        }, 250)
    }
}

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        if (request.type === CONTENT_SCRAPE) {
            startScrapeInterval(request)
        }
    }
);
