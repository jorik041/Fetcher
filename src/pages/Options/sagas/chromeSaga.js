import { eventChannel } from 'redux-saga';
import {take, call, fork, cancelled, all, put, takeEvery, select, actionChannel} from 'redux-saga/effects';
import {ADD_URL_INFO, selectUrlInfoByUrl, selectUrlInfoMap} from "../reducers/sidebar.duck";
import {setStyleOnHtml} from "./utils";
import _ from "lodash";
import {PROCESS_RESULTS, REGISTER_WINDOW_ID, SCRAPER_RESULTS, START_SCRAPE} from "../../messaging.constants";
import {
    setHtmlHashToHtmlDecoratedMap,
    setHtmlHashToHtmlInnerTextMap,
    setHtmlHashToStyleHashListMap,
    setStyleHashToStyleMap,
    setHtmlHashToHtmlStrMap,
    setUrlToHtmlHashStringsMap,
    selectHtmlHashStringsByUrl,
    selectHtmlHashToHtmlInnerTextMapByUrl,
    SCRAPE_ALL, setHtmlHashToEleHashToStyleHashMapMap, CREATE_TAB
} from '../reducers/mainpanel.duck'
import * as localforage from "localforage";
import {SAVE_TO_STORAGE} from "./storageSaga";
import {setActiveTab} from "../reducers/chrome.duck";

function* startScrapeSingle(action){
    const urlInfo = action.urlInfo
    if (!urlInfo) return
    const url = urlInfo.url
    const htmlHashStrings = yield select(selectHtmlHashStringsByUrl, url);
    const htmlHashToHtmlInnerTextMap = yield select(selectHtmlHashToHtmlInnerTextMapByUrl, url);
    const urlInfoMap = {[url]: urlInfo}

    yield put({
        type: START_SCRAPE,
        url,
        urlInfo: urlInfoMap[url],
        htmlHashStrings,
        htmlHashToHtmlInnerTextMap
    })
}

const checkNoWindowsAreInFullScreen = () => {
    return new Promise((resolve) =>
        chrome.windows.getAll( (windows) => {
            windows.forEach(window => {
                console.log(window.state)
                if (window.state === 'fullscreen') {
                    resolve(false)
                }
            })
            resolve(true)
        })
    )
}

function* startScrapeAll(){

    if (yield call(checkNoWindowsAreInFullScreen)) {
        const urlInfoMap = yield select(selectUrlInfoMap)
        const urls = Object.keys(urlInfoMap)

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i]
            const htmlHashStrings = yield select(selectHtmlHashStringsByUrl, url);
            const htmlHashToHtmlInnerTextMap = yield select(selectHtmlHashToHtmlInnerTextMapByUrl, url);
            yield put({
                type: START_SCRAPE,
                url,
                urlInfo: urlInfoMap[url],
                htmlHashStrings,
                htmlHashToHtmlInnerTextMap
            })
        }
    } else {
        console.log('window fullscreen, skipping scrape')
    }

}


function* eventListener() {

    //create channel which subscribes to record
    const requestChan = yield actionChannel(PROCESS_RESULTS)
    while (true) {
        try {
            const payload = yield take(requestChan)
            yield call(handleResponse, payload);
        } catch (err) {
            console.log(err)
        }
    }
}

function* handleResponse(payload) {
    const {
        newHtmlHashes, htmlHashToHtmlStrMap, htmlHashToEleHashToStyleHashMapMap, styleHashToStyleMap,
        htmlHashToHtmlInnerText, url,
    } = payload

    const finalHtmlHashes = []
    const corruptedHtmlHashes = []
    const htmlHashToHtmlDecoratedMap = newHtmlHashes.reduce((acc, htmlHash) => {
        const htmlString = htmlHashToHtmlStrMap[htmlHash]
        const eleHashToStyleHashMap = htmlHashToEleHashToStyleHashMapMap[htmlHash]
        const decoratedHtml = setStyleOnHtml(htmlString, eleHashToStyleHashMap, styleHashToStyleMap, url)
        if (decoratedHtml) {
            acc[htmlHash] = decoratedHtml
            finalHtmlHashes.push(htmlHash)
        } else {
            corruptedHtmlHashes.push(htmlHash)
        }
        return acc
    }, {})

    yield put(setHtmlHashToHtmlDecoratedMap(_.omit(htmlHashToHtmlDecoratedMap, corruptedHtmlHashes)))
    yield put(setHtmlHashToHtmlInnerTextMap(_.omit(htmlHashToHtmlInnerText, corruptedHtmlHashes)))
    yield put(setUrlToHtmlHashStringsMap(url, finalHtmlHashes))

    yield put({
        type: SAVE_TO_STORAGE,
        htmlHashToEleHashToStyleHashMapMap: _.omit(htmlHashToEleHashToStyleHashMapMap, corruptedHtmlHashes),
        styleHashToStyleMap: styleHashToStyleMap,
        htmlHashToHtmlStrMap: _.omit(htmlHashToHtmlStrMap, corruptedHtmlHashes)
    })
}


export function* chromeSaga() {
    yield all(
        [
            eventListener(),
            // listenerSaga(),
            takeEvery(ADD_URL_INFO, startScrapeSingle),
            takeEvery(SCRAPE_ALL, startScrapeAll),
        ]
    );
}
