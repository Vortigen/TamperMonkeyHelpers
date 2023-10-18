// ==UserScript==
// @name         PlanITpocker helper
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adding helper messages in the JS console. Reloading on signalR disconnect. Votes in JS console preserved.
// @match        https://www.planitpoker.com/board*
// @run-at       document-start
// ==/UserScript==

const replaceScript = `

e.hub.disconnected(function() {
    document.location.reload();
}),

e.hub.received(function(a){
    //console.log(">>> Received", a);
    const isModerator = () => !!$('.pull-right > .btn-group')[0];
    if (isModerator()) return;

    setTimeout(() => {
        if (isModerator()) return;

        if (!window.loaded) {
            window.loaded = true;
            console.clear();
            console.log('---------- PlanITpocker helper v1.1 :) ----------');
            const room = document.location.hash.split('/')?.[2];
            const votesString = window.localStorage['room'] && window.localStorage['room'] === room
                ? (window.localStorage['votes'] || '[]')
                : '[]';

            window.votes = JSON.parse(votesString);
            window.votes.forEach((v) => console.log(v));
            window.stop = () => e.hub.stop();
        }
    }, 2000);

    var voteMap = {'0': 0, '1': '1/2', '2': 1, '3': 2, '4': 3, '5': 5, '6': 8, '7': 13, '8': 20, '9': 40, '10': 100, '-1': '?', '-2': 'coffee'};
    if (a?.M === 'storyVoted') {
        const vote = {
            "userName": a?.A?.[0]?.userName,
            "vote": voteMap['' + a?.A?.[0]?.vote],
        };
        window.votes.push(vote);
        window.localStorage['votes'] = JSON.stringify(window.votes);
        window.localStorage['room'] = document.location.hash.split('/')?.[2];
        console.log(vote);
    }
    if (a?.M === 'storySwitched') {
        window.votes = [];
        window.localStorage['votes'] = '[]';
        window.localStorage['room'] = document.location.hash.split('/')?.[2];
        console.log('---------- Story switched: ' + a?.A?.[0]?.title + ' ----------');
    }
}),

e.hub.connectionSlow`;

(function() {
    'use strict';

    new MutationObserver(async (mutations, observer) => {
        let oldScript = mutations
            .flatMap(e => [...e.addedNodes])
            .filter(e => e.tagName == 'SCRIPT')
            .find(e => e.src.match(/application\.js\?v=1\.0\.0\.32896/));

        if (oldScript) {
            observer.disconnect();
            oldScript.remove();

            let text = await fetch(oldScript.src)
                .then(e => e.text())
                .then(e => e.replace(/e.hub.disconnected.*e\.hub\.connectionSlow/g, replaceScript));

            let newScript = document.createElement('script');
            newScript.type = 'text/javascript';
            newScript.textContent = text;
            document.querySelector('head').appendChild(newScript);
        }
    }).observe(document, {
        childList: true,
        subtree: true,
    })
})();