const app = {
    data: {},

    init: function () {
        console.log('app initialized')

        this.getData();
    },

    getData: async function () {
        console.log('getting data...')
        const url = "http://127.0.0.1/aircontrol/get.php";

        const response = await fetch(url, {
            method: 'GET',
        })

        console.log('Response', response);

        const data = await response.json();

        this.data = data;

        console.log('THIS DATA', this.data)
    }
}

const view = {
    render: function () {

    }
}

app.init();