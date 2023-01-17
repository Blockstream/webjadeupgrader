const fwurl = 'https://jadefw.blockstream.com/bin/';

const development =
    location.href.split('https://jadefw.blockstream.com').length == 1;


let hashInfo;
let agreeToChangeVersion = false;
let args;

// FIXME: use
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
function fetchUrl(url, cb, cberr, http_type, parameters) {
    var xmlHttp = new XMLHttpRequest();
    const devcorsproxyurl = 'https://cors-anywhere.herokuapp.com/' + url;
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            cb(xmlHttp.responseText);
        } else {
            if (cberr && xmlHttp.status != 200 && xmlHttp.status != 0) {
                console.log('fetchUrl failed ' + xmlHttp.status);
                cberr(xmlHttp.status);
            }
        }
    };
    xmlHttp.open(http_type, development ? devcorsproxyurl : url, true);

    try {
        xmlHttp.send(parameters);
    } catch (err) {
        cberr(err);
    }
}

function fetchBinaryUrl(url, cb) {
    const devcorsproxyurl = 'https://cors-anywhere.herokuapp.com/' + url;
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.responseType = 'arraybuffer';

    xmlHttp.onload = function() {
        cb(xmlHttp.response);
        ['message']
    };
    xmlHttp.open('GET', development ? devcorsproxyurl : url, true);
    xmlHttp.send(null);
}

function detectJadeType(version_info) {
    if (version_info['JADE_FEATURES'] == 'DEV') {
        // dev board
        if (version_info['BOARD_TYPE'] == 'JADE_V1.1') {
            return 'jade1.1dev';
        } else if (version_info['BOARD_TYPE'] == 'JADE') {
            return 'jadedev';
        }
    } else if (version_info['JADE_FEATURES'] == 'SB') {
        // prod jade
        if (version_info['BOARD_TYPE'] == 'JADE_V1.1') {
            return 'jade1.1';
        } else if (version_info['BOARD_TYPE'] == 'JADE') {
            return 'jade';
        }
    }
    throw 'Jade not detected';
}

function fetch_ota_options(version_info, cb) {
    const jadeurl = detectJadeType(version_info);
    console.log('Pin is correct. Unlocked');
    fetchUrl(
        fwurl + jadeurl + '/index.json',
        function(success_data) {
            const jsonReply = JSON.parse(success_data);
            cb(jsonReply, jadeurl);
        },
        function(failure) {
            console.log(failure);
            alert('Url failed');
        },
        'GET', null);
}

