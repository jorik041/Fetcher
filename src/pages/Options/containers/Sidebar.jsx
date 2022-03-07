import React, {useEffect, useState} from "react";
import { connect } from 'react-redux';
import { sidebarRemoveUrl, selectUrlInfoMap} from "../reducers/sidebar.duck";
import {getTitleFromUrlInfo} from "./utils";
import '../styles/Sidebar.css';
import {selectUrlToNewHtmlCount} from "../reducers/mainpanel.duck";
import SidebarContainer from "./SidebarContainer";

const Sidebar = ({urlInfoMap, urlToNewHtmlCount}) => {

    return (
        <div className='SidebarContainer'>
            <div>
                {Object.keys(urlInfoMap).map(url =>{
                    const urlInfo = urlInfoMap[url]
                    const newHtmlCount = urlToNewHtmlCount[url]
                    return (
                        <SidebarContainer key={url} newHtmlCount={newHtmlCount} urlInfo={urlInfo} />
                    )
                })}
            </div>
        </div>
    );
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

const mapStateToProps = (state, props) => ({
    urlInfoMap: selectUrlInfoMap(state),
    urlToNewHtmlCount: selectUrlToNewHtmlCount(state),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Sidebar);

