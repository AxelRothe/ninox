const ninox = require('../src/ninox.js');
const dotenv = require('dotenv');
dotenv.config();

ninox.auth({
	uri: "https://api.ninoxdb.de", //optional
	version: "1", //optional
	authKey: process.env.NINOX_AUTH_KEY,
	team: process.env.NINOX_TEAM,
	database: process.env.NINOX_DATABASE,
}).then(() => {
	console.log("Auth successful");

	ninox.getRecords(process.env.NINOX_TABLE).then(records => {
		console.log(records);
	})
	ninox.query(`select Usage[Customer = 32]
                `).then(records => {
		console.log(records);
	})

}).catch(err => {
	console.log("Failed to connect to Ninox Cloud", err);
});