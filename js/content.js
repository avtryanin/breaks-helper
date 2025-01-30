// > Интерфейс


//цвета
const white = 'rgb(242,242,242)';
const red = 'rgb(255,76,0)';
const green = 'rgb(79,255,134)';
const blue = 'rgb(178,214,255)';
const beige = 'rgb(255,243,223)';
const orange = 'rgb(189,102,0)';

//стилизация компонентов
function createStyledElement(tag, text, styles) {
	const element = document.createElement(tag);
	element.textContent = text;
	Object.assign(element.style, styles);
	return element;
}

//основной компонент
const dashboard = createStyledElement('div', '', {
	padding: '4px',
	bottom: '0px',
	right: '16px',
	position: 'fixed',
	width: '279px',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '6px',
	borderRadius: '10px',
	backgroundColor: white,
	fontSize: '13px',
	fontWeight: 'bold',
	zIndex: '1000',
	justifyContent: 'space-around',
	alignItems: 'center',
});

//контейнер резолверов
const resolvers = createStyledElement('div', '', {
	minWidth: '132.5px',
	height: '15px',
	fontSize: '11px',
	borderRadius: '11px',
	flex: '1',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	backgroundColor: blue
});

//блоки со значениями статусов операторов
const onshift = createStyledElement('div', 'OS', {
	width: '22px',
	height: '22px',
	borderRadius: '11px',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: green
});

const busy = createStyledElement('div', 'B', {
	width: '22px',
	height: '22px',
	borderRadius: '11px',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: red
});

const onbreak = createStyledElement('div', 'OB', {
	width: '22px',
	height: '22px',
	borderRadius: '11px',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: orange
});

const amount = createStyledElement('div', 'A', {
	width: '22px',
	height: '15px',
	borderRadius: '11px',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: blue,
});

//процент брейков
const percent = createStyledElement('div', '0 %', {
	padding: '6px',
	borderRadius: '8px',
	backgroundColor: green,
	flex: '1',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center'
});

//контейнер для state и time
const stateTimeContainer = createStyledElement('div', '', {
	flexBasis: '100%',
	display: 'flex',
	fontSize: '12px',
	gap: '6px',
	justifyContent: 'space-around',
	alignItems: 'center'
});

//статус польз.
const state = createStyledElement('div', 'STATUS', {
	fontWeight: 'bold',
	display: 'flex',
	flex: '1',
	justifyContent: 'flex-end',
	alignItems: 'center',
});

//время посл.изменения статуса
const time = createStyledElement('div', 'TIMER', {
	fontWeight: 'bold',
	display: 'flex',
	flex: '1',
	justifyContent: 'flex-start',
	alignItems: 'center'
});


// > Управление интерфейсом


//вывод компонентов
function createComponents() {
	document.body.appendChild(dashboard);
	dashboard.appendChild(resolvers);
	resolvers.appendChild(onshift);
	resolvers.appendChild(busy);
	resolvers.appendChild(onbreak);
	resolvers.appendChild(amount);
	dashboard.appendChild(percent);
	dashboard.appendChild(stateTimeContainer);
	stateTimeContainer.appendChild(state);
	stateTimeContainer.appendChild(time);
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
chrome.storage.local.get(['isEnabled', 'startTime', 'stateValue'], (data) => {
	url = window.location.href;
	if (data.isEnabled) {
		if (data.startTime) {
			currentState = data.stateValue;
			colorState(currentState)
			timer.startTime = data.startTime;
		}
		updateInterval = setInterval(updateValues, 1000);
		createComponents();
	}
});

//слушатель тумблера
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === `local` && changes.isEnabled) {
		const isEnabled = changes.isEnabled.newValue;
		if (isEnabled) {
			updateInterval = setInterval(updateValues, 1000);
			timer.start()
			createComponents();
		} else {
			clearInterval(updateInterval);
			timer.stop()
			removeComponents();
		}
	}
});


// > Получение и обработка данных


let login = '';
let name = '';
let currentState = '';

