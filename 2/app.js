const app = {
    deviceData: {},
    oneTo12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minutes: ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
    getURL: "http://127.0.0.1/aircontrol/get.php",
    // Make sure there is a '?' at the end of the setURL string since it will be a query string.
    setURL: "http://127.0.0.1/aircontrol/set.php?",

    init: async function () {
        console.log('app initialized')

        const result = await this.getData();

        if (result.message === 'success') {
            view.render();
            this.eventListeners();
        } else {
            console.log('Error fetching:', result.err);
        }
    },

    eventListeners: function () {
        // Watch for changes to input/selector values
        const fields = document.querySelectorAll('input, select');
        fields.forEach(field => field.addEventListener('input', app.checkValue))

        //Watch for click on save/set buttons
        const submitButtons = document.querySelectorAll('.btn-submit-changes');
        submitButtons.forEach(button => button.addEventListener('click', app.submitChanges))

        // Toggle days in the schedule
        const dayLabels = document.querySelectorAll('.day-label');
        dayLabels.forEach(label => label.addEventListener('click', app.openDay))

        //Watch for changes to the schule
        const dayBodies = document.querySelectorAll('.day-body');
        dayBodies.forEach(day => day.addEventListener('change', app.scheduleChanges))

        //Watch for click on scheduler save button
        document.querySelector('.btn-sched').addEventListener('click', app.getChangedSchedule);
    },

    getData: async function () {
        console.log('getting data...')

        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(this.getURL, {
                    method: 'GET',
                })

                const data = await response.json();

                this.deviceData = data;

                console.log('THIS DATA', this.deviceData)

                resolve({
                    message: 'success',
                    data
                })
            } catch (err) {
                reject({
                    message: 'Error fetching',
                    error: err
                })
            }
        })

    },

    checkValue: function (evt) {
        //Check to see if the value has changed and if true add "changed" class to the input
        // and activate the "Submit Changes" button
        const input = evt.target
        const button = input.parentElement.parentElement.querySelector('button');
        const currentValue = input.value;
        const oldValue = input.dataset.value;

        //Check to see if it was a change to the schedule
        if (input.closest('.day-div')) {
            return this.scheduleChanged(evt);
        }

        //Adding changed class and activating "submit changes" button
        if (currentValue !== oldValue) {
            input.classList.add('input-changed');
            const areChangedInputs = input.closest('form').querySelectorAll('.input-changed').length
            if (areChangedInputs === 1) {
                button.removeAttribute('disabled');
                button.classList.remove('disabled');
            }
        } else if (currentValue === oldValue) {
            input.classList.remove('input-changed');
            const areChangedInputs = input.closest('form').querySelectorAll('.input-changed').length
            if (areChangedInputs === 0) {
                button.setAttribute('disabled', true)
                button.classList.add('disabled')
            }
        }
    },

    scheduleChanges: function (evt) {
        //Check to see if the value has changed and if true add "changed" class to the input
        // and activate the "Submit Changes" button
        const input = evt.target
        const progDiv = input.closest('.day-div');
        const button = input.closest('.section-body').querySelector('button');
        // see if there are any other changed program for different days
        const currentValue = input.value;
        const oldValue = input.dataset.value;

        if (currentValue !== oldValue) {
            input.classList.add('input-changed');
            progDiv.classList.add('sched-changed');
            const areChangedProgs = document.querySelectorAll('.sched-changed').length
            if (areChangedProgs === 1) {
                button.removeAttribute('disabled');
                button.classList.remove('disabled')
            }
        } else if (currentValue === oldValue) {
            input.classList.remove('input-changed');
            progDiv.classList.remove('sched-changed');
            const areChangedProgs = document.querySelectorAll('.sched-changed').length
            if (areChangedProgs === 0) {
                button.setAttribute('disabled', true)
                button.classList.add('disabled')
            }
        }
    },

    submitChanges: function (evt) {
        evt.preventDefault();
        const target = evt.target;
        const parentForm = target.closest('form');
        let url = '';

        if (!parentForm) {
            url = app.getQueryStringScheduler(target);
        } else {
            url = app.getChangedTime(target);
        }

        console.log(url);
        // SEND GET REQUEST

        // RENDER SUCCESS/FAIL MESSAGE

        // Update values individually to new values or update in app.devicedata and rerender page or fetch new get.php and rerender.
    },

    getQueryString: function (el) {
        const changedInputs = el.closest('form').querySelectorAll('.input-changed');
        const strings = [];

        for (var i = 0; i < changedInputs.length; i++) {
            stringPath = this.convertToPathString(changedInputs[i].dataset.path);
            const query = `${stringPath}=${changedInputs[i].value.replace(' ', '%20')}`
            strings.push(query);
        }

        const url = strings.reduce((a, b, i) => {
            if(i === 0) {
                return a + b
            } else {
                return a + '&' + b
            }
        }, app.setURL);

        return url;
    },

    getQueryStringScheduler: function (string) {
        var array = string.split('.');
        var length = array.length;
        var pathString = '';

        for (var i = 2; i < length; i++) {
            if (i === 2) {
                pathString = `${array[i]}`;
            } else {
                pathString = pathString + `[${array[i]}]`
            }
        }

        return pathString;
    },

    updateTime: function (evt) {

    },

    // Marked for deletion
    // findDay: function (abrev) {
    //     const daysAbrev = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    //     const regx = new RegExp(`^${abrev}`, 'g');
    //     const found = daysAbrev.find(element => regx.test(element));
    //     return found;
    // },

    formatProgramData: function (data) {
        //Instead of the original format of programNumber->day->program.
        //The new format will be day->programs
        const programs = { Su: [], Mo: [], Tu: [], We: [], Th: [], Fr: [], Sa: [] };

        data.forEach((program, index) => {
            //Get the day abreviations/keys for each program
            const keys = Object.keys(program);

            //Use that each key to access that program setting for that day
            keys.forEach((day) => {
                program[day]['index'] = index
                //Push that program to it's correct day's array in the new programs object
                programs[day].push(program[day]);

            });

        });

        return programs
    },

    convertTimeTo12: function (time) {
        let hour = 12;
        let minutes = time;
        let ampm = 'am';
        const timeObj = {
            hour,
            minutes,
            ampm
        }

        //Handles edge case for times from 00:00 - 00:59, which would be parsed as just 0-59.
        if (time < 60) {
            return timeObj;
        }

        //Otherwise, convert to string for string manipulation methods, grab last two digits as minutes,
        //use remaining digit(s) as hour and from hour determine if AM or PM and adjust hour to 12hr.
        const timeString = time.toString();
        const minutesString = timeString.match(/(\d){2}$/g);
        const rawHour = parseInt(timeString.replace(minutesString, ''));
        minutes = parseInt(minutesString);

        if (rawHour > 12) {
            timeObj.hour = rawHour - 12;
            timeObj.minutes = minutes
            timeObj.ampm = 'pm';
        } else {
            timeObj.hour = rawHour;
            timeObj.minutes = minutes;
            timeObj.ampm = 'am';
        }

        return timeObj;
    },

    convertTimeTo24: function ({ hour, minute, ampm }) {
        let time = parseInt(hour.toString() + minute.toString());
        if (ampm === 'pm') {
            hour = hour + 12;

            if (hour > 23) {
                hour = 0;
            }

            time = parseInt(hour.toString() + minute.toString());
        }

        return time;
    },

    openDay: function (evt) {
        let target = evt.target;
        //Get all the day divs so we can hide/show the ones not clicked
        const dayDivs = document.querySelectorAll('.day-div');

        //Check to see if we have the correct item by it's class name.
        //If not climb the DOM tree until we reach it.
        if (!target.className && !target.className.includes('day-label')) {
            target = target.closest('.day-label');
        }
        if (target.className.includes('active')) {
            //We want to close the open day and show all days
            //Remove active class from this div
            target.classList.remove('active');
            //Hide the day body
            target.nextElementSibling.style.display = 'none';
            //Add display block to all the day divs
            dayDivs.forEach(div => div.style.display = 'block');
            //Show the save btn
            document.querySelector('.btn-sched').style.display = 'block';
        } else {
            //Add active class for later reference
            target.classList.add('active');
            //Get the parent element to compare with later 
            const targetDay = target.parentElement;
            //Cycle through the day divs and hide all the divs that don't match our target parent
            dayDivs.forEach(div => div === targetDay ? null : (div.style.display = 'none'));
            // Hide the save btn
            document.querySelector('.btn-sched').style.display = 'none';
            // open the body of the day div we want to see
            target.nextElementSibling.style.display = 'block';
        }
    },

    filterTrack: function () {
        const filter = document.querySelector('#filter form');
        const pTag = document.createElement('p');
        const filterReplace = app.deviceData.filter.replace
        const expiresOn = Date.parse(`${filterReplace.month}/${filterReplace.day}/${filterReplace.year}`);
        const today = new Date().getTime();
        const days = Math.floor((expiresOn - today) / 86400000);
        pTag.innerHTML = days >= 0 ? `Filter expires in ${days} day${days === 1 ? '' : 's'}.` : `Filter expired ${days * (-1)} day${days === 1 ? '' : 's'} ago!`;
        pTag.style.color = days >= 0 ? 'green' : 'red';
        filter.appendChild(pTag);

        if (expiresOn > today) {

        }
    }
}

