/*
 *
 * reducers.js
 * reducers configuration
 */

import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist'
import localforage from 'localforage';
import {sidebarReducer} from "./reducers/sidebar.duck";
import {mainPanelReducer} from "./reducers/mainpanel.duck";
import {chromeReducer} from "./reducers/chrome.duck";
import {searchbarReducer} from "./reducers/searchbar.duck";

const mainPanelPersistConfig = {
    key: 'mainPanel',
    storage: localforage,
    blacklist: ['htmlHashToHtmlDecoratedMap']
}

const createReducer = () =>
  combineReducers({
      mainPanel: persistReducer(mainPanelPersistConfig, mainPanelReducer),
      sidebar: sidebarReducer,
      chrome: chromeReducer,
      searchbar: searchbarReducer,
  });

export default createReducer;
