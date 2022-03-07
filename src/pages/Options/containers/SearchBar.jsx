import React, {useEffect, useState} from "react";
import { connect } from 'react-redux';
import _ from 'lodash'
import {addUrlInfo, selectIsFirstVisit, selectUrlInfoMap, setIsFirstVisit} from "../reducers/sidebar.duck";
import '../styles/SearchBar.css';
import {cleanAndGetUrlObj, getDataMapForUrl} from "./searchbar.utils";
import fetcherLogo from '../../../assets/img/fetcherLogo3.jpeg'; // Tell webpack this JS file uses this image
import fetcherLogoDark from '../../../assets/img/fetcherLogoDark.jpg'; // Tell webpack this JS file uses this image
import crossIcon from '../../../assets/img/cross.svg';
import crossIconDark from '../../../assets/img/cross_dark.svg';
import refreshIcon from '../../../assets/img/refresh.svg';
import refreshIconDark from '../../../assets/img/refresh_dark.svg';
import {clearAll, scrapeAll} from "../reducers/mainpanel.duck";
import {selectInitialData} from "../reducers/searchbar.duck";
import arrowRightDark from "../../../assets/img/arrow-right_dark.svg";
import arrowRight from "../../../assets/img/arrow-right.svg";

const SHOW_HELPER_TEXT = 'SHOW_HELPER_TEXT'
const SHOW_HELPER_TEXT2 = 'SHOW_HELPER_TEXT2'
const SHOW_HELPER_TEXT3 = 'SHOW_HELPER_TEXT3'
const SHOW_HELPER_NEED_LOGIN = 'SHOW_HELPER_NEED_LOGIN'
const SHOW_ERROR = 'SHOW_ERROR'
const SHOW_HELPER_LOADING = 'SHOW_HELPER_LOADING'


