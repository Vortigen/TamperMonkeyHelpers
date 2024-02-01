// ==UserScript==
// @name         2024 PlanITpocker helper
// @namespace    http://tampermonkey.net/
// @description  Adding helper messages in the JS console.
// @version      3.0
// @match        https://app.planitpoker.com/room/*
// @run-at       document-start
// ==/UserScript==

/* eslint-disable prettier/prettier */
// unsafeWindow.WebSocket hook /////////////////////////////////////////////////////////////////////

const wsUrlMatch = '.firebaseio.com/.ws?v=';
let board = {};

const wsReceive = function(msg, url, wsObject) {
    // console.debug(">>> Received message from " + url + " : " + msg.data);
    if (!url.includes(wsUrlMatch)) return msg;

    let data = JSON.parse(msg.data);
    console.debug(msg.data, data);

    if (data?.t !== 'd' || !data?.d) return msg;

    // Board
    if (data.d.b?.d?.users && data.d.b?.d?.name) {
        board = data.d.b.d;
        console.debug('>>> Board received', board);
    }

    // Votes
    if (data.d.a === 'm' && !!data.d.b?.p && !!data.d.b?.d?.voted_at) {
        const id = data.d.b.p.split('/');
        const userId = id[0] === 'rooms' && id[2] === 'users' ? id[3] : 'Unknown';
        const userName = board.users?.[userId]?.name || userId;
        const vote = data.d.b.d.vote;

        let voteMap = {
            'scrum': {'0': 0, '1': '1/2', '2': 1, '3': 2, '4': 3, '5': 5, '6': 8, '7': 13, '8': 20, '9': 40, '10': 100, '-1': '?', '-2': 'Coffee'},
            'fibonacci': {'0': 0, '1': 1, '2': 2, '3': 3, '4': 5, '5': 8, '6': 13, '7': 21, '8': 34, '9': 55, '10': 89, '-1': '?', '-2': 'Coffee'},
            'sequential': {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '-1': '?', '-2': 'Coffee'},
            'playing-cards': {'0': 'Ace', '1': 2, '2': 3, '3': 5, '4': 8, '5': 'King', '-1': '?', '-2': 'Coffee'},
            't-shirt': {'0': 'XS', '1': 'S', '2': 'M', '3': 'L', '4': 'XL', '5': 'XXL', '-1': '?', '-2': 'Coffee'},
        };
        if (board.deck === 'custom-deck') {
            voteMap = {
                ...voteMap,
                'custom-deck': {
                    ...Object.keys(board.cards).reduce((acc, card) => ({ ...acc, ['' + card]: board.cards[card].text }), {}),
                    '-1': '?',
                    '-2': 'Coffee',
                }
            }
        }

        console.log(`>>> Vote [${userName}]: ${voteMap[board.deck][vote]}`);
    }

    // Stories
    if (data.d.a === 'm' && !!data.d.b?.p?.includes('/stories/') && !!data.d.b?.d?.started_at) {
        const id = data.d.b.p.split('/');
        const storyId = id[0] === 'rooms' && id[2] === 'stories' ? id[3] : '0';
        const storyName = board.stories[storyId]?.text;

        console.log(`>>> Story [${Number(storyId) + 1}/${Object.keys(board.stories).length}]: ${storyName}`);
    }

    return msg;
}

const wsSend = function(data, url, wsObject) {
    // console.debug(">>> Sending message to " + url + " : " + data);
    return data;
}

function MutableMessageEvent (o) {
    this.bubbles = o.bubbles || false;
    this.cancelBubble = o.cancelBubble || false;
    this.cancelable = o.cancelable || false;
    this.currentTarget = o.currentTarget || null;
    this.data = o.data || null;
    this.defaultPrevented = o.defaultPrevented || false;
    this.eventPhase = o.eventPhase || 0;
    this.lastEventId = o.lastEventId || '';
    this.origin = o.origin || '';
    this.path = o.path || new Array(0);
    this.ports = o.parts || new Array(0);
    this.returnValue = o.returnValue || true;
    this.source = o.source || null;
    this.srcElement = o.srcElement || null;
    this.target = o.target || null;
    this.timeStamp = o.timeStamp || null;
    this.type = o.type || 'message';
    this.__proto__ = o.__proto__ || MessageEvent.__proto__;
}

const _WS = unsafeWindow.WebSocket;
unsafeWindow.WebSocket = function(url, protocols) {
    let WSObject = {};
    this.url = url;
    this.protocols = protocols;
    if (!this.protocols) {
        WSObject = new _WS(url);
    } else {
        WSObject = new _WS(url, protocols);
    }

    const _send = WSObject.send;
    WSObject.send = function(data) {
        arguments[0] = wsSend(data, WSObject.url, WSObject) || data;
        _send.apply(this, arguments);
    }

    WSObject._addEventListener = WSObject.addEventListener;
    WSObject.addEventListener = function() {
        const eventThis = this;
        if (arguments[0] === 'message') {
            arguments[1] = (
                function (userFunc) {
                    return function instrumentAddEventListener () {
                        arguments[0] = wsReceive(new MutableMessageEvent(arguments[0]), WSObject.url, WSObject);
                        if (arguments[0] === null) return;
                        userFunc.apply(eventThis, arguments);
                    };
                }
            )(arguments[1]);
        }
        return WSObject._addEventListener.apply(this, arguments);
    }

    Object.defineProperty(WSObject, 'onmessage', {
        set: function () {
            const eventThis = this;
            const userFunc = arguments[0];
            const onMessageHandler = function () {
                arguments[0] = wsReceive(new MutableMessageEvent(arguments[0]), WSObject.url, WSObject);
                if (arguments[0] === null) return;
                userFunc.apply(eventThis, arguments);
            }
            WSObject._addEventListener.apply(this, ['message', onMessageHandler, false]);
        }
    });

    return WSObject;
}
