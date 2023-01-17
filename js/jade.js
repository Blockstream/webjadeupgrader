const jade = Object();

// UI Elements
const main = document.querySelector('main');
const jadeImage = document.querySelector('.jade-img');

const showfirmwaresBtn = document.getElementById('showfirmwares');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');

const jadeDeviceImg = document.getElementById('jade-device-img');
const usbCableImg = document.getElementById('usb-cable-img');
const usbCablePluggedImg = document.getElementById('usb-cable-plugged-img');
const jadeDeviceUnlock = document.getElementById('jade-device-unlock-img');
const jadeDeviceConfirm = document.getElementById('jade-device-confirm-img');
const jadeDeviceUpdating = document.getElementById('jade-device-updating-img');
const jadeDeviceError = document.getElementById('jade-device-error-img');
const retryBtn = document.getElementById('retry-btn');
const spinner = document.getElementById('spinner');
// const arrow = document.getElementById('arrow-down');
const logsBtn = document.getElementById('logs-btn');
const jadeDeviceConfirmVer = document.getElementById('jade-device-confirm-img');
const blcksServBtns = document.querySelectorAll('.blcks-serv');
const blockTag = document.getElementById('block-tag');


const changefirmware = document.getElementById('changefirmware');
const showAllBtn = document.getElementById('showall-btn');
const firmware_selected = document.getElementById('firmware_selected');
const firmware_available = document.getElementById('firmware_available');

showfirmwaresBtn.addEventListener('click', () => {
    title.innerText =
        'Connect your Jade wallet and update to the latest version';
    subtitle.innerText = 'Waiting to connect your hardware wallet';
    showfirmwaresBtn.style.display = 'none';
    jadeDeviceError.style.display = 'none';
    retryBtn.style.display = 'none';
    jadeDeviceImg.style.display = 'block';
    usbCableImg.style.display = 'block';
});

function addPinCode() {
    title.innerText = 'Unlock your Jade';
    subtitle.innerText = 'Enter your PIN in Jade to continue';
    jadeDeviceImg.style.display = 'none';
    usbCableImg.style.display = 'none';
    jadeDeviceUnlock.style.display = 'block';
}

function afterPinCode() {
    jadeDeviceError.style.display = 'none';
    retryBtn.style.display = 'none';
    title.innerText = 'Scanning for new versions...';
    subtitle.innerText = '';
    subtitle.style.display = 'none';
    jadeDeviceUnlock.style.display = 'none';
    spinner.style.display = 'block';
}

function versionIsUpToDate() {
    jadeDeviceError.style.display = 'none';
    retryBtn.style.display = 'none';
    jadeDeviceUnlock.style.display = 'none';
    spinner.style.display = 'none';
    title.innerText = 'Your Jade is already up to date!';
    changefirmware.style.display = 'block';
    showAllBtn.style.display = 'none';
}

function clearAfterPin() {
    jadeDeviceError.style.display = 'none';
    retryBtn.style.display = 'none';
    jadeDeviceUnlock.style.display = 'none';
    spinner.style.display = 'none';
    title.innerText = 'Select Firmware Version';
    subtitle.style.display = 'none';
    firmware_available.style.display = 'block';
    changefirmware.style.display = 'none';
    showAllBtn.style.display = 'block';
}

function confirmVersion() {
    const checked = document.querySelector('input[name="firmwares"]:checked');
    jadeDeviceConfirm.style.display = 'block';
    jadeDeviceError.style.display = 'none';
    retryBtn.style.display = 'none';
    spinner.style.display = 'block';
    title.innerText = 'Confirm version on Jade';
    const node = document.createElement('span');
    const textnode = document.createTextNode('Hash: ' + hashInfo);
    node.appendChild(textnode);
    subtitle.innerText =
        `Firmware Version: ${checked.getAttribute('data-version')} ${
            checked.getAttribute('data-config') === 'ble' ?
                'Bluetooth Enabled' :
                'No-Radio'}`;
    subtitle.appendChild(node);
    subtitle.style.display = 'block';
    // arrow.style.display = 'block';
    firmware_available.style.display = 'none';
    showAllBtn.style.display = 'none';
}

function updatingVersion() {
    jadeDeviceConfirm.style.display = 'none';
    jadeDeviceUpdating.style.display = 'block';
    title.innerText = 'Updating Firmware...';
    // arrow.style.display = 'none';
    subtitle.style.display = 'none';
}

function errorScreen() {
    jadeDeviceImg.style.display = 'none';
    usbCableImg.style.display = 'none';
    jadeDeviceUnlock.style.display = 'none';
    jadeDeviceUpdating.style.display = 'none';
    jadeDeviceConfirm.style.display = 'none';
    jadeDeviceError.style.display = 'block';
    title.innerText = 'Action declined on Jade';
    retryBtn.style.display = 'flex';
    subtitle.style.display = 'none';
    spinner.style.display = 'none';
    showAllBtn.style.display = 'none';
    main.style.height = 'calc(100vh - 250px)';
    jadeImage.style.bottom = 'auto';
    logsBtn.style.display = 'none';
    document.querySelector('footer').style.maxHeight = '250px';
    document.querySelectorAll('.wallets')
        .forEach(i => i.classList.add('hidden'));
    blockTag.style.display = 'none';
    blcksServBtns.forEach(i => {
        i.style.backgroundColor = 'none';
        i.style.borderColor = '#fff';
    });
}

