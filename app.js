const app = {
    deviceData: {},
    oneTo12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minutes: ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
    getURL: "http://127.0.0.1/aircontrol/get.php", // The GET request are sent to this address
    setURL: "http://127.0.0.1/aircontrol/set.php?", // The POST request are sent to this address

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

        //Watch for changes to the schedule
        const dayBodies = document.querySelectorAll('.day-body');
        dayBodies.forEach(day => day.addEventListener('change', app.scheduleChanges))

        //Watch for click on scheduler save button
        document.querySelector('.btn-sched').addEventListener('click', app.getChangedSchedule);

        // Expand section body
        const expandClickDivs = document.querySelectorAll('.expand-click-div');
        expandClickDivs.forEach(expand => expand.addEventListener('click', app.toggleSection));
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

        const button = input.closest('.section-body').querySelector('button');
        const currentValue = input.value;
        const oldValue = input.dataset.value;

        //Check to see if it was a change to the schedule
        if (input.closest('.day-div')) {
            return app.scheduleChanges(evt);
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
        const dayDiv = input.closest('.day-div');
        const button = input.closest('.section-body').querySelector('button');
        // see if there are any other changed program for different days
        const currentValue = input.value;
        const oldValue = input.dataset.value;

        if (currentValue !== oldValue) {
            if (input.closest('onoff-block')) {
                input.closest('.on-off-block').classList.add('time-changed');
                input.classList.add('input-changed');
            } else {
                input.classList.add('input-changed');
            }
            dayDiv.classList.add('sched-changed');
            button.removeAttribute('disabled')
            button.classList.remove('disabled')
        } else if (currentValue === oldValue) {
            if (input.closest('.on-off-block')) {
                input.classList.remove('input-changed');
                const areStillTimeChanges = input.closest('.on-off-block').querySelectorAll('input-changed').length
                if (areStillTimeChanges === 0) {
                    input.closest('.on-off-block').classList.remove('time-changed');
                }
            } else {
                input.classList.remove('input-changed');
            }
            // Needs to check to see if there are other changed inputs still before removing the changed class from class day div
            const areStillTimeChanges = dayDiv.querySelectorAll('.input-changed').length
            if (areStillTimeChanges < 1) {
                dayDiv.classList.remove('sched-changed');
            }
            const areChangedProgs = document.querySelectorAll('.sched-changed').length
            if (areChangedProgs === 0) {
                button.setAttribute('disabled', true)
                button.classList.add('disabled')
            }
        }
    },

    submitChanges: async function (evt) {
        evt.preventDefault();
        const target = evt.target;

        // Turn the button off so they can't resubmit
        const parentSection = target.closest('.section');
        const button = parentSection.querySelector('button');
        button.setAttribute('disabled', true);
        button.classList.add('disabled');

        // Bring up loader so they can't alter fields and to provide UX feedback
        const loading = parentSection.querySelector('.submit-overlay');
        loading.classList.add('waiting');

        let objectChanges = '';

        if (target.id === 'set-schedule') {
            objectChanges = app.getQueryStringScheduler(target);
        } else if (target.id === 'set-clock') {
            objectChanges = app.getQueryStringClock(target);
        } else {
            objectChanges = app.getQueryString(target);
        }

        const json = JSON.stringify(objectChanges);
        console.log(json);

        try {
            // SEND POST REQUEST
            const response = await fetch(app.setURL, {
                method: 'POST',
                body: json,
                headers: {
                    'Content-type': 'application/json'
                }
            })
            // Get the response and convert from JSON
            const data = await response.json();

            console.log(data);
            if(data.success === true){
                // If successful, we'll cleanup
                app.postSuccess(objectChanges, evt);
            } else {
                // If not successful, we'll let the user know and pass the error message from the response to the screen or a generic error message.
                // app.postFail(json.message || 'Error: Please try again!')
            }

            
        } catch (e) {
            console.log(e);
        }
    },

    postSuccess: function (changes, evt, data) {
        const button = evt.target;
        const section = button.closest('.section');
        const overlay = section.querySelector('.submit-overlay');
        const card = section.querySelector('.section-body').id;
        const message = section.querySelector('.message small');

        // Update the app.deviceData object with the new values since those are now the current device values
        Object.assign(app.deviceData, data);

        // Populate the fields again with the new data now in app.deviceData
        app.updateInputs(section);

        // Return button to disabled state
        button.setAttribute('disabled', true);
        button.classList.add('disabled');

        // Remove overlay
        overlay.style.visibility = 'hidden';

        // Show success message for 2 seconds and make it green
        message.innerHTML = 'Successfully ' + (button.innerHTML.includes('Save') ? 'saved!' : 'set!')
        message.style.color = 'green';
        message.parentElement.classList.add('show');

        const hideMessage = () => {
            message.parentElement.classList.remove('show');
        }
        // Adjust the time the message stays up by changing the number argument (represented in ms);
        setTimeout(hideMessage, 2000);
    },

    updateInputs: function (section) {
        // Replaces the data-input value (used to compare if the value entered is new)
        // with the value the user just entered and submitted to the server. This is
        // also the value that will be found in app.deviceData
        const inputs = section.querySelectorAll('.input-changed');
        const inputArry = [...inputs];

        inputArry.forEach((input) => {
            input.dataset.value = input.value;
        });
    },

    getQueryString: function (el) {
        const changedInputs = el.closest('form').querySelectorAll('.input-changed');
        const object = {};

        for (var i = 0; i < changedInputs.length; i++) {
            const stringPath = changedInputs[i].dataset.path
            const pathArray = stringPath.replace('app.deviceData.', '').trim().split('.');
            const value = changedInputs[i].value.trim();
            app.deepSetObj(object, pathArray, value);
        }

        return object;
    },

    getQueryStringScheduler: function (el) {
        // Get changed inputs that exist in the scheduler
        const changedInputsNodeList = document.getElementById('Schedule').querySelectorAll('.input-changed');
        let changedInputs = [...changedInputsNodeList];
        const object = {};

        while (changedInputs.length > 0) {
            const progDiv = changedInputs[0].closest('.prog-div')
            // Check if it is a program setting, aka not time. Add to the object like a regular input
            if (changedInputs[0].closest('.prog-set-block')) {
                const stringPath = progDiv.dataset.path + '.' + changedInputs[0].dataset.key;
                const pathArray = stringPath.replace('app.deviceData.', '').split('.');;
                const value = changedInputs[0].value.trim();
                app.deepSetObj(object, pathArray, value);
                // Delete this input from the array since we are finished with it
                changedInputs.splice(0, 1);
            } else if (changedInputs[0].closest('.on-off-block')) {
                // This indicates we are working with a time element and need to get the whole time, not just hr, min, ampm.
                //Get the on-off-block to see if the time is for on or off
                const onOffBlock = changedInputs[0].closest('.on-off-block');
                const onOrOff = onOffBlock.dataset.key;
                // Create a time object represented by the elements in the on-off-block
                // and use that time object to convert to a single 24hr time 
                const timeInputs = onOffBlock.querySelectorAll('select');
                const timeObj = { hour: '', minute: '', ampm: '' }

                for (var j = 0; j < timeInputs.length; j++) {
                    timeObj[timeInputs[j].dataset.type] = timeInputs[j].value
                }
                // Our time value
                const timeTo24 = app.convertTimeTo24(timeObj);
                // Add time to the object
                const stringPath = progDiv.dataset.path + '.' + onOrOff;
                const pathArray = stringPath.replace('app.deviceData.', '').split('.');
                app.deepSetObj(object, pathArray, timeTo24);
                // Any element in the changedInputs array from this on-off-block now needs to be deleted.
                // Otherwise, we would generate the time value for this block for every input that was changed.
                // Get all the changed inputs from this on-off-block
                const currentOnOffBlockChangedNodes = onOffBlock.querySelectorAll('.input-changed');
                const arrayOfCurrentOnOffBlockChanges = [...currentOnOffBlockChangedNodes];
                // We 'delete' by filtering the good items into a new array and swapping that new array into changedInputs.
                const filtered = changedInputs.filter((input) => {
                    return !arrayOfCurrentOnOffBlockChanges.includes(input);
                });

                changedInputs = filtered;
            }
        }

        return object;
    },

    getQueryStringClock: function (el) {
        const nodeList = el.closest('form').querySelectorAll('.input-changed');
        let changedInputs = [...nodeList]
        const object = {};

        while (changedInputs.length > 0) {
            const input = changedInputs[0];

            if (input.closest('.time-group')) {
                // This indicates we are dealing with time elements that need to be grab and one time calculated from
                if (!(input.id === 'clock-sec')) {
                    // We aren't interested in getting seconds, as it is stored/sent discretely in the app.deviceData object.
                    // Grab all the time elements to create a time object
                    const hour = document.getElementById('clock-hour');
                    const minute = document.getElementById('clock-min');
                    const ampm = document.getElementById('clock-ampm');
                    // Get the 24 version of the time
                    const timeTo24 = this.convertTimeTo24({ hour: hour.value, minute: minute.value, ampm: ampm.value });
                    // Not a dynamic like the other setters, so we can hard code the pathArray here. 
                    const pathArray = ['rtc', 'time'];
                    app.deepSetObj(object, pathArray, timeTo24);
                    // Delete any other present changed inputs from the time-block so we don't calculate the time more than once.
                    // We 'delete' by filtering the good items into a new array and swapping that new array into changedInputs.
                    const filtered = changedInputs.filter((input) => {
                        return ![hour, minute, ampm].includes(input);
                    });

                    changedInputs = filtered;

                } else {
                    const stringPath = input.dataset.path;
                    const pathArray = stringPath.replace('app.deviceData.', '').split('.');;
                    const value = changedInputs[0].value.trim();
                    app.deepSetObj(object, pathArray, value);

                    changedInputs.splice(0, 1);
                }
            }
        }

        return object
    },

    deepSetObj: function (obj, array, value) {
        //Recursively set nest object values
        const [head, ...rest] = array

        if (rest.length <= 0) {
            obj[head] = value
            return obj
        } else if (obj.hasOwnProperty(head)) {
            return app.deepSetObj(obj[head], rest, value)
        } else {
            obj[head] = {};
            return app.deepSetObj(obj[head], rest, value)
        }
    },

    queryObject: function (pathArray, object) {
        // Takes path as a string
        const [head, ...rest] = pathArray;
        let value = ''
        const  obj = object || app.deviceData;

        if(rest.length <= 0) {
            value = obj[head];
            return value
        } else if (obj.hasOwnProperty(head)) {
            value = app.queryObject(rest, obj[head])
            return value
        } else {
            obj[head] = {};
            value = app.queryObject(rest, obj[head])
            return value
        }
    },

    toggleSection: function (evt) {
        
        const target = evt.target;
        const section = target.closest('.section');
        const sectionBody = section.querySelector('.section-body');

        if(sectionBody.className.includes('show')) {
            sectionBody.classList.remove('show');
        }else {
            sectionBody.classList.add('show');
        }
    },

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
        let time = parseInt(hour + minute);
        if (ampm === 'pm') {
            hour = parseInt(hour) + 12;
        } else if (ampm === 'am' && hour === '12') {
            hour = 0
        }

        time = parseInt(hour.toString() + minute);

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
            document.querySelector('.btn-sched').style.display = 'flex';
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
        this.populateClock();
        this.populateMostFields();
        app.filterTrack();
        document.getElementById('container').classList.add('show');
        document.getElementById('header').classList.add('show');
        document.getElementById('loader-div').style.display = 'none';
        document.getElementById('dark-overlay').style.display = 'none';
    },

    populateMostFields: function () {
        const fields = document.querySelectorAll('.pop');

        for (var i = 0; i < fields.length; i++) {
            const field = fields[i];
            const pathArray = field.dataset.path.replace('app.deviceData.', '').split('.');
            const value = app.queryObject(pathArray);

            field.value = value;
            field.dataset.value = value;
        }
    },

    populateTimer: function () {
        const timerMode = document.getElementById('timer-mode');
        const modePathArray = timerMode.dataset.path.replace('app.deviceData.', '').split('.');
        timerMode.value = app.queryObject(modePathArray)

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
        const hrsPathArray = timerHrs.dataset.path.replace('app.deviceData.', '').split('.');
        timerHrs.value = app.queryObject(hrsPathArray)

        const minPathArray = timerMin.dataset.path.replace('app.deviceData.', '').split('.');
        timerMin.value = app.queryObject(minPathArray);
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
        const month = document.getElementById('clock-month');
        const date = document.getElementById('clock-date');
        const year = document.getElementById('clock-year');
        let hour = document.getElementById('clock-hour');
        const min = document.getElementById('clock-min');
        const sec = document.getElementById('clock-sec');
        let ampm = document.getElementById('clock-ampm');
        const oneTo59 = [];
        const thisYear = new Date().getFullYear();

        for (var i = 0; i < 60; i++) {
            oneTo59.push(i)
        }

        this.createOptions(month, oneTo59.slice(1, 13));
        this.createOptions(date, oneTo59.slice(1, 32));
        // Add more years to the list by continuing to add objects and iterating thisYear + 1. Note: the regex for the replace method will need to be changed in 100 or so years.
        this.createOptions(year, [
            { value: thisYear.toString().replace('20', ''), text: thisYear },
            { value: (thisYear + 1).toString().replace('20', ''), text: thisYear + 1 }
        ])
        this.createOptions(hour, oneTo59.slice(1, 13));
        this.createOptions(min, oneTo59.slice(0));
        this.createOptions(sec, oneTo59.slice(0))

        // Need to get the 12 hr time object to assign values now that time is not coming in in parts.
        // Fix hour time to 24
        const timeObj = app.convertTimeTo12(app.deviceData.rtc.time);
        hour.value = timeObj.hour;
        hour.dataset.value = timeObj.hour;
        min.value = timeObj.minutes;
        min.dataset.value = timeObj.minutes;
        ampm.value = timeObj.ampm;
        ampm.dataset.value = timeObj.ampm;
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
        const dataPath = `app.deviceData.prog.${index}.${bodyDay}`;
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
        const timeBlockOn = this.createTimeBlock(prog.on, 'on', index);
        completeTimeBlock1.appendChild(timeBlockOn);
        const offLabel = this.createLabel('Turn Off');
        completeTimeBlock2.appendChild(offLabel);
        const timeBlockOff = this.createTimeBlock(prog.off, 'off', index);
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
        speedSelect.setAttribute('data-key', 'speed')
        speedSelect.setAttribute('data-ref', `${index}.speed`);
        speedSelect.setAttribute('data-value', prog.speed);
        progSetBlockSpeed.appendChild(speedSelect);


        const progSetBlockMode = document.createElement('div');
        progSetBlockMode.className = 'prog-set-block';
        progSettings.appendChild(progSetBlockMode);
        const modeLabel = this.createLabel('Mode');
        progSetBlockMode.appendChild(modeLabel);
        const modeSelect = this.createSelect(prog.mode, [{ value: 0, text: 'Off' }, { value: 1, text: 'On' }, { value: 2, text: 'Program' }]);
        modeSelect.setAttribute('data-key', 'mode');
        modeSelect.setAttribute('data-ref', `${index}.mode`);
        modeSelect.setAttribute('data-value', prog.mode);
        progSetBlockMode.appendChild(modeSelect);

        return progDiv;
    },

    createTimeBlock: function (time, onOff, index) {
        const timeTo12Obj = app.convertTimeTo12(time)

        const onOffBlock = document.createElement('div');
        onOffBlock.className = `on-off-block ${onOff}`;
        onOffBlock.setAttribute('data-key', onOff);

        const hourSelect = this.createSelect(timeTo12Obj.hour, app.oneTo12.slice(1));
        hourSelect.setAttribute('data-value', timeTo12Obj.hour);
        hourSelect.classList.add('time-element');
        hourSelect.setAttribute('data-type', 'hour');
        hourSelect.setAttribute('data-ref', `${index}.hour`);
        onOffBlock.appendChild(hourSelect);

        const minuteSelect = this.createSelect((timeTo12Obj.minutes === 0 ? '00' : timeTo12Obj.minutes), app.minutes);
        minuteSelect.setAttribute('data-value', (timeTo12Obj.minutes === 0 ? '00' : timeTo12Obj.minutes));
        minuteSelect.classList.add('time-element');
        minuteSelect.setAttribute('data-type', 'minute');
        minuteSelect.setAttribute('data-ref', `${index}.min`);
        onOffBlock.appendChild(minuteSelect);

        const ampmSelect = this.createSelect(timeTo12Obj.ampm, [{ value: 'am', text: 'AM' }, { value: 'pm', text: 'PM' }]);
        ampmSelect.setAttribute('data-value', timeTo12Obj.ampm);
        ampmSelect.classList.add('time-element');
        ampmSelect.setAttribute('data-type', 'ampm');
        ampmSelect.setAttribute('data-ref', `${index}.ampm`);
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

    createOptions: function (select, options) {
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