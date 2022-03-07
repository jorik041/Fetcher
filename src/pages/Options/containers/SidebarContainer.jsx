import React, {useEffect, useState} from "react";
import { connect } from 'react-redux';
import { sidebarRemoveUrl, selectUrlInfoMap} from "../reducers/sidebar.duck";
import {getTitleFromUrlInfo} from "./utils";
import '../styles/Sidebar.css';
import {IS_LOADING, selectUrlToNewHtmlCount} from "../reducers/mainpanel.duck";
import spinner from '../../../assets/img/oval.svg';
import spinnerDark from '../../../assets/img/oval_dark.svg';
import refreshIconDark from "../../../assets/img/refresh_dark.svg";
import refreshIcon from "../../../assets/img/refresh.svg";

const SidebarContainer = ({removeUrl, urlInfo, newHtmlCount}) => {

    const [isDeleting, setIsDeleting] = useState(false)
    const title = getTitleFromUrlInfo(urlInfo)

    return (
        <div key={urlInfo.url} style={{display: 'inline-block'}}>
            <div className={'SidebarSmallContainer'}>
                <img style={{width: 16, height: 16, paddingRight: 6}} src={urlInfo.favicon}/>
                <span
                    style={{cursor: 'pointer', paddingRight: 4}}
                    onClick={() => {
                        const offset = 220; // sticky nav height
                        var el = document.getElementById(`id-${title}`)
                        el && window.scroll({ top: (el.offsetTop - offset), left: 0, behavior: 'smooth' });
                        var carousel = document.getElementById(`scrolling-id-${title}`)
                        carousel && carousel.scroll({left: 0, behavior: 'smooth'})
                    }}
                >
                    {`${title}${(newHtmlCount && newHtmlCount !== IS_LOADING && newHtmlCount > 0) ? ` (${newHtmlCount})` : ''}`}
                </span>
                {
                    (newHtmlCount && newHtmlCount === IS_LOADING) ?
                        <picture>
                            <source srcSet={spinnerDark} media="(prefers-color-scheme: dark)"/>
                            <img src={spinner} style={{height: 18, marginRight: 4}}/>
                        </picture>
                        : ''
                }
                {
                    isDeleting ?
                    <img src={spinner} style={{height: 18}}/> :
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        setIsDeleting(true)
                        removeUrl(urlInfo.url)
                    }}>&#10006;</span>
                }
            </div>
        </div>
    )
};


const mapDispatchToProps = dispatch => {
    return {
        removeUrl: (url) => dispatch(sidebarRemoveUrl(url))
    };
};

const mapStateToProps = (state, props) => ({
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SidebarContainer);

