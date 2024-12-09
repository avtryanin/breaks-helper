//тумблер
document.addEventListener('DOMContentLoaded', () => {
	const toggle = document.getElementById('toggle');
	chrome.storage.local.get('isEnabled', (data) => {
		toggle.checked = data.isEnabled;
	});

	toggle.addEventListener('change', () => {
	  	const isEnabled = toggle.checked;
	  	chrome.storage.local.set({ isEnabled: isEnabled });
	});
});


//список исключений
const excluded = [];
const addButton = document.getElementById('add-button');
const usernameInput = document.getElementById('username-input');
const excludedList = document.getElementById('list');

//загружает список из chrome.storage.sync
function loadFromStorage() {
    chrome.storage.sync.get(['excluded'], (result) => {
        if (result.excluded) {
            excluded.push(...result.excluded);
        }
        renderList();
    });
}

//сохраняет список в chrome.storage.sync
function saveToStorage() {
    chrome.storage.sync.set({ excluded: excluded }, () => {
    });
}

//добавление исключения по нажатию
addButton.addEventListener('click', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    if (username !== '') {
        excluded.push(username);
        usernameInput.value = '';
        saveToStorage();
        renderList();
    }
});

//обновление списка
function renderList() {
    excludedList.innerHTML = '';

    excluded.forEach((username, index) => {
        const li = document.createElement('li');

        const removeButton = document.createElement('button');
        removeButton.textContent = '✖';
        removeButton.classList.add('remove-button');
        removeButton.addEventListener('click', () => {
            excluded.splice(index, 1);
            saveToStorage();
            renderList();
        });

        li.appendChild(removeButton);
        li.appendChild(document.createTextNode(username));
        excludedList.appendChild(li);
    });
}

//загружет список при инициализации
loadFromStorage();
