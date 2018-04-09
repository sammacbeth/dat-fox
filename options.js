
const form = document.getElementById('options');
const address = document.getElementById('address');

browser.storage.local.get('gatewayAddress').then((res) => {
    if (res.gatewayAddress) {
        address.value = res.gatewayAddress;
    }
});

form.onsubmit = (ev) => {
    ev.preventDefault();
    chrome.storage.local.set({
        gatewayAddress: address.value,
    });
};
