const getURL = "http://127.0.0.1/aircontrol/get.php";
const setURL = "http://127.0.0.1/aircontrol/set.php";

const app = {
    deviceData: {},

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
    },

    getData: async function () {
        console.log('getting data...')

        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(getURL, {
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
        const programs = { Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };

        data.forEach((program, index) => {
            //Get the day abreviations/keys for each program
            const keys = Object.keys(program);

            //Use that each key to access that program setting for that day
            keys.forEach((key) => {
                const day = this.findDay(key);

                //Push that program to it's correct day's array in the new programs object
                programs[day].push(program[key]);

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
    }
}

const view = {

    render: function () {
        const sections = window.appConfig.sections
        const App = document.createElement('div');
        App.id = 'App';
        document.querySelector('.container').appendChild(App);


        sections.forEach((section) => {
            const sectionHTML = this.createSection(section);
            App.appendChild(sectionHTML);
        })

        document.getElementById('loader-div').style.display = 'none'
        document.getElementById('dark-overlay').style.display = 'none'
    },

    createSection: function (section) {
        const sectionDiv = document.createElement('div')
        sectionDiv.className = 'section';

        const titleBar = this.createTitleBar(section.title);
        sectionDiv.appendChild(titleBar);

        const sectionBody = this.createSectionBody();
        sectionDiv.appendChild(sectionBody);

        if (section.type === 'inputs') {
            const inputs = section.inputs || [];
            const selectors = section.selectors || []
            const form = this.createForm(section.key);
            const inputEls = this.createInputs(section.pathHead, inputs,);
            const selectorEls = this.createSelectors(section.pathHead, selectors);

            elsArray = inputEls.concat(selectorEls);

            //Add the divs to the form in the order specified in the section order property 
            section.order.forEach((name) => {
                const div = elsArray.find(obj => obj.key === name);
                form.appendChild(div.inputDiv);
            });

            if (section.editable) {
                const button = this.createButton();
                form.appendChild(button);
            }

            sectionBody.appendChild(form)
            return sectionDiv
        }
    },
    
    createTitleBar: function(titleText) {
        // Title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';

        // Title bar contents (title and +/- "icon" if smaller screen)
        const title = document.createElement('p');
        title.className = 'title';
        title.innerHTML = titleText;
        titleBar.appendChild(title);
        const expandIcon = document.createElement('p');
        expandIcon.innerHTML = '+';
        expandIcon.className = 'expand-icon'
        titleBar.appendChild(expandIcon);

        return titleBar
    },

    createSectionBody: function () {
        const sectionBody = document.createElement('div');
        sectionBody.className = 'section-body';

        return sectionBody
    },

    createForm: function (key) {
        const form = document.createElement('form');
        form.id = key;
        form.className = 'form-control'

        return form
    },

    createInputs: function (pathHead, inputs) {
        inputArray = [];

        inputs.forEach((input) => {
            const value = eval(pathHead + input.key);
            // console.log(inputs.key, value)
            // console.log(eval(pathHead + input.key))
            const inputDiv = document.createElement('div');
            inputDiv.className = 'input-div';

            //Create input label
            const label = document.createElement('label');
            label.htmlFor = input.label.toLowerCase();
            label.innerHTML = input.label;
            inputDiv.appendChild(label);

            //Create Input
            const inputEl = document.createElement('input');
            inputEl.id = input.label.toLowerCase();
            inputEl.type = 'text';
            inputEl.value = value;

            if (input.readonly) {
                inputEl.className = 'form-input readonly';
                inputEl.setAttribute('readonly', true);
            } else {
                inputEl.className = 'form-input editable';
            }

            inputEl.setAttribute('data-path', pathHead + input.key);
            inputEl.setAttribute('data-value', value)
            inputDiv.appendChild(inputEl);

            inputArray.push({
                key: input.key,
                inputDiv
            });
        });

        return inputArray;
    },

    createSelectors: function (pathHead, selectors) {
        const selectorArray = [];

        selectors.forEach((selector) => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'input-div';

            //Create select label
            const label = document.createElement('label');
            label.htmlFor = selector.label.toLowerCase();
            label.innerHTML = selector.label;
            inputDiv.appendChild(label);

            //Create select
            const select = document.createElement('select');
            select.id = selector.label.toLowerCase();
            select.name = selector.label.toLowerCase();
            select.type = 'text';
            select.setAttribute('data-value', eval(pathHead + selector.key));
            select.setAttribute('data-path', pathHead + selector.key);

            //Create select options
            selector.options.forEach((optionData) => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.innerHTML = optionData.show
                select.appendChild(option);
            })
            // Must declare value after the options have been created
            select.value = eval(pathHead + selector.key);
            inputDiv.appendChild(select);

            selectorArray.push({
                key: selector.key,
                inputDiv
            })
        });

        return selectorArray;
    },

    createButton: function () {
        const button = document.createElement('button');
        button.innerHTML = 'Submit Changes';
        button.type = 'button';
        button.className = 'btn btn-submit-changes disabled';
        button.setAttribute('disabled', true);

        return button
    },

}

app.init();