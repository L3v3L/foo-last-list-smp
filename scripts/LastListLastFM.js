include('LastListCache.js');

class LastListLastFM {
    static buildUrl(type, meta) {
        let lastListCache = new LastListCache();
        if (meta.length == 1) {
            switch (type) {
                case 'TAG_TRACKS':
                    return { url: `https://www.last.fm/tag/${encodeURIComponent(meta[0])}/tracks`, cacheTime: window.GetProperty('CACHE_TIME_' + type, lastListCache.timeConstants.w), pages: 1 }
                case 'ARTIST_TRACKS':
                    return { url: `https://www.last.fm/music/${encodeURIComponent(meta[0])}/+tracks`, cacheTime: window.GetProperty('CACHE_TIME_' + type, lastListCache.timeConstants.m), pages: 1 }
                case 'ARTIST_RADIO':
                    return { url: `https://www.last.fm/player/station/music/${encodeURIComponent(meta[0])}`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'ARTIST_SIMILAR':
                    return { url: `https://www.last.fm/player/station/music/${encodeURIComponent(meta[0])}/+similar`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'USER_RADIO':
                    return { url: `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/library`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'USER_MIX':
                    return { url: `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/mix`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'USER_RECOMMENDATIONS':
                    return { url: `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/recommended`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'USER_NEIGHBOURS':
                    return { url: `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/neighbours`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'TAG_RADIO':
                    return { url: `https://www.last.fm/player/station/tag/${encodeURIComponent(meta[0])}`, cacheTime: window.GetProperty('CACHE_TIME_' + type, 0), pages: 2 }
                case 'USER_LIBRARY':
                    return { url: `https://www.last.fm/user/${encodeURIComponent(meta[0])}/library/tracks`, cacheTime: window.GetProperty('CACHE_TIME_' + type, lastListCache.timeConstants.m), pages: 1 }
                case 'USER_LOVED':
                    return { url: `https://www.last.fm/user/${encodeURIComponent(meta[0])}/loved`, cacheTime: window.GetProperty('CACHE_TIME_' + type, lastListCache.timeConstants.h), pages: 1 }
                default:
                    return { url: null, cacheTime: 0, pages: 1 }
            }
        }

        if (meta.length == 2) {
            switch (type) {
                case 'ALBUM_TRACKS':
                    return { url: `https://www.last.fm/music/${encodeURIComponent(meta[0])}/${encodeURIComponent(meta[1])}`, cacheTime: window.GetProperty('CACHE_TIME_' + type, lastListCache.timeConstants.y), pages: 1 }
                case 'USER_PLAYLIST':
                    return { url: `https://www.last.fm/user/${encodeURIComponent(meta[0])}/playlists/${encodeURIComponent(meta[1])}`, cacheTime: window.GetProperty('CACHE_TIME_' + type, lastListCache.timeConstants.h), pages: 1 }
                default:
                    return { url: null, cacheTime: 0, pages: 1 }
            }
        }

        return { url: null, cacheTime: 0, pages: 1 };
    }
}

