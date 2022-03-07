import { createSelector } from 'reselect';
import _ from 'lodash'
export const ADD_URL_INFO = 'sidebar/ADD_URL_INFO'
export const REMOVE_URL = 'sidebar/REMOVE_URL'
export const RESET = 'sidebar/RESET'
export const SET_IS_FIRST_VISIT = 'sidebar/SET_IS_FIRST_VISIT'

export function addUrlInfo(urlInfo) {
    return {
        type: ADD_URL_INFO,
        urlInfo,
    };
}

export function setIsFirstVisit(bool) {
    return {
        type: SET_IS_FIRST_VISIT,
        bool,
    };
}

export function sidebarRemoveUrl(url) {
    return {
        type: REMOVE_URL,
        url,
    };
}

export function reset() {
    return {
        type: RESET,
    };
}

const initialState = {
    urlInfoMap: {},
    isFirstVisit: true
};

const sidebarReducer = (state = initialState, action) => {
    switch (action.type) {
        case ADD_URL_INFO:
            return {
                ...state,
                urlInfoMap: {
                    ...state.urlInfoMap,
                    [action.urlInfo.url]: {
                        ...action.urlInfo
                    }
                }
            }
        case REMOVE_URL:
            const newUrlInfoMap = _.clone(state.urlInfoMap)
            delete newUrlInfoMap[action.url]
            return {
                ...state,
                urlInfoMap: newUrlInfoMap
            }
        case SET_IS_FIRST_VISIT:
            return {
                ...state,
                isFirstVisit: action.bool
            }
        case RESET:
            return {...initialState}
        default:
            return state;
    }
};


const selectSidebar = state => state.sidebar || initialState;

const selectUrlInfoMap =
    createSelector(
        [selectSidebar],
        (sidebarState) => sidebarState.urlInfoMap || {}
    );

const selectUrlInfoByUrl =
    createSelector(
        [
            selectUrlInfoMap,
            (state, url) => url
        ],
        (urlInfoMap, url) => urlInfoMap[url] || {}
    );

const selectIsFirstVisit =
    createSelector(
        [selectSidebar],
        (sidebarState) => sidebarState.isFirstVisit
    )

export { sidebarReducer, selectUrlInfoMap, selectUrlInfoByUrl, selectIsFirstVisit }