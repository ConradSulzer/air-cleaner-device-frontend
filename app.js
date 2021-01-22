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
        const dataPath = input.dataset.path.split(',');
        const oldValue = app.deviceData[dataPath[0]][dataPath[1]];
        const button = input.parentElement.parentElement.querySelector('button');

        console.log(button);
        //Adding changed class and activating "submit changes" button
        if(currentValue !== oldValue) {
            input.classList.add('input-changed');
            button.removeAttribute('disabled');
            button.classList.add('disabled')
        }else if (currentValue === oldValue) {
            input.classList.remove('input-changed');
            button.setAttribute('disabled', true)
            button.classList.remove('disabled')
        }
    },

    submitChanges: function (evt) {
        evt.preventDefault();
        const data = app.getChangedValues(evt.target);

        json = JSON.stringify(data);

        console.log(json);
    },

    getChangedValues: function (el) {
        const changedInputs = el.parentElement.querySelectorAll('.input-changed');
        const newData = {};

        for(var i = 0; i < changedInputs.length; i++) {
            const dataPath = changedInputs[i].dataset.path.split(',');
            const newValue = changedInputs[i].value;
            // Set up path in object
            newData[dataPath[0]] = {};
            newData[dataPath[0]][dataPath[1]] = newValue;
            console.log('New Value', newValue);
        }

        return newData
    }
}

const view = {
    // Form structure is created here. Each section is an object. Inside each section object is the title
    // for the section and the inputs you want in that section. Data path represents where the item lives
    // in the JSON object and is used to compare and, if necessary, send changed data.
    sections: function () {
        const sections = [
            {
                title: 'WIFI Settings',
                inputs: [
                    {
                        label: 'Mode',
                        type: 'select',
                        value: app.deviceData.wifi.mode || 'Select One',
                        options: ['Select One', 'Server', 'Client', 'Disabled'],
                        dataPath: ['wifi', 'mode']
                    },
                    {
                        label: 'SSID',
                        type: 'input',
                        value: app.deviceData.wifi.ssid || '',
                        dataPath: ['wifi', 'ssid']
                    },
                    {
                        label: 'Password',
                        type: 'input',
                        value: app.deviceData.wifi.pass || '',
                        dataPath: ['wifi', 'pass']
                    },
                    {
                        label: 'IP',
                        type: 'input',
                        value: app.deviceData.wifi.ip || '',
                        dataPath: ['wifi', 'ip']
                    },
                    {
                        label: 'Subnet',
                        type: 'input',
                        value: app.deviceData.wifi.subnet || '',
                        dataPath: ['wifi', 'subnet']
                    },
                    {
                        label: 'Gateway',
                        type: 'input',
                        value: app.deviceData.wifi.gateway || '',
                        dataPath: ['wifi', 'gateway']
                    },
                    {
                        label: 'DNS',
                        type: 'input',
                        value: app.deviceData.wifi.dns || '',
                        dataPath: ['wifi', 'dns']
                    }
                ]
            }
        ]

        return sections
    },

    render: function () {
        const sections = this.sections()
        const App = document.createElement('div');
        App.id = 'App';
        document.querySelector('.container').appendChild(App);
        

        sections.forEach((section) => {
            console.log();
            const sectionHTML = this.createSection(section);
            App.appendChild(sectionHTML);
        })

        document.getElementById('loader-div').style.display = 'none'
        document.getElementById('dark-overlay').style.display = 'none'
    },

    createSection: function (data) {
        const section = document.createElement('div')
        section.className = 'section';

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        section.appendChild(titleBar);

        // Title bar contents (title and "icon")
        const title = document.createElement('p');
        title.className = 'title';
        title.innerHTML = data.title;
        titleBar.appendChild(title);
        const expandIcon = document.createElement('p');
        expandIcon.innerHTML = '+';
        expandIcon.className = 'expand-icon'
        titleBar.appendChild(expandIcon);

        //Collapsed section
        const collapsedSection = document.createElement('div');
        collapsedSection.className = 'collapsed-section';
        section.appendChild(collapsedSection);

        //if it has editable inputs create the form
        if (!!data.inputs) {
            const formFilled = this.createFormFilled(data.inputs);

            //Add form to the collapsed section
            collapsedSection.appendChild(formFilled)
        }

        //If the inputs are not editable 
        if(data.static) {
            // do something
        }


        return section
    },

    createFormFilled: function (data) {
        const form = document.createElement('form')

        data.forEach((inputData) => {
            if (inputData.type === 'input') {
                const input = this.createInput(inputData);
                form.appendChild(input);
                return
            } else if (inputData.type === 'select') {
                const select = this.createSelect(inputData);
                form.appendChild(select);
                return
            }

        });

        const button = document.createElement('button');
        button.innerHTML = 'Submit Changes';
        button.type = 'button';
        button.className = 'btn btn-submit-changes disabled';
        button.setAttribute('disabled', true);
        form.appendChild(button);

        return form
    },

    createInput: function (data) {
        const inputDiv = document.createElement('div');
        inputDiv.className = 'input-div';

        //Create input label
        const label = document.createElement('label');
        label.htmlFor = data.label.toLowerCase();
        label.innerHTML = data.label;

        inputDiv.appendChild(label);

        //Create input
        const input = document.createElement('input');
        input.id = data.label.toLowerCase();
        input.type = 'text';
        input.value = data.value;
        input.className = 'form-input editable'
        input.setAttribute('data-path', data.dataPath)
        inputDiv.appendChild(input);

        return inputDiv
    },

    createSelect: function (data) {
        const selectDiv = document.createElement('div');
        selectDiv.className = 'input-div';

        //Create select label
        const label = document.createElement('label');
        label.htmlFor = data.label.toLowerCase();
        label.innerHTML = data.label;
        selectDiv.appendChild(label);

        //Create select
        const select = document.createElement('select');
        select.id = data.label.toLowerCase();
        select.name = data.label.toLowerCase();
        select.type = 'text';
        select.setAttribute('data-path', data.dataPath)

        //Create select options
        data.options.forEach((optionString) => {
            const option = document.createElement('option');
            option.value = optionString.toLowerCase();
            option.innerHTML = optionString
            select.appendChild(option);
        })
        // Must declare value after the options have been created
        select.value = data.value;
        selectDiv.appendChild(select);

        return selectDiv
    }
}

app.init();