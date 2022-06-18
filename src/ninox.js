const axios = require("axios");

/**
 * @class Ninox
 * Handles the communication with the Ninox API
 */
class Ninox {

    /**
     * @typedef {Object} NinoxRecord
     * @property {string} id - The id of the record
     * @property {Object} fields - The fields of the record
     *
     * @example
     * {
     *  id: 123,
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
     */

    /**
     * @example
     * ninox.auth({ authKey: "xxxx-xxxx-xxxxx", team: "Team Name", database: "Database Name"});
     *
     * @param options
     * @returns {Promise<Ninox>}
     */
    async auth(options) {
        this.authKey = options.authKey || throw new Error("Auth key is required");
        await this.#getTeams();
        this.#getTeamByName(options.teamName || throw new Error("Team name is required"));
        await this.#getDatabases();
        this.#getDatabaseByName(options.databaseName || throw new Error("Database name is required"));
        return this;
   }

    async #getTeams(){
        const response = await axios.get(
            `https://api.ninox.com/v1/teams/`,
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
            `https://api.ninox.com/v1/teams/${this.teamId}/databases`,
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
        this.teamId = this.teams.find(i=>i.name === teamName).id || throw new Error("Team not found");
    }

    #getDatabaseByName(databaseName) {
        this.databaseId = this.databases.find(i=>i.name === databaseName).id || throw new Error("Database not found");
    }

    /**
     * Retrieves all Records from the Table that match the filters
     *
     * @param table - The table to retrieve the record from
     * @param filters - An array of filters to apply to the query (see https://docs.ninox.com/)
     * @param fieldsToExtract - use this to trim the fields you want to return
     * @returns {Promise<NinoxRecord[]>}
     */
    async getRecords(table, filters = {}, fieldsToExtract = []) {

        if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call init() first");

        const response = await axios.get(
            `https://api.ninox.com/v1/teams/${this.teamId}/databases/${
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
        return list;
    }

    /**
     * Returns a record from a table by id
     *
     * @param table - The table to retrieve the record from
     * @param id - The id of the record to retrieve
     * @param fieldsToExtract - use this to trim the fields you want to return
     * @returns {Promise<NinoxRecord>}
     */
    async getRecord(table, id, fieldsToExtract = []) {

        if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call init() first");

        const response = await axios.get(
            `https://api.ninox.com/v1/teams/${this.teamId}/databases/${this.databaseId}/tables/${table}/records/${id}`,
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
     * @returns {Promise<boolean>} - Returns true if the request was successful
     */
    async saveRecords(table, records) {

        if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call init() first");

        const result = await axios.post(
            `https://api.ninox.com/v1/teams/${this.teamId}/databases/${this.databaseId}/tables/${table}/records`,
            records,
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
     * Deletes Records from a table in the database
     *
     * @param table - The table to delete the record from
     * @param id - The id of the record to delete
     * @returns {Promise<boolean>} - Returns true if the request was successful
     */
    async deleteRecord(table, id) {
        if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call init() first");

        const result = await axios.delete(
            `https://api.ninox.com/v1/teams/${this.teamId}/databases/${this.databaseId}/tables/${table}/records/${id}`,
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
     * @returns {Promise<boolean>} - Returns true if all requests were successful
     */
    async deleteRecords(table, ids) {
        if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call init() first");
        let result = true;
        for (let id of ids) {
            result = result && await this.deleteRecord(table, id);
        }
        return result;
    }

    /**
     * Sends a NX Script query to the ninox server
     *
     * @example
     * ninox.query("(select contact).'Email'");
     *
     * @param query
     * @returns {Promise<Number|String|Array>}
     */
    async query(query) {
        if (!this.databaseId || !this.teamId) throw new Error("Database and team are required. Call init() first");

        const result = await axios.post(
            `https://api.ninox.com/v1/teams/${this.teamId}/databases/${this.databaseId}/query`,
            query,
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
export default new Ninox();
