const axios = require("axios");

/**
 * @class Ninox
 * Handles the communication with the Ninox API
 */
class Ninox {

	/**
	 * @typedef {Object} NinoxRecord
	 * @property {number} id - The id of the record
	 * @property {number} sequence - The sequence of the record
	 * @property {string} createdAt - The date the record was created
	 * @property {string} createdBy - The user that created the record
	 * @property {string} modifiedAt - The date the record was updated
	 * @property {string} modifiedBy - The user that updated the record
	 * @property {Object} fields - The fields of the record
	 *
	 * @example
	 * {
	 *  id: 6,
	 *  sequence: 97,
	 *  createdAt: '2022-06-28T19:35:01',
	 *  createdBy: 'xxx',
	 *  modifiedAt: '2022-07-02T12:34:39',
	 *  modifiedBy: 'xxx',
	 *  fields: {
	 *      "Name": "My Deliverable",
	 *      "Description": "This is a deliverable",
	 *  },
	 * }
	 */

	/**
	 * @type {string}
	 * The name of the team
	 */
	teamName;

	/**
	 * @type {string}
	 * The id of the team
	 */
	teamId;

	/**
	 * @type {string}
	 * the database id
	 */
	databaseId;

	/**
	 * @type {string}
	 * the database name to use
	 */
	databaseName;

	/**
	 * @type {string}
	 * The auth key to use to authenticate with the Ninox API
	 */
	authKey

	/**
	 * @typedef {Object} NinoxOptions
	 * @property {string} teamName - The name of the team to use
	 * @property {string} databaseName - The name of the database to use
	 * @property {string} authKey - The auth key for the API, can be found or created in the user account settings page of the ninox app
	 *
	 * @example
	 * {
	 * 	authKey: "xxxxxx-xxxxx-xxxx-xxxx-xxxxxxxxxxxx",
	 * 	team: "YOUR_TEAM_NAME",
	 * 	database: "YOUR_DATABASE_NAME",
	 * }
	 */

	/**
	 * @example
	 * ninox.auth({
	 *  uri: "https://api.ninox.com",
	 *  version: "1",
	 * 	authKey: "xxxxxx-xxxxx-xxxx-xxxx-xxxxxxxxxxxx",
	 * 	team: "YOUR_TEAM_NAME",
	 * 	database: "YOUR_DATABASE_NAME",
	 * }).then(() => {
	 * 	console.log("Auth successful");
	 * 	ninox.getRecords('YOUR_TABLE_NAME').then(records => {
	 * 		console.log(records);
	 * 	})
	 * })
	 *
	 * @param options
	 * @returns {Promise<Ninox>}
	 */
	async auth(options) {
		if (!options.authKey) throw new Error("authKey is required");

		if (!options.team) throw new Error("team is required");
		if (!options.database) throw new Error("database is required");

		this.uri = options.uri ? options.uri : "https://api.ninoxdb.de";
		this.version = options.version ? options.version : "1";

		this.authKey = options.authKey;
		await this.#getTeams();
		this.#getTeamByName(options.team);
		await this.#getDatabases();
		this.#getDatabaseByName(options.database);
		return this;
	}

	async #getTeams(){
		const response = await axios.get(
			`${this.uri}/v${this.version}/teams/`,
			{
				method: "get",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);
		if (response.status === 200) {
			this.teams = response.data;
		} else if (response.status === 401) {
			throw new Error("Invalid auth key");
		} else {
			throw new Error("Unknown error");
		}
	}

	async #getDatabases(){
		const response = await axios.get(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases`,
			{
				method: "get",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);
		this.databases = response.data;
	}

	#getTeamByName(teamName) {
		const team = this.teams.find(i=>i.name === teamName);
		if (team) {
			this.teamId = team.id;
		} else {
			throw new Error("Team not found");
		}
	}

	#getDatabaseByName(databaseName) {
		const database = this.databases.find(i=>i.name === databaseName);
		if (database) {
			this.databaseId = database.id;
		} else {
			throw new Error("Database not found");
		}
	}

	/**
	 * Retrieves all Records from the Table that match the filters
	 *
	 * @param table - The table to retrieve the record from
	 * @param filters - An array of filters to apply to the query (see https://docs.ninox.com/)
	 * @param fieldsToExtract - use this to trim the fields you want to return
	 * @param fieldsToExclude
	 * @returns {Promise<NinoxRecord[]>}
	 */
	async getRecords(table, filters = {}, fieldsToExtract = [], fieldsToExclude = []) {

		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const response = await axios.get(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${
				this.databaseId
			}/tables/${table}/records?pages=9999&perPage=9999&filters=${encodeURIComponent(
				JSON.stringify({ fields: filters })
			)}`,
			{
				method: "get",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);
		const list = response.data; //await response.json();

		if (fieldsToExtract.length > 0) {
			for (let item of list) {
				item.fields = Ninox.extractFields(item, fieldsToExtract);
			}
		}
		if (fieldsToExclude.length > 0) {
			for (let item of list) {
				item.fields = Ninox.excludeFields(item, fieldsToExclude);
			}
		}
		return list;
	}

