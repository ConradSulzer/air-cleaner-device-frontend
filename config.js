export const sections = [
    {
        title: 'Wifi Setings',
        items: [
            {
                label: 'Mode',
                type: 'select',
                value: '',
                options: ['Select One', 'Server', 'Client', 'Disabled']
            },
            {
                label: 'SSID',
                type: 'input',
                value: ''
            },
            {
                label: 'SSID',
                type: 'input',
                value: app.data.wifi.ssid
            },
        ]
    }
]

console.log(sections[0]['items'][1]['value'])