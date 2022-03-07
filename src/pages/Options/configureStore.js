/**
 *
 * store.js
 * store configuration
 */

import { createStore, compose, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga'
import createReducer from './reducers';
import { persistStore, persistReducer } from 'redux-persist'
import localforage from 'localforage';
import rootSaga from "./sagas/rootSaga";

const persistConfig = {
  key: 'root',
  storage: localforage,
  blacklist: ['mainPanel']
}

export default function configureStore(initialState = {}, history) {

  const rootReducer = createReducer()
  const persistedReducer = persistReducer(persistConfig, rootReducer)
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    persistedReducer,
    initialState,
    applyMiddleware(sagaMiddleware)
  );

  sagaMiddleware.run(rootSaga);

  let persistor = persistStore(store)

  return { store, persistor }
}
