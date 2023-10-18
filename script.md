// ==UserScript==
// @name         PlanITpocker helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adding helper messages in the JS console. Fixing reconnecting bug.
// @match        https://www.planitpoker.com/board*
// @run-at       document-start
// ==/UserScript==

const replaceScript = `
e.hub.logging=!0,

e.hub.start().done(
    function() {
        // console.log('>> Initial Starting hub done');
        t.publish({
            channel: "board",
            topic: "Hub.Started",
        });
    }
),

e.hub.reconnected(function(){
    // console.log(">>> Reconnected");
}),

e.hub.disconnected(function(){
    // console.log(">>> Disconnected");
    clearInterval(r);
    setTimeout(function(){
        // console.log(">>> Starting hub...");
        e.hub.start().done(
            function() {
                // console.log('>>> Starting hub done');
                // This publish was missing from the original code, and it fixes the no-reconnecting bug
                t.publish({
                    channel: "board",
                    topic: "Hub.Started",
                });
            }
        );
    }, 1000);
}),

e.hub.received(function(a){
    // console.log(">>> Received", a);
    if (!window.loaded) {
        window.loaded = true;
        console.clear();
        console.log('---------- PlanITpocker helper :) ----------');
    }
    var vote = {'0': 0, '1': '1/2', '2': 1, '3': 2, '4': 3, '5': 5, '6': 8, '7': 13, '8': 20, '9': 40, '10': 100, '-1': '?', '-2': 'coffee'};
    if (a?.M === 'storyVoted') {
        console.log({
            "userName": a?.A?.[0]?.userName,
            "vote": vote['' + a?.A?.[0]?.vote],
        });
    }
    if (a?.M === 'storySwitched') {
        console.log('---------- Story switched: ' + a?.A?.[0]?.title + ' ----------');
    }
}),

e.hub.connectionSlow
`;

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
                .then(e => e.replace(/e\.hub\.logging=!0.*e\.hub\.connectionSlow/g, replaceScript));

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
