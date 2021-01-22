const app = {
    init: function () {
        console.log('app initialized')

        this.getData();
    },

    getData: async function () {
        console.log('getting data...')
        const proxy = 'https://cors-anywhere.herokuapp.com/'
        const url = "http://127.0.0.1/aircontrol/get.php";

        const response = await fetch(url, {
            method: 'GET',
            origin: '*'
        })

        console.log('Response', response);

        const data = await response.json();

        console.log('JSON', data);
    }
}

app.init();