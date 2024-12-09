// > Интерфейс


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
	display: 'flex',
	flexWrap: 'wrap',
	gap: '10px',
	borderRadius: '10px',
	backgroundColor: 'rgb(242,242,242)',
	zIndex: '1000'
});

//кол-во резолверов
const resolvers = createStyledElement('div', 'resolvers', {
	padding: '10px',
	borderRadius: '10px',
	fontWeight: 'bold',
	backgroundColor: 'rgb(178,214,255)',
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
	backgroundColor: 'rgb(79,255,134)',
	flex: '1',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center'
});

//статус и время его посл. изменения
const stateTimer = createStyledElement('div', 'state', {
	padding: '10px',
	fontWeight: 'bold',
	flexBasis: '100%',
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
	dashboard.appendChild(stateTimer);
}

//удаление компонентов
function removeComponents() {
	if (dashboard) {
		document.body.removeChild(dashboard);
	}
}


// > Инициализация


let updateInterval;
let user = '';
let state = '';

//инициализация состояния при загрузке
chrome.storage.local.get(['isEnabled', 'timerValue'], (data) => {
	if (data.isEnabled) {
		if (data.timerValue) {
			timer.seconds = data.timerValue; // Загружаем значение таймера
			timer.displayTime(); // Отображаем загруженное значение
		}
		updateInterval = setInterval(updateValues, 1000);
		timer.start();
		getUsername();
		createComponents();
	}
})

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


//получение логина польз.
function getUsername() {
	try {
		const username = document.getElementsByClassName(
			'user-avatar_user__2Ul_N user-menu_avatar__1uxes'
			)[0].firstChild.alt

		//сохранение в хранилище
		chrome.storage.sync.set({ username: username }, function() {
			if (chrome.runtime.lastError) {
				throw new Error(chrome.runtime.lastError);
			}
			console.log('Username saved successfully!');
			user = username
		});
	} catch (error) {
		console.error('Error occurred while getting or saving username:', error);
	}
}

//обновление значений
async function updateValues() {
	try {
		//получение значений
		//получение username, если не удалось загрузить ранее
		if (user === '') {
			getUsername()
		}
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
			//определение статуса польз.
			if (operator === user) {
				if (state !== states[i].innerText) {
					state = states[i].innerText
					updateStateTimer(state)
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
		if (result > 30) {
			percent.style.backgroundColor = 'rgb(255,76,0)';
		} else {
			percent.style.backgroundColor = 'rgb(79,255,134)';
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

//обновление статуса и таймера
function updateStateTimer(state) {
	timer.reset(state);
	timer.start();
	saveTimerValue(); // Сохраняем значение таймера при изменении состояния
	if (state === `ON SHIFT`) {
		stateTimer.style.color = `rgb(79,255,134)`
	} else if (state === `ON BREAK`) {
		stateTimer.style.color = `orange`; // изменить цвет
	} else if (state === `BUSY`) {
		stateTimer.style.color = `rgb(255,76,0)`
	} else {
		stateTimer.style.color = `white`
	}
}


//таймер
class Timer {
	constructor() {
		this.seconds = 0;
		this.intervalId = null;
		this.state = '';
	}

	//запуск
	start() {
		if (this.intervalId) return;

		this.intervalId = setInterval(() => {
			this.seconds++;
			this.displayTime();
			saveTimerValue();
		}, 1000);
	}

	//остановка
	stop() {
		clearInterval(this.intervalId);
		this.intervalId = null;
	}

	//сброс
	reset(state) {
		this.stop();
		this.seconds = 0;
		this.state = state;
		this.displayTime();
	}

	//отображение
	displayTime() {
		const hours = String(Math.floor(this.seconds / 3600)).padStart(2, '0');
		const minutes = String(Math.floor((this.seconds % 3600) / 60)).padStart(2, '0');
		const seconds = String(this.seconds % 60).padStart(2, '0');
	
		stateTimer.textContent = `${this.state} ${hours}:${minutes}:${seconds}`;
	}
}

const timer = new Timer();

//сохранение значения таймера
function saveTimerValue() {
	chrome.storage.local.set({ timerValue: timer.seconds }, () => {
		if (chrome.runtime.lastError) {
			console.error('Error saving timer value:', chrome.runtime.lastError);
		}
	});
}

