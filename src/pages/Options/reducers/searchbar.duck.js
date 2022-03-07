import { createSelector } from 'reselect';
import data from '../../../data/data.json';
export const SET_INITIAL_DATA = 'searchbar/SET_INITIAL_DATA'

export function setInitialData(initialData) {
    return {
        type: SET_INITIAL_DATA,
        initialData,
    };
}

const initialState = {
    initialData: data,
};

const searchbarReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_INITIAL_DATA:
            return {
                ...state,
                initialData: action.initialData
            }
        default:
            return state;
    }
};

const selectSearchbar = state => state.searchbar || initialState;

const selectInitialData =
    createSelector(
        [selectSearchbar],
        (searchbarState) => searchbarState.initialData || {}
    );

export { searchbarReducer, selectInitialData }