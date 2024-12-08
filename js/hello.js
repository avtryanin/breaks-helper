const onClick = async(e) => {
	let queryOptions = {
		active: true,
		lastFocusedWindow: true
	};
	const [tab] = await chrome.tabs.query(queryOptions)
	chrome.tabs.remove(tab.id)
}

const button = document.querySelector('.ok-button')
if (button) {
	button.addEventListener('click', onClick)
}
