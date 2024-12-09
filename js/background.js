//инициализация состояния при установке или обновлении
chrome.runtime.onInstalled.addListener(async () => {
    chrome.storage.local.set({ isEnabled: true });
    let url = chrome.runtime.getURL(`html/hello.html`);
    let tab = await chrome.tabs.create({ url });
});