function finalScreen(checked) {
    main.style.height = '35vh';
    jadeImage.style.bottom = '-30vh';
    title.innerText = 'Updated!';
    subtitle.innerText =
        `Your Jade is now on version ${checked.getAttribute('data-version')}`;
    subtitle.style.display = 'block';
    spinner.style.display = 'none';
    jadeDeviceImg.style.display = 'none';
    jadeDeviceUpdating.style.display = 'none';
    // arrow.style.display = 'none';
    logsBtn.style.display = 'block'
    document.querySelector('footer').style.maxHeight = 'none';
    document.querySelectorAll('.wallets')
        .forEach(i => i.classList.remove('hidden'));
    blockTag.style.display = 'block';
    blcksServBtns.forEach(i => {
        i.style.backgroundColor = '#00B45A';
        i.style.borderColor = '#00B45A';
    });
}

// End UI Elements

jade.start = function(onsuccess, onfailure) {
    if (typeof (serial_worker) == 'undefined') {
        serial_worker = new Worker('js/serial_worker.js');
        serial_worker.onmessage = function(event) {
            if (event.data == 'READY') {
                console.log('READY-11');
                addPinCode();

                onsuccess();
            } else {
                onfailure(event.data);
            }
        };
    }
};

jade.unlock = function(fetchUrl, onsuccess, network) {
    serial_worker.onmessage = function(event) {
        const msg = event.data[0]['result'];
        if (msg === true) {
            afterPinCode();

            setTimeout(() => {
                clearAfterPin();
                onsuccess();
            }, 2000);
            return;
        } else if (msg === false) {
            errorScreen();
        } else {
            // FIXME: do something on failure?
            // pretty weird that "msg" could be undefine
        }
        fetchUrl(
            msg['http_request']['params']['urls'][0],
            function(data) {
                const encoded = cbor.encode({
                    'id': '0',
                    'method': msg['http_request']['on-reply'],
                    'params': JSON.parse(data)
                });
                serial_worker.postMessage(encoded);
            },
            function() {
                console.log('Error occurred');
                console.log(msg);
                errorScreen();
            },
            'POST', JSON.stringify(msg['http_request']['params']['data']));
    };
    // send initial request to unlock
    // const epoch = Math.floor(Date.now() / 1000);
    //, 'epoch': epoch}
    const encoded = cbor.encode(
        {'id': '0', 'method': 'auth_user', 'params': {'network': network}});
    serial_worker.postMessage(encoded);
};

jade.get_xpub = function(onsuccess, network) {
    serial_worker.onmessage = function(event) {
        const decoded = event.data;
        if ('result' in decoded[0]) {
            const version_info = decoded[0]['result'];
            console.log(version_info);
            onsuccess(version_info);
        }
        // else {
        //     // FIXME: do something on failure?
        //     errorScreen();
        // }
    };
    const encoded = cbor.encode({
        'id': '0',
        'method': 'get_xpub',
        'params': {'network': network, 'path': [0]}
    });
    serial_worker.postMessage(encoded);
};

jade.get_version_info = function(onsuccess) {
    serial_worker.onmessage = function(event) {
        decoded = event.data;
        if ('result' in decoded[0]) {
            version_info = decoded[0]['result'];
            onsuccess(version_info);
        }
        // else {
        //     // FIXME: do something on failure?
        //     errorScreen();
        // }
    };
    const encoded = cbor.encode({'id': '0', 'method': 'get_version_info'});
    serial_worker.postMessage(encoded);
};

jade.ota = function(
    ota_max_chunk, binary_fw, hash, fwsize, patchsize, onsuccess, progress) {
    var last_index = 0;
    var ota_complete = false;
    let counter = 0;

    serial_worker.onmessage = function(event) {
        confirmVersion();

        counter++;

        if (counter > 3) {
            // console.log('User Confirmed Update');
            updatingVersion();
        }
        if (event.data.name === 'NetworkError') {
            errorScreen();
        }
        // console.log(event.data.name === "NetworkError" )
        if ('error' in event.data[0]) {
            // user decided to deny upgrade?
            console.log(event.data[0]['error']['code']);
            console.log(event.data[0]['error']['message']);
            errorScreen();

            // alert(event.data[0]['error']['message']);
            return;
        }
        const slice = binary_fw.slice(last_index, last_index + ota_max_chunk);
        if (slice.byteLength > 0) {
            const encoded =
                cbor.encode({'id': '0', 'method': 'ota_data', 'params': slice});
            last_index = last_index + ota_max_chunk;
            serial_worker.postMessage(encoded);
        } else if (!ota_complete) {
            const encoded = cbor.encode({
                'id': '0',
                'method': 'ota_complete',
            });
            serial_worker.postMessage(encoded);
            ota_complete = true;
        } else {
            onsuccess();
        }
        progress(last_index);
    };
    const encoded = cbor.encode({
        'id': '0',
        'method': patchsize ? 'ota_delta' : 'ota',
        'params': {
            'fwsize': parseInt(fwsize),
            'cmpsize': binary_fw.byteLength,
            'cmphash': hash,
            'patchsize': patchsize
        }
    });
    serial_worker.postMessage(encoded);
};