const view = {
    render: function () {
        this.populateTimer();
        this.populateMotor();
        this.populateUv();
        this.populateSchedule();
        this.populateMostFields();
        app.filterTrack();

        document.getElementById('container').style.display = 'flex';
        document.getElementById('loader-div').style.display = 'none';
        document.getElementById('dark-overlay').style.display = 'none';
    },

    populateMostFields: function () {
        const fields = document.querySelectorAll('.pop');

        for (var i = 0; i < fields.length; i++) {
            const field = fields[i];
            const value = eval(field.dataset.path);

            field.value = value;
            field.dataset.value = value;
        }
    },

    populateTimer: function () {
        const timerMode = document.getElementById('timer-mode');
        timerMode.value = eval(timerMode.dataset.path);

        //Number of hours you want to show up in the timer dropdown
        const numberOfHours = 6
        const timerHrs = document.getElementById('timer-hrs');
        for (var i = 0; i <= numberOfHours; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.innerHTML = i;
            timerHrs.appendChild(option);
        }

        //Number of minutes you want to show up in the timer dropdown
        //in increments of "interval". If minutes = 60 the last option will be 55.
        const numberOfMinutes = 60;
        const interval = 5;
        const timerMin = document.getElementById('timer-min');
        for (var i = 0; i < numberOfMinutes; i = i + interval) {
            const option = document.createElement('option');
            option.value = i;
            option.innerHTML = i;
            timerMin.appendChild(option);
        }

        timerHrs.value = eval(timerHrs.dataset.path);
        timerMin.value = eval(timerMin.dataset.path)
    },

    populateMotor: function () {
        const speed = document.getElementById('motor-speed');
        //Set max speed selection for dropdown
        const maxSpeed = 10;
        for (var i = 1; i <= maxSpeed; i++) {
            const option = document.createElement('option')
            option.value = i;
            option.innerHTML = i
            speed.appendChild(option);
        }
    },

    populateClock: function () {

    },

    populateUv: function () {
        const uvDelaySelector = document.getElementById('uv-delay');
        //Number of minutes you want to show up in the timer dropdown
        //in increments of "interval". If minutes = 60 the last option will be 55.
        const numberOfMinutes = 15;
        const interval = 1;
        for (var i = 0; i <= numberOfMinutes; i = i + interval) {
            const option = document.createElement('option')
            option.value = i;
            option.innerHTML = i
            uvDelaySelector.appendChild(option);
        };
        uvDelaySelector.value = app.deviceData.uv.offDelay;
        uvDelaySelector.setAttribute('data-value', app.deviceData.uv.offDelay);
    },

    populateSchedule: function () {
        // Get all the programs
        const programs = app.formatProgramData(app.deviceData.prog);
        // Grab all the program bodies
        const programBodies = document.querySelectorAll('.day-body');
        // Loop through all the program bodies and populate them with the programs belonging to that body
        programBodies.forEach((progBody) => {
            // Add new program tag
            const addNew = document.createElement('small');
            addNew.className = 'add-new-prog';
            addNew.innerText = '+ Add New Program';

            const id = progBody.id
            // use the id to get the right programs
            const dayProgs = programs[id];
            // loop through the programs, if any, and add them to the body
            dayProgs.forEach((prog, index) => {
                //Create a div for each program
                const progDiv = this.createprogramDiv(prog, index, id);
                progDiv.className = 'prog-div';

                progBody.appendChild(progDiv);
            });

            if (progBody.childElementCount < 3) {
                progBody.appendChild(addNew);
            }
        })
    },

    createprogramDiv: function (prog, index, bodyDay) {
        //Create the main program div that houses each program
        const progDiv = document.createElement('div');
        progDiv.className = 'prog-div';
        const dataPath = `prog.${index}.${bodyDay}`;
        progDiv.setAttribute('data-path', dataPath);

        //Program Div time blocks
        const progTimes = document.createElement('div');
        progTimes.className = 'prog-times';
        progDiv.appendChild(progTimes);

        const completeTimeBlock1 = document.createElement('div');
        completeTimeBlock1.className = 'complete-time-block';
        progTimes.appendChild(completeTimeBlock1);

        const completeTimeBlock2 = document.createElement('div');
        completeTimeBlock2.className = 'complete-time-block';
        progTimes.appendChild(completeTimeBlock2);

        const onLabel = this.createLabel('Turn On');
        completeTimeBlock1.appendChild(onLabel);
        const timeBlockOn = this.createTimeBlock(prog.on, 'on');
        completeTimeBlock1.appendChild(timeBlockOn);
        const offLabel = this.createLabel('Turn Off');
        completeTimeBlock2.appendChild(offLabel);
        const timeBlockOff = this.createTimeBlock(prog.off, 'off');
        completeTimeBlock2.appendChild(timeBlockOff);

        // Program Div Settings block
        const progSettings = document.createElement('div');
        progSettings.className = 'prog-settings';
        progDiv.appendChild(progSettings);

        const progSetBlockSpeed = document.createElement('div');
        progSetBlockSpeed.className = 'prog-set-block';
        progSettings.appendChild(progSetBlockSpeed);
        const speedLabel = this.createLabel('Speed');
        progSetBlockSpeed.appendChild(speedLabel);
        const speedSelect = this.createSelect(prog.speed, app.oneTo12.slice(0, (app.oneTo12.length - 2)));
        progSetBlockSpeed.appendChild(speedSelect);


        const progSetBlockMode = document.createElement('div');
        progSetBlockMode.className = 'prog-set-block';
        progSettings.appendChild(progSetBlockMode);
        const modeLabel = this.createLabel('Mode');
        progSetBlockMode.appendChild(modeLabel);
        const modeSelect = this.createSelect(prog.mode, [{ value: 0, text: 'Off' }, { value: 1, text: 'On' }, { value: 2, text: 'Program' }]);
        progSetBlockMode.appendChild(modeSelect);

        const deleteBtn = document.createElement('small');
        deleteBtn.innerText = '- Delete Program';
        deleteBtn.className = 'prog-delete';
        progDiv.appendChild(deleteBtn);

        return progDiv;
    },

    createTimeBlock: function (time, onOff) {
        const timeTo12Obj = app.convertTimeTo12(time)

        const onOffBlock = document.createElement('div');
        onOffBlock.className = `on-off-block ${onOff}`;

        const hourSelect = this.createSelect(timeTo12Obj.hour, app.oneTo12.slice(1));
        hourSelect.setAttribute('data-value', timeTo12Obj.hour);
        hourSelect.classList.add('time-element');
        hourSelect.setAttribute('data-type', 'hour');
        onOffBlock.appendChild(hourSelect);

        const minuteSelect = this.createSelect((timeTo12Obj.minutes === 0 ? '00' : timeTo12Obj.minutes), app.minutes);
        minuteSelect.setAttribute('data-value', timeTo12Obj.minutes);
        minuteSelect.classList.add('time-element');
        minuteSelect.setAttribute('data-type', 'minute');
        onOffBlock.appendChild(minuteSelect);

        const ampmSelect = this.createSelect(timeTo12Obj.ampm, [{ value: 'am', text: 'AM' }, { value: 'pm', text: 'PM' }]);
        ampmSelect.setAttribute('data-value', timeTo12Obj.ampm);
        ampmSelect.classList.add('time-element');
        ampmSelect.setAttribute('data-type', 'ampm')
        onOffBlock.appendChild(ampmSelect);

        return onOffBlock;
    },

    createSelect: function (value, options) {
        const select = document.createElement('select');

        options.forEach((option) => {
            const optionEl = document.createElement('option');

            if (typeof option === 'object') {
                optionEl.value = option.value;
                optionEl.innerHTML = option.text;
            } else {
                optionEl.value = option;
                optionEl.innerHTML = option
            }
            select.appendChild(optionEl);
        });

        select.value = value
        return select;
    },

    createLabel: function (text, labelFor) {
        const label = document.createElement('label');
        if (labelFor) {
            label.htmlFor = labelFor;
        }
        label.innerHTML = text;
        return label;
    }
}

app.init();