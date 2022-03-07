import React, {useEffect, useState, useRef} from "react";
import { connect } from 'react-redux';
import {
    IS_LOADING,
    hideHtmlHash,
    selectHtmlHashStringsByUrl, selectHtmlHashToHtmlDecoratedMapByUrl
} from "../reducers/mainpanel.duck";
import {ScrollingCarousel} from "../components/scroller/scrolling-carousel";
import {getTitleFromUrlInfo} from "./utils";
import '../styles/ResultContainer.css';
import arrowRight from '../../../assets/img/arrow-right.svg' ;
import arrowRightDark from '../../../assets/img/arrow-right_dark.svg' ;

const MAX_NUMBER_SHOWN = 50

const renderButton = (direction) =>
    direction === 'left' ?
        <button className={'ActionButton'}>
            <span className={'rotate'}>
                <picture>
                    <source srcSet={arrowRightDark} media="(prefers-color-scheme: dark)" />
                        <img src={arrowRight}/>
                </picture>
            </span>
        </button>
        :
        <button className={'ActionButton'}>
            <picture>
                <source srcSet={arrowRightDark} media="(prefers-color-scheme: dark)" />
                <img src={arrowRight}/>
            </picture>
        </button>

const ResultContainer = ({url, urlInfo, newHtmlCount, htmlHashStrings, htmlHashToHtmlDecoratedMap, hideHtmlHash}) => {

    const responsive = {
        superLargeDesktop: {
            // the naming can be any, depends on you.
            breakpoint: { max: 4000, min: 3000 },
            items: 5
        },
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 3
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 2
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1
        }
    };
    const title = getTitleFromUrlInfo(urlInfo)
    return (
        <div>
            <div style={{display:'flex', flexDirection:'column', paddingBottom: 36}}>
                {
                    <div key={url}>
                        <div className={'ResultHeaderContainer'}>
                            <img key={urlInfo.favicon} style={{width: 24, height: 24, paddingRight: 8}} src={urlInfo.favicon}/>
                            <h2 id={`id-${title}`} style={{fontSize: '0.875em'}}>{`${title}${newHtmlCount && newHtmlCount !== IS_LOADING? ` (${newHtmlCount})` : ''}`}</h2>
                        </div>
                        <div>
                            <ScrollingCarousel id={`scrolling-id-${title}`} responsive={responsive} dynamic={true} rightIcon={renderButton('right')} leftIcon={renderButton('left')}>
                                { (htmlHashStrings.slice(0, MAX_NUMBER_SHOWN)).map((htmlHash) =>
                                    htmlHashToHtmlDecoratedMap[htmlHash] &&
                                    <div key={htmlHash} className={'ResultContainer'}>
                                        <div dangerouslySetInnerHTML={{__html: htmlHashToHtmlDecoratedMap[htmlHash]}}/>
                                        <span style={{fontSize: 24, cursor: 'pointer', paddingLeft: 8, zIndex: 1}} onClick={() => hideHtmlHash(url, htmlHash)}>&#10006;</span>
                                    </div>
                                )}
                            </ScrollingCarousel>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};


const mapDispatchToProps = dispatch => {
    return {
        hideHtmlHash: (url, htmlHash) => dispatch(hideHtmlHash(url, htmlHash)),
    };
};

const mapStateToProps = (state, props) => ({
    htmlHashToHtmlDecoratedMap: selectHtmlHashToHtmlDecoratedMapByUrl(state, props.url),
    // htmlHashToHtmlDecoratedMap: selectHtmlHashToHtmlDecoratedMap(state, props.url),
    htmlHashStrings: selectHtmlHashStringsByUrl(state, props.url)
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResultContainer);

