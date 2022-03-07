import { createSelector } from 'reselect';

export const SET_ACTIVE_TAB_ID = 'chrome/SET_ACTIVE_TAB_ID'
export const UNSET_ACTIVE_TAB_ID = 'chrome/UNSET_ACTIVE_TAB_ID'

export function setActiveTab(tabId) {
    return {
        type: SET_ACTIVE_TAB_ID,
        tabId,
    };
}

export function unsetActiveTabId() {
    return {
        type: UNSET_ACTIVE_TAB_ID,
    };
}

const initialState = {
    activeTabId: null,
};

const chromeReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_ACTIVE_TAB_ID:
            return {
                ...state,
                activeTabId: action.tabId
            }

        case UNSET_ACTIVE_TAB_ID:
            return {
                ...state,
                activeTabId: null
            }
        default:
            return state;
    }
};


const selectChromeState = state => state.chrome || initialState;

const selectActiveTabId =
    createSelector(
        selectChromeState,
        (chromeState) => chromeState.activeTabId
    );

export { chromeReducer, selectActiveTabId }