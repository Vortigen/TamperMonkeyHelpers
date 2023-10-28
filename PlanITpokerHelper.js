// ==UserScript==
// @name         PlanITpocker helper
// @namespace    http://tampermonkey.net/
// @description  Adding helper messages in the JS console. Reloading on signalR disconnect. Votes in JS console preserved.
// @version      1.4
// @match        https://www.planitpoker.com/board*
// @run-at       document-start
// ==/UserScript==

/*
ORIGINAL SCRIPT:
    e.hub.disconnected(function() {
        console.log("disconnected"),
        clearInterval(r),
        setTimeout(function() {
            e.hub.start()
        }, 5e3)
    }),
    e.hub.received(function() {
        console.log("received")
    }),
    e.hub.connectionSlow
*/

const replaceScript = `

e.hub.disconnected(function() {
    document.location.reload();
}),

e.hub.received(function(a){
    console.debug(">>>> Received", a);
    const isModerator = () => !!$('.pull-right > .btn-group')[0];
    if (isModerator()) return;

    const hub = a?.H || ''; // pokerGameHub
    const action = a?.M || '';
    const data = a?.A?.[0] || {};
    console.debug(">>>>", { hub, action, data });

    const init = () => {
        if (isModerator()) return;

        if (!window.loaded) {
            window.loaded = true;
            console.clear();
            console.log('---------- PlanITpocker helper 13.9.2023 :) ----------');
            const room = document.location.hash.split('/')?.[2];
            const actionsString = window.localStorage['room'] && window.localStorage['room'] === room
                ? (window.localStorage['actions'] || '[]')
                : '[]';

            window.actions = JSON.parse(actionsString);
            window.actions.forEach((actionArr) => console.log(...actionArr));

            window.stop = () => e.hub.stop(); // simulate signalR disconnect
            window.cls = () => { // clear actions
                window.loaded = false;
                window.actions = [];
                window.localStorage['actions'] = '[]';
                init();
                return "actions cleared :)";
            };
        }
    };
    (!window.loaded) && setTimeout(init, 2000);

    let actionArr;
    var voteMap = {'0': 0, '1': '1/2', '2': 1, '3': 2, '4': 3, '5': 5, '6': 8, '7': 13, '8': 20, '9': 40, '10': 100, '-1': '?', '-2': 'coffee'};

    if (action === 'storyVoted') {
        actionArr = [{
            "userName": data.userName,
            "vote": voteMap['' + data.vote],
        }];
    }

    if (!action || action === 'userJoinedGame' || action === 'userUserLeftGame' || action === 'userRolesUpdated') {
        return;
    }

    actionArr = actionArr || ['>>>', action, data];
    console.log(...actionArr);

    window.actions = window.actions || [];
    window.actions.push(actionArr);
    window.localStorage['actions'] = JSON.stringify(window.actions);
    window.localStorage['room'] = document.location.hash.split('/')?.[2];
}),

e.hub.connectionSlow`;

(function() {
    'use strict';

    new MutationObserver(async (mutations, observer) => {
        let oldScript = mutations
            .flatMap(e => [...e.addedNodes])
            .filter(e => e.tagName == 'SCRIPT')
            .find(e => e.src.match(/application\.js\?v=1\.0\.0\./));

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
