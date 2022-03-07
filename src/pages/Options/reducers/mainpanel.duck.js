import { createSelector } from 'reselect';
import _ from 'lodash'
import {ADD_URL_INFO, REMOVE_URL, RESET} from "./sidebar.duck";

export const SET_URL_TO_HTML_HASH_STRINGS_MAP = 'mainpanel/SET_URL_TO_HTML_HASH_STRINGS'
export const SET_HTML_HASH_TO_INNER_TEXT_MAP = 'mainpanel/SET_HTML_HASH_TO_INNER_TEXT_MAP'

export const SET_SNAPSHOT_URL_TO_HTML_HASH_STRINGS_MAP = 'mainpanel/SET_SNAPSHOT_URL_TO_HTML_HASH_STRINGS_MAP'
export const RESET_URL_TO_NEW_HTML_COUNT = 'mainpanel/RESET_URL_NEW_HTML_COUNT'
export const HIDE_HTML_HASH = 'mainpanel/HIDE_HTML_HASH'

export const SET_HTML_HASH_TO_HTML_DECORATED_MAP = 'mainpanel/SET_HTML_HASH_TO_HTML_DECORATED_MAP'

export const SCRAPE_ALL = 'mainpanel/SCRAPE_ALL'
export const CLEAR_ALL = 'mainpanel/CLEAR_ALL'

export const IS_LOADING = 'mainpanel/IS_LOADING'

const MAX_ARTICLES_STORED_FOR_COMPARISON = 100
const MAX_ARTICLES_STORED = 80

export function clearAll() {
    return {
        type: CLEAR_ALL,
    };
}

export function scrapeAll(showLoading = false) {
    return {
        type: SCRAPE_ALL,
        showLoading
    };
}

export function setHtmlHashToHtmlDecoratedMap(htmlHashToHtmlDecoratedMap) {
    return {
        type: SET_HTML_HASH_TO_HTML_DECORATED_MAP,
        htmlHashToHtmlDecoratedMap,
    };
}

export function hideHtmlHash(url, htmlHash) {
    return {
        type: HIDE_HTML_HASH,
        url,
        htmlHash,
    };
}

export function setHtmlHashToHtmlInnerTextMap(htmlHashToHtmlInnerTextMap) {
    return {
        type: SET_HTML_HASH_TO_INNER_TEXT_MAP,
        htmlHashToHtmlInnerTextMap
    };
}

export function resetUrlToNewHtmlCount() {
    return {
        type: RESET_URL_TO_NEW_HTML_COUNT,
    };
}
export function setSnapshotOfUrlToHtmlHashStringsMap() {
    return {
        type: SET_SNAPSHOT_URL_TO_HTML_HASH_STRINGS_MAP,
    };
}

export function setUrlToHtmlHashStringsMap(url, newHtmlHashes) {
    return {
        type: SET_URL_TO_HTML_HASH_STRINGS_MAP,
        url,
        newHtmlHashes,
    };
}

const initialState = {
    urlToHtmlHashStringsMap: {},
    hideUrlHtmlHashStringsMap: {},
    snapshotUrlToHtmlHashStringsMap: {},
    urlToNewHtmlCount: {}, // This is for counts, but also used for loading symbol
    htmlHashToHtmlInnerTextMap: {},
    htmlHashToHtmlDecoratedMap: {},
};

