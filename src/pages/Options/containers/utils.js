
export const getTitleFromUrlInfo = (urlInfo) => urlInfo ?
    `${urlInfo.name}${urlInfo.wildcard ? ` - ${urlInfo.wildcard}` : ''}` : ''

