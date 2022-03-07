import { all } from 'redux-saga/effects';
import { chromeSaga } from './chromeSaga';
import { backgroundSaga } from './backgroundSaga';
import {storageSaga} from "./storageSaga";
import {networkSaga} from "./networkSaga";

export default function* rootSaga() {
    yield all([
        chromeSaga(),
        backgroundSaga(),
        storageSaga(),
        networkSaga(),
    ]);
}