const mainPanelReducer = (state = initialState, action) => {

    switch (action.type) {

        case ADD_URL_INFO:
            return {
                ...state,
                urlToNewHtmlCount: {
                    ...state.urlToNewHtmlCount,
                    [action.urlInfo.url]: IS_LOADING
                },
            }


        case SET_URL_TO_HTML_HASH_STRINGS_MAP:
            const allHashStrings = _.uniq([...action.newHtmlHashes,
                ...(state.urlToHtmlHashStringsMap[action.url] || [])])

            const finalHashStrings = allHashStrings.slice(0, MAX_ARTICLES_STORED)
            const htmlHashesToBeDeleted = allHashStrings.slice(MAX_ARTICLES_STORED)
            const htmlHashesToBeDeletedForHtmlComp = allHashStrings.slice(MAX_ARTICLES_STORED_FOR_COMPARISON)

            // sort out urlToNewHtmlCount here
            const exisitingHtmlHashesSnapshot = state.snapshotUrlToHtmlHashStringsMap[action.url] || []
            const newHashesForUrl = _.differenceWith(finalHashStrings, exisitingHtmlHashesSnapshot, _.isEqual);

            return {
                ...state,
                urlToHtmlHashStringsMap: {
                    ...state.urlToHtmlHashStringsMap,
                    [action.url]: finalHashStrings
                },
                urlToNewHtmlCount: {
                    ...state.urlToNewHtmlCount,
                    [action.url]: newHashesForUrl.length
                },

            }

        case SET_SNAPSHOT_URL_TO_HTML_HASH_STRINGS_MAP:
            return {
                ...state,
                snapshotUrlToHtmlHashStringsMap: _.cloneDeep(state.urlToHtmlHashStringsMap),
            }

        case RESET_URL_TO_NEW_HTML_COUNT:
            return {
                ...state,
                urlToNewHtmlCount: initialState.urlToNewHtmlCount
            }

        case SET_HTML_HASH_TO_INNER_TEXT_MAP:
            return {
                ...state,
                htmlHashToHtmlInnerTextMap: {
                    ...state.htmlHashToHtmlInnerTextMap,
                    ...action.htmlHashToHtmlInnerTextMap
                }
            }

        // case REMOVE_HTML_HASH:
        //     const cleanedUrlToHtmlHashStringsMap = {
        //         ...state.urlToHtmlHashStringsMap,
        //         [action.url]: (state.urlToHtmlHashStringsMap[action.url] || []).filter(e => e !== action.htmlHash)
        //     }
        //
        //     return {
        //         ...state,
        //         urlToHtmlHashStringsMap: cleanedUrlToHtmlHashStringsMap,
        //         htmlHashToHtmlDecoratedMap: _.omit(state.htmlHashToHtmlDecoratedMap, [action.htmlHash]),
        //     }

        case HIDE_HTML_HASH:
            const hashStrings = state.hideUrlHtmlHashStringsMap[action.url] || []
            hashStrings.push(action.htmlHash)
            const hideUrlHtmlHashStringsMap = {
                ...state.hideUrlHtmlHashStringsMap,
                [action.url]: hashStrings
            }

            return {
                ...state,
                hideUrlHtmlHashStringsMap
            }

        case REMOVE_URL: {
            return {
                ...state,
                urlToHtmlHashStringsMap: _.omit(state.urlToHtmlHashStringsMap, [action.url]),
                snapshotUrlToHtmlHashStringsMap: _.omit(state.snapshotUrlToHtmlHashStringsMap,[action.url]),
                urlToNewHtmlCount: _.omit(state.urlToNewHtmlCount, [action.url]),
            }
        }

        case SET_HTML_HASH_TO_HTML_DECORATED_MAP:
            return {
                ...state,
                htmlHashToHtmlDecoratedMap: {
                    ...state.htmlHashToHtmlDecoratedMap,
                    ...action.htmlHashToHtmlDecoratedMap
                }
            }

        case SCRAPE_ALL:
            if (action.showLoading) {
                const urlToNewHtmlCount = Object.keys(state.urlToHtmlHashStringsMap).reduce((acc, url) => {
                    acc[url] = IS_LOADING
                    return acc;
                }, {})
                return {
                    ...state,
                    urlToNewHtmlCount
                }
            } else {
                return state
            }

        case CLEAR_ALL:
            return {
                ...initialState
            }

        default:
            return state;
    }
};

const selectMainPanel = state => state.mainPanel || initialState;

const selectUrlToHtmlHashStringsMap =
    createSelector(
        [selectMainPanel],
        (mainPanelState) => mainPanelState.urlToHtmlHashStringsMap
    );

const selectHtmlHashStringsByUrl =
    createSelector(
        [
            selectUrlToHtmlHashStringsMap,
            (state, url) => url,
        ],
        (urlToHtmlHashStringMap, url) => urlToHtmlHashStringMap[url] || []
    );

const selectUrlToNewHtmlCount =
    createSelector(
        selectMainPanel,
        (mainPanelState) => mainPanelState.urlToNewHtmlCount
    );

const selectHtmlHashToHtmlInnerTextMap =
    createSelector(
        selectMainPanel,
        (mainPanelState) => mainPanelState.htmlHashToHtmlInnerTextMap
    );

const selectHtmlHashToHtmlInnerTextMapByUrl =
    createSelector(
        [
            selectHtmlHashToHtmlInnerTextMap,
            selectHtmlHashStringsByUrl,
            (state, url) => url,
        ],
        (htmlHashToHtmlInnerTextMap, htmlHashStrings, url) =>
            _.pick(htmlHashToHtmlInnerTextMap, htmlHashStrings)
    );

const selectHideUrlToHtmlHashStringsMap =
    createSelector(
        [selectMainPanel],
        (mainPanelState) => mainPanelState.hideUrlHtmlHashStringsMap
    );

// const selectHideHtmlHashStringsByUrl =
//     createSelector(
//         [
//             selectHideUrlToHtmlHashStringsMap,
//             (state, url) => url,
//         ],
//         (hideUrlHtmlHashStringsMap, url) => hideUrlHtmlHashStringsMap[url] || []
//     );

const selectHtmlHashToHtmlDecoratedMap =
    createSelector(
        selectMainPanel,
        (mainPanelState) => mainPanelState.htmlHashToHtmlDecoratedMap
    );

const selectHtmlHashToHtmlDecoratedMapByUrl =
    createSelector(
        [
            selectHtmlHashToHtmlDecoratedMap,
            selectHtmlHashStringsByUrl,
            selectHideUrlToHtmlHashStringsMap,
            (state, url) => url,
        ],
        (htmlHashToHtmlDecoratedMap, htmlHashes, hideUrlToHtmlHashStringsMap, url) => {
            const hideHashStrings = hideUrlToHtmlHashStringsMap[url] || []
            const filteredHtmlHashes = htmlHashes.filter(htmlHash => !hideHashStrings.includes(htmlHash))
            return _.pick(htmlHashToHtmlDecoratedMap, filteredHtmlHashes)
        }
    );

export { mainPanelReducer,  selectUrlToHtmlHashStringsMap, selectUrlToNewHtmlCount,
    selectHtmlHashToHtmlInnerTextMap, selectHtmlHashStringsByUrl,
    selectHtmlHashToHtmlDecoratedMap, selectHtmlHashToHtmlDecoratedMapByUrl, selectHtmlHashToHtmlInnerTextMapByUrl}

