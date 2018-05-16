
const { bridge, resetBridge } = browser.extension.getBackgroundPage();

const button = document.getElementById('test');
const testResults = document.getElementById('test-results');

function createCheckAlert() {
    const elem = document.createElement('div');
    elem.setAttribute('class', 'alert alert-primary');
    elem.setAttribute('role', 'alert');
    return elem;
}

async function testGateway(setLabel) {
    setLabel('Attempting to start gateway...');
    const port = await resetBridge();
    setLabel(`Successfully started dat gateway at localhost:${port}.`);
    return true;
}

async function testVersion(setLabel) {
    setLabel('Checking helper version...');
    const version = await bridge.postMessage({ action: 'getVersion' });
    const wantedVersion = '0.0.5';
    if (version < wantedVersion) {
        setLabel(`Helper version ${version} not up-to-date. Latest is ${wantedVersion}`);
        return false;
    }
    setLabel(`Helper version ${version} up-to-date`);
    return true;
}

button.onclick = async () => {
    button.innerText = 'Testing...';
    button.setAttribute('disabled', true);
    testResults.innerHTML = '';
    const bridgeCheck = createCheckAlert();
    bridgeCheck.innerHTML = '<p>Checking helper connection</p><ul id="results"></ul>';
    testResults.appendChild(bridgeCheck);
    const resultList = document.getElementById('results');

    const tests = [testGateway, testVersion];
    let failure = false;
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const testElem = document.createElement('li');
        resultList.appendChild(testElem); 
        try {
            const res = await test((label) => testElem.innerText = label);
            if (!res) {
                failure = true;
                break;
            }
        } catch(e) {
            testElem.innerText = `${testElem.innerText} ${e}`;
            failure = true;
            break;
        }
    }

    if (failure) {
        bridgeCheck.setAttribute('class', 'alert alert-danger');
    } else {
        bridgeCheck.setAttribute('class', 'alert alert-success');
        document.getElementById('ready-to-go').setAttribute('class', 'col visible');
    }
    
    button.removeAttribute('disabled');
    button.innerText = 'Test';
};