//обновление значений
async function updateValues() {
	//обновление значения таймера
	timer.updateElapsedTime();
	//проверка изменения url
	url = window.location.href;
	if (url !== 'https://remote.sdc.yandex-team.ru/operators') {
		clearInterval(updateInterval);
		removeComponents();
	}
	//получение значений
	try {
		//получение логина польз.
		if (!login) {
			login = document.getElementsByClassName(
			"user-avatar_user__2Ul_N user-menu_avatar__1uxes"
			)[0].children[0].alt;
		}
		
		//парсинг информации
		const operators = document.getElementsByClassName("operator_name__1XCUC");
		const states = document.getElementsByClassName("operator_statusText__2-wrK operator_clickable__wtvNe");
		const data = document.getElementsByClassName("operator_locations__3I0W4");

		//счетчики
		let sum = 0;
		let shifts = 0;
		let busies = 0;
		let breaks = 0;

		//обработка значений
		for (let i = 0; i < operators.length; i++) {
			//перебор операторов
			const operator = operators[i].innerText;
			//проверка исключенных операторов
			const isExcluded = await checkExcluded(operator);
			//подсчет кол-ва резолверов
			if (!isExcluded) {
				sum++;
				//подсчет кол-ва брейков
				if (states[i].innerText === 'ON SHIFT') {
					shifts++;
				} else if (states[i].innerText === 'BUSY') {
					busies++
				} else if (states[i].innerText === 'ON BREAK') {
					breaks++
				}
			}
			//получение имени польз., если логин совпадает
			if (login && !name) {
				const parts = data[i].innerText.split('•');
				operatorLogin = parts[1].trim();
				if (login === operatorLogin) {
					name = operator;
				}
			}
			//обновление статуса польз.
			if (name === operator) {
				const newState = states[i].innerText;
				if (newState !== currentState) {
					colorState(newState);
					currentState = newState;
					timer.reset()
					timer.start()
					if (newState === undefined) {
						currentState = ''// ?
					}
				}
			}
		}
		//вывод значений
		onshift.textContent = `${shifts}`;
		busy.textContent = `${busies}`;
		onbreak.textContent = `${breaks}`;
		amount.textContent = `${sum}`;
		percent.textContent = `${getPercent(sum, breaks)} %`;
		state.textContent = `${currentState}`;
		timer.displayTime()
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
	return roundedResult;
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

//цвет статуса польз.
function colorState(newState) {
	if (newState === 'ON SHIFT') {
		state.style.color = green;
	} else if (newState === 'ON BREAK') {
		state.style.color = orange;
	} else if (newState === 'BUSY') {
		state.style.color = red;
	} else {
		state.style.color = white;
	}
}


// > таймер


class Timer {
	constructor() {
		this.startTime = null;
		this.elapsedTime = 0;
		this.intervalId = null;
	}

	//запуск
	start() {
		if (this.intervalId) return;

		this.startTime = Date.now();
		this.saveStartTime();

		this.intervalId = setInterval(() => {
			this.updateElapsedTime();
			this.displayTime();
		}, 1000);
	}

	//остановка
	stop() {
		clearInterval(this.intervalId);
		this.intervalId = null;
	}

	//сброс
	reset() {
		this.stop();
		this.elapsedTime = 0;
		this.startTime = null;
		this.displayTime();
	}

	//отображение
	displayTime() {
		const hours = String(Math.floor(this.elapsedTime / 3600)).padStart(2, '0');
		const minutes = String(Math.floor((this.elapsedTime % 3600) / 60)).padStart(2, '0');
		const seconds = String(this.elapsedTime % 60).padStart(2, '0');
	
		time.textContent = `${hours}:${minutes}:${seconds}`;
	}

	//сохранение времени начала и статус в chrome.storage
	saveStartTime() {
		chrome.storage.local.set({ startTime: this.startTime, stateValue: currentState }, () => {
			if (chrome.runtime.lastError) {
				console.error('Error saving start time:', chrome.runtime.lastError);
			}
		});
	}

	//обновление прошедшего времени
	updateElapsedTime() {
		if (this.startTime) {
			this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
		}
	}
}

const timer = new Timer();