	/**
	 * Returns a record from a table by id
	 *
	 * @param table - The table to retrieve the record from
	 * @param id - The id of the record to retrieve
	 * @param fieldsToExtract - use this to trim the fields you want to return
	 * @param fieldsToExclude
	 * @returns {Promise<NinoxRecord>}
	 */
	async getRecord(table, id, fieldsToExtract = [], fieldsToExclude = []) {

		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const response = await axios.get(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${this.databaseId}/tables/${table}/records/${id}`,
			{
				method: "get",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);
		const item = response.data;
		if (fieldsToExtract.length > 0) {
			item.fields = Ninox.extractFields(item, fieldsToExtract);
		}
		if (fieldsToExclude.length > 0) {
			item.fields = Ninox.excludeFields(item, fieldsToExclude);
		}
		return item;
	}

	static extractFields(content, array) {
		let newFields = {};

		for (let item of array) {
			if (content.fields[item]) {
				newFields[item] = content.fields[item];
			}
		}

		return newFields;
	}

	static excludeFields(content, array) {
		let newFields = {};

		for (let item of Object.keys(content.fields)) {
			if (!array.includes(item)) {
				newFields[item] = content.fields[item];
			}
		}

		return newFields;
	}

	/**
	 * Saves Records to a table in the database, omitting the id will create a new record, with the id will update the record
	 *
	 * @example
	 * ninox.saveRecords("table", [{
	 *    id: "1",
	 *    fields: {
	 *      field1: "value1",
	 *      field2: "value2"
	 *    },
	 *  }]);
	 *
	 * @param {String} table - The table to save the record to
	 * @param {NinoxRecord} records - An array of records to save
	 * @returns {Promise<{success : Boolean, ids: String[]}>}
	 */
	async saveRecords(table, records) {

		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const result = await axios.post(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${this.databaseId}/tables/${table}/records`,
			records,
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);

		return {
			success: result.status === 200,
			ids: result.data.map(i=>i.id),
		};
	}

	/**
	 * Deletes Records from a table in the database
	 *
	 * @param table - The table to delete the record from
	 * @param id - The id of the record to delete
	 * @returns {Promise<boolean>} - Returns true if the request was successful
	 */
	async deleteRecord(table, id) {
		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const result = await axios.delete(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${this.databaseId}/tables/${table}/records/${id}`,
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);

		return result.status === 200;
	}

	/**
	 * Deletes all Records from a table in the database (very slow)
	 *
	 * @param table - The table to delete the record from
	 * @param ids - An array of ids to delete
	 * @returns Promise<boolean> - Returns true if all requests were successful
	 */
	async deleteRecords(table, ids) {
		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");
		let result = true;
		for (let id of ids) {
			result = result && await this.deleteRecord(table, id);
		}
		return result;
	}

	/**
	 * Sends a NX Script query to the ninox serverr
	 *
	 * @example
	 * let name = "John"
	 * let age = 21;
	 * 	n.query(`first((select YOUR_TABLE_NAME['First Name'="${name}" and Age >= ${age}])).Id`).then(function(result) {
	 * 		console.log(result); //A6
	 * 		const id = result.replace(/\D/g,'') //remove all non-digits (the table Id is a prefix)
	 * 		n.getRecord('YOUR_TABLE_NAME', id).then(function(record) {
	 * 			console.log(record);
	 * 		})
	 *
	 * 	}).catch(function(err) {
	 * 		console.log(err);
	 * 	});
	 *
	 * @param query
	 * @returns {Promise<Number|String|Array>}
	 */
	async query(query) {
		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const result = await axios.get(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${this.databaseId}/query?query=${encodeURIComponent(query)}`,
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);

		return result.data;
	}

	async exec(script) {
		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const result = await axios.post(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${this.databaseId}/exec`,
			{query: script},
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);

		return result.data;
	}

	async getFile(tableId, recordId, fileName) {
		if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call auth() first");

		const result = await axios.get(
			`${this.uri}/v${this.version}/teams/${this.teamId}/databases/${this.databaseId}/tables/${tableId}/records/${recordId}/files/${fileName}`,
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.authKey}`,
				},
			}
		);

		return result.data;
	}

}
module.exports = new Ninox();