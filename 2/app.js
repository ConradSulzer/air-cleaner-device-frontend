const app = {
    deviceData: {},
    getURL: "http://127.0.0.1/aircontrol/get.php",
    setURL: "http://127.0.0.1/aircontrol/set.php",

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
        fields.forEach((field) => {
            field.addEventListener('input', app.checkValue)
        })

        const submitButtons = document.querySelectorAll('.btn-submit-changes');
        submitButtons.forEach((button) => {
            button.addEventListener('click', app.submitChanges)
        })

        const dayLabels = document.querySelectorAll('.day-label');
        dayLabels.forEach((label) => {
            label.addEventListener('click', app.openDay)
        })
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
        const currentValue = input.value;
        // const dataPath = input.dataset.path.split(',');
        // const oldValue = app.deviceData[dataPath[0]][dataPath[1]];
        const oldValue = input.dataset.value;
        console.log(oldValue)
        const button = input.parentElement.parentElement.querySelector('button');

        //Adding changed class and activating "submit changes" button
        if (currentValue !== oldValue) {
            input.classList.add('input-changed');
            button.removeAttribute('disabled');
            button.classList.remove('disabled')
        } else if (currentValue === oldValue) {
            input.classList.remove('input-changed');
            button.setAttribute('disabled', true)
            button.classList.add('disabled')
        }
    },

    submitChanges: function (evt) {
        evt.preventDefault();
        //Set all buttons to disabled
        const buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute('disabled', true);
            buttons[i].classList.add('disabled');
        }

        const data = app.getChangedValues(evt.target);

        json = JSON.stringify(data);

        // Remember to update data-value if server fetch is sucessful

        console.log(json);
    },

    getChangedValues: function (el) {
        const changedInputs = el.parentElement.querySelectorAll('.input-changed');
        const newData = {};

        for (var i = 0; i < changedInputs.length; i++) {
            const dataPath = changedInputs[i].dataset.path.split(',');
            const newValue = changedInputs[i].value;
            // Set up path in object
            newData[dataPath[0]] = {};
            newData[dataPath[0]][dataPath[1]] = newValue;
            console.log('New Value', newValue);
        }

        return newData
    },

    findDay: function (abrev) {
        const daysAbrev = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const regx = new RegExp(`^${abrev}`, 'g');
        const found = daysAbrev.find(element => regx.test(element));
        return found;
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
            hour = rawHour - 12;
            ampm = 'pm';
        }

        timeObj = {
            hour,
            minutes,
            ampm
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
        console.log(target);
        //Get all the day divs so we can hide/show the ones not clicked
        const dayDivs = document.querySelectorAll('.day-div');

        //Check to see if we have the correct item by it's class name.
        //If not climb the DOM tree until we reach it.
        if(!target.className && !target.className.includes('day-label')) {
            target = target.closest('.day-label');
            console.log(target);
        }
        if (target.className.includes('active')) {
            //We want to close the open day and show all days
            //Remove active class from this div
            target.classList.remove('active');
            //Hide the day body
            target.nextElementSibling.style.display = 'none';
            //Add display block to all the day divs
            dayDivs.forEach(div => div.style.display = 'block');
        } else {
            //Add active class for later reference
            target.classList.add('active');
            //Get the aprent element to compare with later 
            const targetDay = target.parentElement;
            //Cycle through the day divs and hide all the divs that don't match out target parent
            dayDivs.forEach(div => div === targetDay ? null : (div.style.display = 'none'))
            // open the body of the day div we want to see
            target.nextElementSibling.style.display = 'block';
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
            const option = document.createElement('option')
            option.value = i;
            option.innerHTML = i
            timerHrs.appendChild(option);
        }

        //Number of minutes you want to show up in the timer dropdown
        //in increments of "interval". If minutes = 60 the last option will be 55.
        const numberOfMinutes = 60
        const interval = 5
        const timerMin = document.getElementById('timer-min');
        for (var i = 0; i < numberOfMinutes; i = i + interval) {
            const option = document.createElement('option')
            option.value = i;
            option.innerHTML = i
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
        const uvSelector = document.getElementById('uv-delay');
        //Number of minutes you want to show up in the timer dropdown
        //in increments of "interval". If minutes = 60 the last option will be 55.
        const numberOfMinutes = 15;
        const interval = 1;
        for (var i = 0; i <= numberOfMinutes; i = i + interval) {
            const option = document.createElement('option')
            option.value = i;
            option.innerHTML = i
            uvSelector.appendChild(option);
        }
    },

    populateSchedule: function () {
        // Get all the programs
        const programs = app.formatProgramData(app.deviceData.prog);
        console.log('programs', programs)
        // Grab all the program bodies
        const programBodies = document.querySelectorAll('.day-body');
        // Get the key for each day
        const days = Object.keys(programs)
        console.log('days', days);
        console.log('program bodies', programBodies)
        // Add existing programs to their respective body
        days.forEach((day) => {
            // What day are we on
            console.log('day', day);
            //Get all programs for that day
            const dayProgs = programs[day];
            console.log('day progs', dayProgs)
            // Get that day's body
            const dayBody = document.getElementById(day);
            console.log('day body', dayBody);
            // For each day program create a program div
            dayProgs.forEach((program) => {
                console.log(program);
            });

        });
    },

    createprogramDiv: function (dayBody, day, ) {

    },
}

app.init();