const SearchBar = ({addUrlInfo, urlInfoMap, setFirstVisit, isFirstVisit, scrapeAll, clearAll, initialData}) => {

    const [urlValue, setUrlValue] = useState('')
    const [helperTextType, setHelperTextType] = useState('')
    const [showHelperText, setShowHelperText] = useState(false)
    const [count, setCount] = useState(0)
    const availableUrls = Object.keys(initialData)

    useEffect(() => {
        if (isFirstVisit) {
            setFirstVisit(false)
            setShowHelperText(true)
        }
    }, []);

    const urls = Object.keys(urlInfoMap)
    // const requireLoginUrls = _.filter(initialData, {requireLogin: true})
    const requireLoginUrls = Object.keys((_.pickBy(initialData, (data) => data.requireLogin) || {}))

    const handleAddUrl = (url) => {
        const urlObj= cleanAndGetUrlObj(url)
        if (urlObj) {
            const {cleanedUrl, origin} = urlObj
            const dataMapForUrl = getDataMapForUrl(cleanedUrl, initialData)
            if (dataMapForUrl && !_.isEmpty(dataMapForUrl)) {
                const urlInfo = {
                    url: cleanedUrl,
                    origin,
                    favicon: `http://www.google.com/s2/favicons?domain=${origin}`,
                    ...dataMapForUrl
                }
                addUrlInfo(urlInfo)
                if (urls.length === 0) {
                    setHelperTextType(SHOW_HELPER_LOADING)
                }
            } else {
                setHelperTextType(SHOW_ERROR)
            }
        } else {
            setHelperTextType(SHOW_ERROR)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddUrl(e.target.value)
            setUrlValue('')
        }
    }

    const handleOnFocus = () => {
        if (count === 0) {
            setHelperTextType(SHOW_HELPER_TEXT)
            setCount(count+1)
        } else if (count === 1) {
            setHelperTextType(SHOW_HELPER_TEXT2)
            setCount(count+1)
        } else if (count === 2) {
            setHelperTextType(SHOW_HELPER_TEXT3)
            setCount(count+1)
        } else {
            setHelperTextType(null)
        }
    }

    const handleOnBlur = () => {
        setHelperTextType(null)
    }

    const onChangeHandler = (e) => {
        const url = e.target.value
        setUrlValue(url)
        if (requireLoginUrls.includes(url)) {
            setHelperTextType(SHOW_HELPER_NEED_LOGIN)
        }
    }

    return (
        <div className='SearchBarHeaderContainer'>
            <div className='LogoContainer'>
                {/*<h1 style={{fontSize: 24}}>Fetcher<sup style={{fontSize: 12}}> Beta</sup></h1>*/}
                <picture>
                    <source srcSet={fetcherLogoDark} media="(prefers-color-scheme: dark)" />
                        <img src={fetcherLogo} style={{height: 80, cursor: 'pointer'}}
                             onClick={() => window.open('https://fetcher.page', '_blank')}/>
                </picture>
            </div>
            <div className={'SearchBarContainer'}>
                {
                    <div className={helperTextType === SHOW_ERROR ||  helperTextType && showHelperText
                        ? 'HelperText' : 'HelperTextNoText'}>
                        {
                            helperTextType === SHOW_ERROR &&
                            <span style={{color: '#FD766E'}}>
                                Sorry, your url might be invalid, please try a different one.
                            </span>
                        }
                        {
                            helperTextType === SHOW_HELPER_TEXT && showHelperText &&
                            <span>
                                Please <span style={{fontWeight: 'bold'}}>select one of the urls below</span>,
                                or paste a url which we support.
                            </span>
                        }
                        {
                            helperTextType === SHOW_HELPER_TEXT2 && showHelperText &&
                            <span>
                                Replace the wildcards * with some text,
                                e.g <span style={{fontWeight: 'bold'}}>https://reddit.com/r/apple</span>
                            </span>
                        }
                        {
                            helperTextType === SHOW_HELPER_TEXT3 && showHelperText &&
                            <span>
                                One more tip! If you leave this plugin open,
                                we will refresh <span style={{fontWeight: 'bold'}}>every
                                10 minutes</span> and give you updates
                            </span>
                        }
                        {
                            helperTextType === SHOW_HELPER_LOADING && showHelperText &&
                            <span>
                                Good url! Spinning up a browser and loading your url,
                                <span style={{fontWeight: 'bold'}}> please wait......</span>
                            </span>
                        }
                        {
                            helperTextType === SHOW_HELPER_NEED_LOGIN &&
                            <span>
                                Make sure you are <span style={{fontWeight: 'bold'}}> logged in</span> so we can
                                fetch your posts
                            </span>
                        }
                    </div>
                }
                <input
                    className='SearchBar'
                    list="defaultURLs" type={'url'}
                    onKeyDown={handleKeyDown}
                    onChange={onChangeHandler}
                    value={urlValue}
                    onClick={handleOnFocus}
                    onBlur={handleOnBlur}
                />
            </div>
            <datalist id="defaultURLs">
                {availableUrls.sort().map((item, key) =>
                    <option key={key} value={item} />
                )}
            </datalist>
            <div style={{display:'flex', flexDirection: 'row', marginRight: 24}}>
                {/*<img src={refreshIcon} className={'Icon'} onClick={() => scrapeAll(true)}/>*/}
                {/*<img src={crossIcon} className={'Icon'} onClick={() => clearAll()}/>*/}
                <picture>
                    <source srcSet={refreshIconDark} media="(prefers-color-scheme: dark)"/>
                    <img src={refreshIcon} className={'Icon'} onClick={() => scrapeAll(true)}/>
                </picture>
                <picture>
                    <source srcSet={crossIconDark} media="(prefers-color-scheme: dark)" />
                    <img src={crossIcon} className={'Icon'} onClick={() => clearAll()}/>
                </picture>
            </div>
        </div>
    );
};


const mapDispatchToProps = dispatch => {
    return {
        addUrlInfo: (url) => dispatch(addUrlInfo(url)),
        setFirstVisit: (bool) => dispatch(setIsFirstVisit(bool)),
        scrapeAll: (bool) => dispatch(scrapeAll(bool)),
        clearAll: () => dispatch(clearAll()),
    };
};

const mapStateToProps = (state, props) => ({
    urlInfoMap: selectUrlInfoMap(state),
    isFirstVisit: selectIsFirstVisit(state),
    initialData: selectInitialData(state)
});


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchBar);