function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function on_firmware_selected(event) {
    const checked = document.querySelector('input[name="firmwares"]:checked');
    if (checked === null || undefined) {
        alert('Please, choose the version and try again');
        return;
    }
    const ota_max_chunk = parseInt(checked.getAttribute('max_chunk'));
    const jadeurl = checked.getAttribute('jadeurl');

    firmware_selected.classList.add('hidden');

    firmware_available.classList.add('hidden');
    const url = fwurl + jadeurl + '/' + checked.id;
    fetchBinaryUrl(url, function(binary_fw) {
        const div = document.createElement('DIV');
        div.classList.add('progress');

        const progress = document.createElement('PROGRESS');

        progress.innerHTML = '0%';
        progress.setAttribute('id', 'fwprogress');
        progress.setAttribute('max', binary_fw.byteLength);
        progress.setAttribute('value', 0);

        const fw_flashing = document.querySelector('.jade-device');
        fw_flashing.appendChild(div);
        div.appendChild(progress);

        const hash = crypto.subtle.digest('SHA-256', binary_fw);
        hash.then(function(h) {
            hashInfo = buf2hex(h);
            const onsuccess = function() {
                progress.style.display = 'none';
                finalScreen(checked);
            };
            const onprogress = function(last_index) {
                const fw_progress = document.getElementById('fwprogress');
                fw_progress.setAttribute('value', last_index);
            };

            if (checked.id.includes('delta')) {
                jade.ota(
                    ota_max_chunk, binary_fw, h,
                    parseInt(checked.id.split('_')[6]),
                    parseInt(checked.id.split('_')[7]), onsuccess, onprogress)
            } else {
                jade.ota(
                    ota_max_chunk, binary_fw, h,
                    parseInt(checked.id.split('_')[2]), null, onsuccess,
                    onprogress)
            }
        });
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    if ('serial' in navigator) {
        const notSupported = document.getElementById('notSupported');
        notSupported.classList.add('hidden');
        const showfirmwares = document.getElementById('showfirmwares');
        showfirmwares.classList.remove('hidden');
    }
});

function display_fw_html(item, fw_available, jadeurl, category) {
    item.forEach(i => {
        const div = document.createElement('DIV');
        const radio = document.createElement('INPUT');
        radio.setAttribute('type', 'radio');
        radio.setAttribute('id', i.filename);
        radio.setAttribute('name', 'firmwares');
        radio.setAttribute('max_chunk', version_info['JADE_OTA_MAX_CHUNK']);
        radio.setAttribute('jadeurl', jadeurl);
        radio.setAttribute('data-version', i.version);
        radio.setAttribute('data-config', i.config);
        const label = document.createElement('LABEL');
        label.innerHTML = `
        <span class="ct-label ct-${category}">${category}</span>
        <span class="ct-title">${i.version} ${
            i.config === 'ble' ? 'Bluetooth Enabled' :
                                 'No-Radio'} (${i.type})</span>
        <span class="ct-desc">${
            i.config === 'ble' ?
                'Choose this version to interact with Jade using Bluetooth, USB and QR.' :
                'Choose this version to interact with Jade using USB and QR. Bluetooth communications will be disabled.'}</span>
        `;
        label.setAttribute('for', i.filename);
        radio.addEventListener(
            'click', () => firmware_selected.classList.remove('hidden'));
        div.appendChild(radio);
        div.appendChild(label);
        fw_available.appendChild(div);
    });
}

function display_fw_category(version_info, jsonReply, category, jadeurl) {
    const fw_available = document.getElementById('firmware_available');

    const config = version_info['JADE_CONFIG'].toLowerCase();

    const delta = jsonReply[category].delta;
    const full = jsonReply[category].full;

    let allFromCategory = [];
    const priority = {ble: 2, noradio: 1};

    for (const conf in delta) {
        if (config == delta[conf].from_config &&
            delta[conf].from_version == version_info['JADE_VERSION']) {
            delta[conf].type = 'delta';
            allFromCategory = [...allFromCategory, delta[conf]];
            // allFromCategory.sort((a, b) => priority[b.config] -
            // priority[a.config]);
        }
    }
    for (const conf in full) {
        full[conf].type = 'full';
        allFromCategory = [...allFromCategory, full[conf]];
        // allFromCategory.sort((a, b) => priority[b.config] -
        // priority[a.config]);
    }

    display_fw_html(allFromCategory, fw_available, jadeurl, category);
}

function display_only_stable(version_info, jsonReply, jadeurl) {
    if (agreeToChangeVersion === false) {
        if (version_info['JADE_VERSION'].includes(
                jsonReply.stable.full[0].version)) {
            versionIsUpToDate();
            args = [version_info, jsonReply, jadeurl];
        } else {
            display_fw_category(version_info, jsonReply, 'stable', jadeurl);
        }
    } else {
        display_fw_category(version_info, jsonReply, 'stable', jadeurl);
    }
}

function display_info(version_info, jsonReply, jadeurl) {
    display_fw_category(version_info, jsonReply, 'beta', jadeurl);
    display_fw_category(version_info, jsonReply, 'previous', jadeurl);
}

function showAll() {
    showAllBtn.style.display = 'none';
    // Need to rewrite the function below to follow DRY priciple

    jade.get_version_info(function(version_info) {
        const state = version_info['JADE_STATE'];
        if (state == 'UNINIT' || state == 'READY') {
            fetch_ota_options(version_info, function(jsonReply, jadeurl) {
                display_info(version_info, jsonReply, jadeurl);
            });
        } else if (state == 'LOCKED' || state == 'UNSAVED') {
            const network =
                version_info['JADE_NETWORKS'] == 'TEST' ? 'testnet' : 'mainnet';
            jade.unlock(fetchUrl, function() {
                // jade unlocked
                fetch_ota_options(version_info, function(jsonReply, jadeurl) {
                    display_info(version_info, jsonReply, jadeurl);
                });
            }, network);
        } else {
            console.log('Device not supported');
            console.log(version_info);
        }
    });
}

const serial_filters = [
    // Silicon Laboratories USB to UART and WCH CH9102F
    {usbVendorId: 0x10c4, usbProductId: 0xea60},
    {usbVendorId: 0x1a86, usbProductId: 0x55d4}
];

async function show_firmwares() {
    try {
        const ports = await navigator.serial.getPorts();
        if (ports.length == 0) {
            await navigator.serial.requestPort({filters: serial_filters});
        }
        const showfirmwares = document.getElementById('showfirmwares');
        showfirmwares.classList.add('hidden');

        jade.start(
            function() {
                jade.get_version_info(function(version_info) {
                    const state = version_info['JADE_STATE'];
                    if (state == 'UNINIT' || state == 'READY') {
                        fetch_ota_options(
                            version_info, function(jsonReply, jadeurl) {
                                // display_info(version_info, jsonReply,
                                // jadeurl);
                                display_only_stable(
                                    version_info, jsonReply, jadeurl);
                                // showAllBtn.classList.remove('hidden');
                            });

                    } else if (state == 'LOCKED' || state == 'UNSAVED') {
                        const network =
                            version_info['JADE_NETWORKS'] == 'TEST' ?
                            'testnet' :
                            'mainnet';
                        jade.unlock(fetchUrl, function() {
                            // jade unlocked
                            fetch_ota_options(
                                version_info, function(jsonReply, jadeurl) {
                                    // display_info(version_info, jsonReply,
                                    // jadeurl);
                                    display_only_stable(
                                        version_info, jsonReply, jadeurl);
                                    // showAllBtn.classList.remove('hidden');
                                });
                        }, network);
                    } else {
                        console.log('Device not supported');
                        console.log(version_info);
                    }
                });
            },
            function(err) {
                const error = document.getElementById('error');
                error.innerHTML = err +
                    '</br>Another application or web page may be using the device.</br> Please close the other application or webpage and reload this page';
            });
    } catch (err) {
        errorScreen();
    }
}

function confirmChangingVersion() {
    agreeToChangeVersion = true;
    clearAfterPin();
    display_only_stable(...args);
}
