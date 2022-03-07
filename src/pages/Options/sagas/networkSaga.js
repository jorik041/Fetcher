import {call, all, put, takeEvery, select, actionChannel} from 'redux-saga/effects';
import {setInitialData} from "../reducers/searchbar.duck";

export const FETCH_INITIAL_DATA = 'networkSaga/FETCH_INITIAL_DATA'

export const fetchInitialData = () => ({
    type: FETCH_INITIAL_DATA,
})

function* fetchInitialDataSaga() {
    const response = yield call(
        fetch,
        `https://fetcher.page/assets/data/data.json`
    );
    const initialData = yield call([response, response.json])
    yield put(setInitialData(initialData))
}

export function* networkSaga() {
    yield all(
        [
            takeEvery(FETCH_INITIAL_DATA, fetchInitialDataSaga),
        ]
    );
}
