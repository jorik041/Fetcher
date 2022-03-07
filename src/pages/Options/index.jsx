import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import Options from './Options';
import configureStore from './configureStore'
import './index.css';

const {store, persistor} = configureStore();
window.document.title="Fetcher";

render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <Options title={'Settings'}/>
        </PersistGate>
    </Provider>,
    window.document.querySelector('#app-container')
);

if (module.hot) module.hot.accept();
