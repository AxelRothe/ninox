![‘npm version’](http://img.shields.io/npm/v/ninoxjs.svg?style=flat) ![‘downloads over month’](http://img.shields.io/npm/dm/ninoxjs.svg?style=flat)

ninoxjs 
========================

## 🤔 What is this?

This is a lightweight JS library for the Ninox REST API. This allows you to easily use the REST API in your JavaScript app without needing to look up your library ids and team ids or handle data encoding.

## 💡 What can I use it for?

I personally used this library to write endpoints for the following services:
 - server for app payment and license management
 - data analysis tools to analyse trends in data
 - employee dashboards
 - ticket systems
 - and more 

I'm excited to see what you are going to create with these tools. If you have any questions, please contact me at ✉️ [a.rothe@vanrothe.com](mailto:a.rothe@vanrothe.com)

---

**Can I help?** Submit your pull request with a detailed explaination or create a discussion beforehand.

---

## 🚀 Install

```shell
npm install ninoxjs --save
```

```js
const ninox = require('ninoxjs');
//or
import ninox from 'ninoxjs';
```

## 🧑‍🏫 Usage

`ninox.auth(options : NinoxOptions)` must be called once before using the API.

```javascript
import ninox from 'ninoxjs';

ninox.auth({
    uri: "https://api.ninoxdb.de", //optional
    version: "1", //optional
    authKey: "xxxxxx-xxxxx-xxxx-xxxx-xxxxxxxxxxxx",
    team: "YOUR_TEAM_NAME",
    database: "YOUR_DATABASE_NAME",
}).then(() => {
	console.log("Auth successful");

	ninox.getRecords('YOUR_TABLE_NAME').then(records => {
		console.log(records);
	})
}).catch(err => {
    console.log("Failed to connect to Ninox Cloud", err);
});
```
---
## Types

### NinoxRecord

```javascript
/**
 * @typedef {Object} NinoxRecord
 * @property {number} id - The id of the record
 * @property {number} sequence - The sequence of the record
 * @property {string} createdAt - The date the record was created
 * @property {string} createdBy - The user that created the record
 * @property {string} modifiedAt - The date the record was updated
 * @property {string} modifiedBy - The user that updated the record
 * @property {Object} fields - The content of the record
 **/
 ```

**Example:**
```
 {
   id: 6,
   sequence: 97,
   createdAt: '2022-06-28T19:35:01',
   createdBy: 'xxx',
   modifiedAt: '2022-07-02T12:34:39',
   modifiedBy: 'xxx',
   fields: {
       "Name": "My Deliverable",
       "Description": "This is a deliverable",
   },
  }
```

### NinoxOptions

```js
/**
* @typedef {Object} NinoxOptions
* @property {string} teamName - The name of the team to use
* @property {string} databaseName - The name of the database to use
* @property {string} authKey - The auth key for the API, can be found or created in the user account settings page of the ninox app
*/
```

**Example:**
```
{
    uri: "https://api.ninoxdb.de", //optional
    version: "1", //optional
    authKey: "xxxxxx-xxxxx-xxxx-xxxx-xxxxxxxxxxxx",
    team: "YOUR_TEAM_NAME",
    database: "YOUR_DATABASE_NAME",
}
```
---
## 🔦 Available methods

#### `getRecords(tableName : String, filters : Object, extractFields? : String[], excludeFields? : String[]) : Promise<NinoxRecord[]>`
Retrieves all `NinoxRecords` from the Table that match the filters.

Filters are always exact matches, use ninox.query to search with greater than, less than and other parameters.

**Usage:**
```javascript
ninox.getRecords(
	'YOUR_TABLE_NAME', // Table name
    {
        "First Name": 'John', 
        Age : 21,
        "Last Name": 'Doe'
    },
    ['name', 'age'] // Fields to extract, leave undefined to extract all fields
);

// or
ninox.getRecords(
	'YOUR_TABLE_NAME', // Table name
	{
		"First Name": 'John',
		Age : 21,
		"Last Name": 'Doe'
	},
    [], //extract all fields
	['Phone'] // but exclude the field Phone
);


// returns all NinoxRecords
await ninox.getRecords('YOUR_TABLE_NAME').then(records => {
    console.log(records);
})
```

#### `getRecord(tableName : String, id : Number, extractFields? : String[], excludeFields? : String[]) : Promise<NinoxRecord>`
Returns a `NinoxRecord` from a table by id

**Usage:**

```javascript

//returns a NinoxRecord with id 123 and trims the data to just the Age field
ninox.getRecord("YOUR_TABLE_NAME", 123, ['Age']).then(function(record) {
        console.log(record);
    }
)

//returns a NinoxRecord with id 123 and all fields
ninox.getRecord("YOUR_TABLE_NAME", 123).then(function(record) {
        console.log(record);
    }
)
```

#### `saveRecords(tableName : String, records : NinoxRecord[]) : Promise<Boolean>`
Saves `NinoxRecords` to a table in the database, omitting the id will create a new `NinoxRecord`, with the id will update the `NinoxRecord`

**Usage:**

```javascript

//updates a NinoxRecord with id 1 with the data in the fields object
ninox.saveRecords("YOUR_TABLE_NAME", [{
	id: "1",
	fields: {
		field1: "value1",
		field2: "value2"
	},
}]);

//creates a NinoxRecord with the data in the fields object
ninox.saveRecords("YOUR_TABLE_NAME", [{
	fields: {
		field3: "value3",
		field4: "value4"
	},
}]);
```

#### `deleteRecord(tableName : String, id : Number) : Promise<Boolean>`
Deletes `NinoxRecords` from a table in the database.

**Usage:**
```javascript
ninox.deleteRecord("YOUR_TABLE_NAME", 123).then(function(record) {
        console.log(record);
    }
)
```

#### `deleteRecords(tableName : String, ids : Number[]) : Promise<Boolean>`
Deletes all `NinoxRecord`s from a table in the database.

**Usage:**
```javascript
ninox.deleteRecords("YOUR_TABLE_NAME", [123, 124, 125]).then(function(record) {
        console.log(record);
    }
)
```
#### `query(tableName : String, query : String) : Promise<Number|String|Array>`

Allows you to query the database directly with a NX-Script. 

> Note: 
> This acts the same as a Formula, you can not write data.

**Usage:**
```javascript
let name = "John"
let age = 21;
n.query(
`let list := (select YOUR_TABLE_NAME['First Name'="${name}" and Age >= ${age}]);
 for l in list do
 {
    "age": l.Age,
    "name": l.'First Name'
 }
 end;
`).then(function(result) {
    console.log(result) // > [{age: 21, name: "John"}]
}).catch(function(err) {
	console.log(err);
});
```

#### `exec(query : String) : Promise<Number|String|Array>`
Allows you to execute NX-Script directly on the database.

**Usage:**
```javascript
let name = "John"
let age = 21;
n.query(
`let t := first(select YOUR_TABLE_NAME['First Name'="${name}" and Age >= ${age}]);
t.Title := "New Title";
t.Title;
`).then(function(result) {
	console.log(result); // > New Title
}).catch(function(err) {
	console.log(err);
});
```

> Note:
> This acts the same as a Button. Careful with this one, you can write data.

#### `getFile() : Promise<String>`
Returns the contents of a file from the database.

**Usage:**
```javascript
const RECORD_ID = 123;
const FILE_NAME = "image.png";
ninox.getFile("YOUR_TABLE_NAME", RECORD_ID, FILE_NAME).then(function(file) {
    if (file){
        console.log("success");
    }
}).catch(function(err) {
    console.log(err);
});
```

