import React, {useState, useEffect} from 'react';
import './Popup.css';
import {CLOSE_OPTIONS} from "../messaging.constants";
import fetcherLogo from '../../assets/img/fetcherLogo3.jpeg'; // Tell webpack this JS file uses this image

const Popup = () => {
    return (
        <div className="App">
            <header className="App-header">
                {/*<h2>Fetcher</h2>*/}
                <img src={fetcherLogo} style={{height: 60, marginBottom: 12}}/>
                <button className={'Button'} onClick={async () => {
                    chrome.runtime.sendMessage({type: CLOSE_OPTIONS})
                    chrome.runtime.openOptionsPage()
                }}>
                    Open App
                </button>
                <button className={'Button'} onClick={() => {
                    chrome.runtime.sendMessage({type: CLOSE_OPTIONS})
                }}>
                    Close App
                </button>
            </header>
        </div>
    );
};

export default Popup;
