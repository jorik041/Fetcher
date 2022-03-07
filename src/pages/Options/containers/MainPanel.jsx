import React, {useEffect, useState, useRef} from "react";
import { connect } from 'react-redux';
import {selectUrlInfoMap, sidebarRemoveUrl} from "../reducers/sidebar.duck";
import {
    resetUrlToNewHtmlCount,
    selectHtmlHashToHtmlInnerTextMap,
    selectUrlToHtmlHashStringsMap,
    selectUrlToNewHtmlCount,
    setSnapshotOfUrlToHtmlHashStringsMap,
    setHtmlHashToHtmlDecoratedMap, scrapeAll,
} from "../reducers/mainpanel.duck";
import ResultContainer from "./ResultContainer";
import {selectActiveTabId, unsetActiveTabId} from "../reducers/chrome.duck";
import {CLOSE_OPTIONS, SCRAPER_RESULTS} from "../../messaging.constants";
import {setDecoratedHtmlViaStorage, performGarbageCollection} from "../sagas/storageSaga";
import {fetchInitialData} from "../sagas/networkSaga";
import '../styles/MainPanel.css';

const MainPanel = ({urlInfoMap, activeTabId, unsetActiveTabId,
                       setSnapshotOfUrlToHtmlHashStringsMap, urlToNewHtmlCount,
                       resetUrlToNewHtmlCount, performGarbageCollection, scrapeAll,
                       setDecoratedHtmlViaStorage, fetchInitialData}) => {

    useEffect(() => {
        fetchInitialData() // comment this out to use local data.json
    }, []);

    useEffect(() => {
        setDecoratedHtmlViaStorage()
        // scrapeAll() // TODO: REMOVE THIS BEFORE DEVELOPING
    }, []);

    useEffect(() => {
        if (activeTabId) {
            try {
                chrome.tabs.remove(activeTabId)
            } catch (e) {
                console.log(e)
            }
            unsetActiveTabId()
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            window.location.reload()
        }, 60000 * 60 * 6) //starts a reload every 6 hours
    }, []);

    useEffect(()=> {
        const interval = setInterval(() => {
            scrapeAll();
        }, 60000 * 10); //every 10 minutes
    }, []);

    useEffect(()=> {
        const interval = setTimeout(() => setInterval(() => {
            performGarbageCollection()
        }, 60000 * 10), 60000 * 5); // starts after 5 minutes
    }, []);

    useEffect(() => {
        chrome.runtime.onMessage.addListener(function callback(request, sender, sendResponse) {
            if (request.type === CLOSE_OPTIONS) {
                window.close()
            }
        })
    }, [])

    const visibilityChangeHandler = () => {
        if (document.visibilityState === 'visible') {
            setSnapshotOfUrlToHtmlHashStringsMap()
        } else if (document.visibilityState === 'hidden') {
            resetUrlToNewHtmlCount()
        }
    }

    useEffect(() => {
        document.addEventListener("visibilitychange", visibilityChangeHandler);
    }, [])

    const newCount = Object.keys(urlToNewHtmlCount).reduce((acc, itr) => {
        return acc + urlToNewHtmlCount[itr]
    }, 0)

    window.document.title=`${newCount > 0 ? `(${newCount}) ` : ''}Fetcher`;

    return (
        <div className='MainPanel'>
            {/*<div>*/}
            {/*    <button onClick={() => scrapeAll()}>*/}
            {/*        scrape!*/}
            {/*    </button>*/}
            {/*    <button onClick={() => setSnapshotOfUrlToHtmlHashStringsMap()}>*/}
            {/*        snapshot!*/}
            {/*    </button>*/}
            {/*    <button onClick={() => performGarbageCollection()}>*/}
            {/*        clean!*/}
            {/*    </button>*/}
            {/*</div>*/}
            <div style={{display:'flex', flexDirection:'column', padding: 12}}>
                {
                    Object.keys(urlInfoMap).map(url =>
                    <ResultContainer url={url} urlInfo={urlInfoMap[url]} newHtmlCount={urlToNewHtmlCount[url]}/>
                    )
                }
            </div>
        </div>
    );
};


const mapDispatchToProps = (dispatch) => {
    return {
        removeUrl: (url) => dispatch(sidebarRemoveUrl(url)),
        unsetActiveTabId: () => dispatch(unsetActiveTabId()),
        setHtmlHashToHtmlDecoratedMap: (htmlHashes, htmlHashToHtmlDecoratedMap) => dispatch(setHtmlHashToHtmlDecoratedMap(htmlHashes, htmlHashToHtmlDecoratedMap)),
        setSnapshotOfUrlToHtmlHashStringsMap: () => dispatch(setSnapshotOfUrlToHtmlHashStringsMap()),
        resetUrlToNewHtmlCount: () => dispatch(resetUrlToNewHtmlCount()),
        performGarbageCollection: () => dispatch(performGarbageCollection()),
        scrapeAll: () => dispatch(scrapeAll()),
        setDecoratedHtmlViaStorage: () => dispatch(setDecoratedHtmlViaStorage()),
        fetchInitialData: () => dispatch(fetchInitialData()),
    };
};

const mapStateToProps = (state, props) => ({
    urlInfoMap: selectUrlInfoMap(state),
    activeTabId: selectActiveTabId(state),
    urlToHtmlHashStringsMap: selectUrlToHtmlHashStringsMap(state),
    urlToNewHtmlCount: selectUrlToNewHtmlCount(state),
    htmlHashToHtmlInnerTextMap: selectHtmlHashToHtmlInnerTextMap(state),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MainPanel);

