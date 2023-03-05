include('LastListCache.js');

class LastListFactory {
    static create(type, meta) {
        let lastListCache = new LastListCache();

        let map = {
            'TAG_TRACKS': { url: `https://www.last.fm/tag/@@parameter@@/tracks`, cacheTime: lastListCache.timeConstants.w },
            'ARTIST_TRACKS': { url: `https://www.last.fm/music/@@parameter@@/+tracks`, cacheTime: lastListCache.timeConstants.m },
            'ARTIST_RADIO': { url: `https://www.last.fm/player/station/music/@@parameter@@`, cacheTime: 0, pages: 2 },
            'ARTIST_SIMILAR': { url: `https://www.last.fm/player/station/music/@@parameter@@/+similar`, cacheTime: 0, pages: 2 },
            'USER_RADIO': { url: `https://www.last.fm/player/station/user/@@parameter@@/library`, cacheTime: 0, pages: 2 },
            'USER_MIX': { url: `https://www.last.fm/player/station/user/@@parameter@@/mix`, cacheTime: 0, pages: 2 },
            'USER_RECOMMENDATIONS': { url: `https://www.last.fm/player/station/user/@@parameter@@/recommended`, cacheTime: 0, pages: 2 },
            'USER_NEIGHBOURS': { url: `https://www.last.fm/player/station/user/@@parameter@@/neighbours`, cacheTime: 0, pages: 2 },
            'TAG_RADIO': { url: `https://www.last.fm/player/station/tag/@@parameter@@`, cacheTime: 0, pages: 2 },
            'USER_LIBRARY': { url: `https://www.last.fm/user/@@parameter@@/library/tracks`, cacheTime: lastListCache.timeConstants.m },
            'USER_LOVED': { url: `https://www.last.fm/user/@@parameter@@/loved`, cacheTime: lastListCache.timeConstants.h },
            'ALBUM_TRACKS': { url: `https://www.last.fm/music/@@parameter@@/@@parameter@@`, cacheTime: lastListCache.timeConstants.y },
            'USER_PLAYLIST': { url: `https://www.last.fm/user/@@parameter@@/playlists/@@parameter@@`, cacheTime: lastListCache.timeConstants.h },
            //'ARTIST_INFO': { url: `https://www.last.fm/music?seed=@@parameter@@`, cacheTime: lastListCache.timeConstants.w },
        };

        // if type is not in map, return null
        if (!(type in map)) {
            return new LastList();
        }

        let lastListArgs = map[type];
        // count number of @@parameter@@ in url
        let parameterCount = (lastListArgs.url.match(/@@parameter@@/g) || []).length;
        // if parameterCount is not equal to meta.length, return null
        if (parameterCount !== meta.length) {
            return new LastList();
        }
        // replace @@parameter@@ with meta
        meta.forEach((parameter) => {
            lastListArgs.url = lastListArgs.url.replace('@@parameter@@', encodeURIComponent(parameter));
        });

        lastListArgs.cacheTime = window.GetProperty('CACHE_TIME_' + type, lastListArgs.cacheTime);
        return new LastList(lastListArgs);
    }
}

