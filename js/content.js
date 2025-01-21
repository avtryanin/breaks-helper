// > Интерфейс


//цвета
const white = 'rgb(242,242,242)'
const red = 'rgb(255,76,0)'
const green = 'rgb(79,255,134)'
const blue = 'rgb(178,214,255)'

//стилизация компонентов
function createStyledElement(tag, text, styles) {
	const element = document.createElement(tag);
	element.textContent = text;
	Object.assign(element.style, styles);
	return element;
}

//основной компонент
const dashboard = createStyledElement('div', '', {
	padding: '10px',
	bottom: '30px',
	right: '30px',
	position: 'fixed',
	minWidth: '300px',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '10px',
	borderRadius: '10px',
	backgroundColor: white,
	zIndex: '1000'
});

//кол-во резолверов
const resolvers = createStyledElement('div', 'resolvers', {
	padding: '10px',
	borderRadius: '10px',
	fontWeight: 'bold',
	backgroundColor: blue,
	flex: '1',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center'
});

//процент брейков
const percent = createStyledElement('div', 'percent', {
	padding: '10px',
	borderRadius: '10px',
	fontWeight: 'bold',
	backgroundColor: green,
	flex: '1',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center'
});


// > Управление интерфейсом


//вывод компонентов
function createComponents() {
	document.body.appendChild(dashboard);
	dashboard.appendChild(resolvers);
	dashboard.appendChild(percent);
}

//удаление компонентов
function removeComponents() {
	if (dashboard) {
		document.body.removeChild(dashboard);
	}
}


// > Инициализация


let url;
let updateInterval;

//инициализация состояния при загрузке
chrome.storage.local.get(['isEnabled'], (data) => {
	url = window.location.href;
	updateInterval = setInterval(updateValues, 1000);
	createComponents();
});

//слушатель тумблера
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === `local` && changes.isEnabled) {
		const isEnabled = changes.isEnabled.newValue;
		if (isEnabled) {
			updateInterval = setInterval(updateValues, 1000);
			createComponents();
		} else {
			clearInterval(updateInterval);
			removeComponents();
		}
	}
});


// > Получение и обработка данных


//обновление значений
async function updateValues() {
	//проверка изменения url
	url = window.location.href;
	if (url !== 'https://remote.sdc.yandex-team.ru/operators') {
		clearInterval(updateInterval);
		removeComponents();
	}
	//получение значений
	try {
		const operators = document.getElementsByClassName("operator_name__1XCUC");
		const states = document.getElementsByClassName("operator_statusText__2-wrK operator_clickable__wtvNe");

		let sum = 0;
		let breaks = 0;

		//обработка значений
		for (let i = 0; i < operators.length; i++) {
			const operator = operators[i].innerText;

			//проверка исключений
			const isExcluded = await checkExcluded(operator);
			//подсчет резолверов
			if (!isExcluded) {
				sum++;
				//подсчет брейков
				if (states[i].innerText === 'ON BREAK') {
					breaks++;
				}
			}
		}
		resolvers.textContent = `На смене: ${sum}`;
		//получение % брейков
		getPercent(sum, breaks);
	} catch (error) {
		console.error('An error occurred while updating or processing the values:', error);
	}
}

//рассчет и отображение % брейков
function getPercent(sum, breaks) {
	let result;
	if (sum !== 0) {
		result = (100 / sum) * breaks;
		if (result >= 30) {
			percent.style.backgroundColor = red;
		} else {
			percent.style.backgroundColor = green;
		}
	} else {
		result = 0;
	}
	const roundedResult = result.toFixed(1);
	percent.textContent = `${roundedResult} %`;
}

//проверка в списке исключений
function checkExcluded(operator) {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get(['excluded'], (result) => {
			//проверка ошибок в вызове chrome.storage
			if (chrome.runtime.lastError) {
				console.error('Error receiving data from chrome.storage:', chrome.runtime.lastError);
				return reject(new Error('Error receiving data from chrome.storage'));
			}

			if (result.excluded) {
				const found = result.excluded.includes(operator);
				resolve(found);
			} else {
				resolve(false);
			}
		});
	});
}
