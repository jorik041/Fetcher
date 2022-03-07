import {take, call, fork, cancelled, all, put, takeEvery, select, actionChannel} from 'redux-saga/effects';
import {selectUrlInfoMap} from "../reducers/sidebar.duck";
import {setStyleOnHtml} from "./utils";
import _ from "lodash";
import {
    setHtmlHashToHtmlDecoratedMap,
    setHtmlHashToHtmlInnerTextMap,
    selectUrlToHtmlHashStringsMap, selectHtmlHashToHtmlInnerTextMap, selectHtmlHashToHtmlDecoratedMap
} from '../reducers/mainpanel.duck'
import * as localforage from "localforage";

export const SAVE_TO_STORAGE = 'storageSaga/SAVE_TO_STORAGE'
export const SET_DECORATED_HTML_VIA_STORAGE = 'storageSaga/SET_DECORATED_HTML_VIA_STORAGE'
export const PERFORM_GARBAGE_COLLECTION = 'storageSaga/PERFORM_GARBAGE_COLLECTION'

const STYLES_STORAGE = 'STYLES_STORAGE'

export const setDecoratedHtmlViaStorage = () => ({
    type: SET_DECORATED_HTML_VIA_STORAGE,
})

export const performGarbageCollection = () => {
    return {
        type: PERFORM_GARBAGE_COLLECTION,
    };
}

// need this queue, to prevent any race conditions from saving, reading
function* saveStorageEventListener() {

    //create channel which subscribes to record
    const requestChan = yield actionChannel(SAVE_TO_STORAGE)
    while (true) {
        try {
            const payload = yield take(requestChan)
            yield call(saveStylesToLocalForage, payload);
        } catch (err) {
            console.log(err)
        }
    }
}

function* saveStylesToLocalForage(payload) {

    try {
        const {
            htmlHashToEleHashToStyleHashMapMap,
            styleHashToStyleMap,
            htmlHashToHtmlStrMap
        } = payload

        if (_.isEmpty(htmlHashToEleHashToStyleHashMapMap) &&
            _.isEmpty(styleHashToStyleMap) &&
            _.isEmpty(htmlHashToHtmlStrMap)) {
            return
        }

        const initialCurrentStoredItem = {
            htmlHashToEleHashToStyleHashMapMap: {},
            styleHashToStyleMap: {},
            htmlHashToHtmlStrMap: {}
        }

        let currentStoredItem

        try {
            currentStoredItem = yield call([localforage, localforage.getItem], STYLES_STORAGE) || currentStoredItem
        } catch (e) {
            console.log(e)
        }

        currentStoredItem = currentStoredItem || initialCurrentStoredItem

        const newPayload = {
            htmlHashToEleHashToStyleHashMapMap: {
                ...currentStoredItem.htmlHashToEleHashToStyleHashMapMap,
                ...htmlHashToEleHashToStyleHashMapMap
            },
            styleHashToStyleMap: {
                ...currentStoredItem.styleHashToStyleMap,
                ...styleHashToStyleMap
            },
            htmlHashToHtmlStrMap: {
                ...currentStoredItem.htmlHashToHtmlStrMap,
                ...htmlHashToHtmlStrMap
            }
        }

        yield call([localforage, localforage.setItem], STYLES_STORAGE, newPayload)

    } catch (e) {
        console.log(e)
    }
}

function* setDecoratedHtmlViaStorageSaga() {
    try {

        const urlInfoMap = yield select(selectUrlInfoMap)
        const urlToHtmlHashStringsMap =  yield select(selectUrlToHtmlHashStringsMap)

        const currentStoredItem = yield call([localforage, localforage.getItem], STYLES_STORAGE)
        if (!currentStoredItem) return
        const {
            htmlHashToEleHashToStyleHashMapMap,
            styleHashToStyleMap,
            htmlHashToHtmlStrMap,
        } = currentStoredItem

        let htmlHashToHtmlDecoratedMap = {}
        Object.keys(urlInfoMap).map(url => {
            const htmlHashes = urlToHtmlHashStringsMap[url] || []
            const htmlHashToHtmlDecoratedMapForUrl = htmlHashes.reduce((acc, htmlHash) => {
                const htmlString = htmlHashToHtmlStrMap[htmlHash]
                const eleHashToStyleHashMap = htmlHashToEleHashToStyleHashMapMap[htmlHash]
                const decoratedHtml = setStyleOnHtml(htmlString, eleHashToStyleHashMap, styleHashToStyleMap, url)
                if (decoratedHtml) acc[htmlHash] = decoratedHtml
                return acc
            }, {})
            htmlHashToHtmlDecoratedMap = {
                ...htmlHashToHtmlDecoratedMap,
                ...htmlHashToHtmlDecoratedMapForUrl
            }
        })

        yield put(setHtmlHashToHtmlDecoratedMap(htmlHashToHtmlDecoratedMap))

    } catch (e) {
        console.log(e)
    }
}

function* performGarbageCollectionSaga() {

    const currentStoredItem = yield call([localforage, localforage.getItem], STYLES_STORAGE)
    if (!currentStoredItem) return
    const {
        htmlHashToEleHashToStyleHashMapMap,
        styleHashToStyleMap,
        htmlHashToHtmlStrMap,
    } = currentStoredItem

    const urlToHtmlHashStringsMap = yield select(selectUrlToHtmlHashStringsMap)
    const htmlHashToHtmlInnerTextMap = yield select(selectHtmlHashToHtmlInnerTextMap)
    const htmlHashToHtmlDecoratedMap = yield select(selectHtmlHashToHtmlDecoratedMap)
    const htmlHashesToBeKept = Array.from(Object.keys(urlToHtmlHashStringsMap).reduce((acc, url) => {
        urlToHtmlHashStringsMap[url].forEach(htmlHash => acc.add(htmlHash))
        return acc
    }, new Set()))

    const styleHashesToBeKept = [...htmlHashesToBeKept.reduce((acc, htmlHash) => {
        const eleHashToStyleHashMap = htmlHashToEleHashToStyleHashMapMap[htmlHash] || []
        const styleHashList = Object.values(eleHashToStyleHashMap)
        styleHashList.forEach(styleHash => acc.add(styleHash))
        return acc
    }, new Set())]

    console.log('PERFORMING GARBAGE COLLECTION')

    yield put(setHtmlHashToHtmlInnerTextMap(_.pick(htmlHashToHtmlInnerTextMap, htmlHashesToBeKept)))
    yield put(setHtmlHashToHtmlDecoratedMap((_.pick(htmlHashToHtmlDecoratedMap, htmlHashesToBeKept))))

    const newPayload = {
        htmlHashToEleHashToStyleHashMapMap: _.pick(htmlHashToEleHashToStyleHashMapMap, htmlHashesToBeKept),
        styleHashToStyleMap: _.pick(styleHashToStyleMap, styleHashesToBeKept),
        htmlHashToHtmlStrMap: _.pick(htmlHashToHtmlStrMap, htmlHashesToBeKept),
    }

    try {
        yield call([localforage, localforage.setItem], STYLES_STORAGE, newPayload)
    } catch (e) {
        console.log(e)
    }
}

export function* storageSaga() {
    yield all(
        [
            saveStorageEventListener(),
            takeEvery(SET_DECORATED_HTML_VIA_STORAGE, setDecoratedHtmlViaStorageSaga),
            takeEvery(PERFORM_GARBAGE_COLLECTION, performGarbageCollectionSaga),
        ]
    );
}
