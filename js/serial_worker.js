
/* this is a web worker */

var logs = false;
importScripts('cbor-web.js');

const selfworker = self;

function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new resultConstructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

async function worker() {
    try {
        const ports = await navigator.serial.getPorts();
        if (ports.length == 0) {
            console.log('Couldn\'t find a viable port');
            alert('Failure finding a serial port');
            return;
        }
        const port = ports[0];
        await port.open({baudRate: 115200});
        const reader = port.readable.getReader();
        const writer = port.writable.getWriter();

        selfworker.onmessage = function(msg) {
            writer.write(msg.data);
        };

        let data = new Uint8Array();
        let last_index = 0;
        postMessage('READY');
        while (true) {
            const {value, done} = await reader.read();
            if (done) {
                console.log('serial reader terminated');
                break;
            }

            data = concatenate(Uint8Array, data, value);

            while (data.length >= last_index) {
                try {
                    // read cbor messages one byte at the time as they may be
                    // more concatenated
                    slice_to_try = data.slice(0, last_index);
                    decoded = cbor.decodeAllSync(slice_to_try);
                    if ('error' in decoded[0]) {
                        // error occurred
                        postMessage(decoded);
                    } else if ('result' in decoded[0]) {
                        postMessage(decoded);
                    } else if ('log' in decoded[0]) {
                        if (logs) {
                            const decoder = new TextDecoder('utf-8');
                            decoded = decoder.decode(decoded[0]['log']);
                            console.log(decoded);
                        }
                    } else {
                        console.log('This should never happen?');
                        throw 'This should never happen';
                    }
                    data = data.slice(last_index);
                    last_index = 0;
                } catch (err) {
                    // we didn't find a valid cbor
                    last_index += 1;

                    if (data.length == last_index - 1) {
                        // needs more data from the device
                        break;
                    }
                }
            }
        }
    } catch (err) {
        console.log('Error getting a requested serial port ' + err);
        postMessage(err);
    }
}
// FIXME: I don't like calling an async function like that but it seems to work?
worker();
