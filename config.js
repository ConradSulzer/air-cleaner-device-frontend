window.appConfig = {
    hourPicker: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minutePicker: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    secondsPicker: function () {
        const seconds = [];
        for (var i = 0; i < 60; i++) {
            seconds.push(i);
        }
        return seconds;
    },
    datesPicker: function () {
        const dates = [];
        for (var i = 0; i < 32; i++) {
            dates.push(i);
        }
        return dates;
    },
    monthPicker: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    sections: [
        {
            key: 'wifi',
            title: 'WIFI Settings',
            type: 'inputs',
            pathHead: `app.deviceData.wifi.`,
            editable: true,
            selectors: [
                {
                    key: 'mode',
                    label: 'Mode',
                    options: [
                        { show: 'Select One', value: 'Select One' },
                        { show: 'Server', value: 'server' },
                        { show: 'Client', value: 'client' },
                        { show: 'Disabled', value: 'disabled' }
                    ]
                }
            ],
            inputs: [
                { key: 'ssid', label: 'SSID', readonly: false },
                { key: 'pass', label: 'Password', readonly: false },
                { key: 'ip', label: 'IP', readonly: false },
                { key: 'subnet', label: 'Subnet', readonly: false },
                { key: 'gateway', label: 'Gateway', readonly: false },
            ],
            order: ['mode', 'ssid', 'pass', 'ip', 'subnet', 'gateway']
        },
        {
            key: 'diagnostic',
            title: 'Diagnostic Info',
            type: 'inputs',
            pathHead: `app.deviceData.diagnostic.`,
            editable: false,
            inputs: [
                { key: 'rssi', label:'WIFI Signal Strength (dB)', readonly: true },
                { key: 'timeouts', label: 'WIFI Timeouts (dB)', readonly: true },
                { key: 'motor.speed', label: 'Current Motor Speed (Hz)', readonly: true },
                { key: 'motor.min', label: 'Current Motor Min (Hz)', readonly: true },
                { key: 'motor.max', label: 'Current Motor Max (Hz)', readonly: true },
                { key: 'motor.cycles', label: 'Motor Cyces', readonly: true },
                { key: 'unitHours', label: 'Unit Hours', readonly: true }
            ],
            order: ['rssi', 'timeouts', 'motor.speed', 'motor.min', 'motor.max', 'motor.cycles', 'unitHours']
        }
    ],
}