import { buffers } from 'redux-saga';
import { take, call, fork, cancelled, all, put, takeEvery, select, actionChannel, race, delay } from 'redux-saga/effects';
import {ADD_URL_INFO, selectUrlInfoByUrl, selectUrlInfoMap} from "../reducers/sidebar.duck";
import {setStyleOnHtml} from "./utils";
import _ from "lodash";
import {
    CONTENT_SCRAPE,
    PROCESS_RESULTS,
    REGISTER_WINDOW_ID,
    SCRAPER_RESULTS,
    START_SCRAPE
} from "../../messaging.constants";
import {selectActiveTabId, setActiveTab, unsetActiveTabId} from "../reducers/chrome.duck";

const tabRunTimeout = 40000

let buffer = buffers.fixed(25)

const WIN_OS = 'win'
let currentOs

chrome.runtime.getPlatformInfo(function(info) {
    currentOs = info.os
});


function* eventListener() {

    //create channel which subscribes to record
    const requestChan = yield actionChannel(START_SCRAPE, buffer)
    while (true) {
        try {
            const payload = yield take(requestChan)
            yield call(handleRequest, payload);
        } catch (err) {
            console.log(err)
        }
    }
}

const createWindow = () => {
    return new Promise((resolve) =>
        chrome.windows.create({
            url: 'https://google.com',
            type: "normal",
            focused: currentOs === WIN_OS,
            width: 100
        }, function (win) {
            if (currentOs === WIN_OS) {
                chrome.windows.update(win.id, {focused: false});
            }
            return resolve(win)
        })
    )
}

const sendContentScrapeMessage = async (tabId, payload) => {
    const { url, htmlHashStrings, htmlHashToHtmlInnerTextMap, urlInfo } = payload

    console.log('sendContentScrapeMessage', url)
    chrome.tabs.sendMessage(tabId, {
        type: CONTENT_SCRAPE, tabId, ...urlInfo,
        existingHtmlHashes: htmlHashStrings,
        existingHtmlHashToHtmlInnerTextMap: htmlHashToHtmlInnerTextMap,
        url
    })
}


const runScrapeOnTab = (currentTabId, payload) => {
    const { url } = payload

    return new Promise((resolve) => {

        chrome.runtime.onMessage.addListener(function callback(request, sender, sendResponse) {
            if (request.type === SCRAPER_RESULTS) {
                chrome.tabs.onUpdated.removeListener(callback)
                resolve(request)
            }
        })

        chrome.tabs.onUpdated.addListener(function callback(tabId, info) {
            console.log(info)
            if (info.status === 'complete') {
                if (tabId === currentTabId) {
                    chrome.tabs.onUpdated.removeListener(callback) // remove listener after one use
                    sendContentScrapeMessage(currentTabId, payload)
                }
            }
        });
        chrome.tabs.update(currentTabId, { url });
    })

}

function* checkAndCleanUp(currentTabId) {
    if (buffer.isEmpty()) {
        try {
            chrome.tabs.remove(currentTabId);
        } catch (e) {
            console.log(e)
        }
        yield put(unsetActiveTabId())
    }
}

function *sendResponse(payload) {
    const { htmlHashToHtmlInnerText,
        htmlHashToHtmlStrMap,
        htmlHashToEleHashToStyleHashMapMap,
        newHtmlHashes,
        styleHashToStyleMap,
        url } = payload
    yield put({
        type: PROCESS_RESULTS,
        htmlHashToHtmlInnerText,
        htmlHashToHtmlStrMap,
        htmlHashToEleHashToStyleHashMapMap,
        newHtmlHashes,
        styleHashToStyleMap,
        url,
    })
}

function* scrape(currentTabId, payload) {
    const { responsePayload } = yield race({
        responsePayload: call(runScrapeOnTab, currentTabId, payload),
        timeout: delay(tabRunTimeout)
    })
    if (responsePayload) {
        yield sendResponse(responsePayload)
    }
    yield checkAndCleanUp(currentTabId)
}

const checkCurrentTabExist = (tabId) => {
    return new Promise((resolve) =>
        chrome.tabs.get(tabId, (tab) => {
            if (tab) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    )
}

function* createAndScrape(payload) {
    const win = yield call(createWindow)
    if (win.tabs && win.tabs[0]) {
        const currentTabId = win.tabs[0].id
        yield put(setActiveTab(currentTabId))
        yield scrape(currentTabId, payload)
    }
}

function* handleRequest(payload) {

    const currentTabId = yield select(selectActiveTabId)

    if (currentTabId) {
        const tabExist = yield call(checkCurrentTabExist, currentTabId)
        if (tabExist) {
            yield scrape(currentTabId, payload)
        } else {
            yield createAndScrape(payload)
        }
    } else {
        yield createAndScrape(payload)
    }
}

export function* backgroundSaga() {
    yield all(
        [
            eventListener(),
        ]
    );
}
