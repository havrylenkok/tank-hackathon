// this file can be included by browser and node.js app

// передаем ему вебсокет, в ответ получаем удобное апи
// on(action, function) -- socket.io style по обработке входящих событий
// emit(action, data) -- опять-таки socket.io style по отправке сообщений
// удобные высокоуровневые функции - Authorize, Input, Map
var wrapWebsocketConnection = function(ws, config) {
    var functions = {};

    // своего рода роутер.
    var processEvent = function(event) {
        if (config.debug)
            console.log("ws.debug:", event);

        if (!event.error) {
            var action = event.action;
            if (functions[action]) {
                functions[action](event.data);
            }
            else if (action != "error")
                processEvent({action: "error", data: { error: "unhandled message: "+action } });
            else
                console.log("unhandled error", event);
        }
        else // recurse
            processEvent({action: "error", data: event});
    };

    // это события обычных вебсокетов, преобразуем их в наши роутеросовместимые события
    ws.onopen = function() { processEvent( {action: "open", data: {}} ); };
    ws.onclose = function(event) {
        // event.wasClean, event.code, event.reason
        processEvent( {action: "close", data: event} );
    };
    ws.onerror = function(err) { processEvent( {action: "error", data: err} ); };

    // принимаем мессадж в сыром виде. парсим. и на роутер.
    ws.onmessage = function (event) {
        //console.log("incoming: ",event);
        var parsedData = { error : "failed to parse", data: event.data};
        try { parsedData = (JSON.parse(event.data)) } catch (e) { console.log("JSON PARSE ISSUE: ",e); }
        if (!parsedData.action)
            parsedData = {
                error: 'Expected to receive something like {"action":"Authorize", "data": {...} } but got: ' + event.data,
                data:  event.data
            };
        processEvent(parsedData);
    };

    // оформляем, стрингифицируем - и отправляем на тот конец.
    var send = function(action, data, callback, justStringify) {
        var toSend = data;
        if (!(typeof data === 'string' || data instanceof String))
            toSend = JSON.stringify({
                action: action,
                data: data
            });

        if (justStringify)
            return toSend;

        ws.send(toSend, function(e) { if (callback) {callback(e);} });
    };

    // а это собственно то что мы возвращаем, наше высокоуровневое API
    return {
        // predefined: open, close, error
        on: function(action, func) {
            functions[action] = func;
        },
        emit: function(action, data, callback, justStringify) {
            return send(action, data, callback, justStringify)
        },
        Authorize: function(user, pass, mode, callback) {
            send("Authorize",{
                    user: user,
                    pass: pass,
                    mode: mode
                }, callback);
        },
        Input: function(moveXY, gunXY, fire, callback) {
            send("Input",{
                        "move-xy": moveXY,
                        "gun-xy": gunXY,
                        "fire": fire
                    }, callback);
        },
        Map: function(mapObject, callback) {
            send("Map",mapObject, callback);
        },
        close: function() {
            ws.close();
        }
    }
};

// если нода - добавить функцию в module.exports
// подумалось что это самый логичный способ, возможно все можно сделать проще.
var isUnderNode = (typeof process === 'object' && process + '' === '[object process]');
if (isUnderNode)
    module.exports.wrapWebsocketConnection = wrapWebsocketConnection;
