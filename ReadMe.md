![‘npm version’](http://img.shields.io/npm/v/ninoxjs.svg?style=flat) ![‘downloads over month’](http://img.shields.io/npm/dm/ninoxjs.svg?style=flat)

ninox.js
========================

## What is this?

This is a lightweight JS utility library for the Ninox REST API. This allows you to easily use the REST API in your JavaScript app without needing to look up your library ids and team ids or handle data transformations.

## What can I use it for?

I personally used this code base to write endpoints for the following services:
 - server for app payment and license management
 - data analysis tools to analyse trends in data
 - employee dashboards
 - ticket systems
 - and more

I'm excited to see what you are going to create with these tools.

## Install

```
npm install ninoxjs --save
```

#### CommonJS
`const ninox = require('ninoxjs');`

### Usage

`ninox.auth(options)` must be called once before using the API.

```javascript
const ninox = require('ninoxjs/index.cjs');

ninox.auth({
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

## Types

### NinoxRecord

```javascript
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
```

## Available methods

### getRecords
Retrieves all NinoxRecords from the Table that match the filters.

Filters are always exact matches, use ninox.query to search with greater than, less than and other parameters.

Usage:
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

// returns all NinoxRecords
await ninox.getRecords('YOUR_TABLE_NAME').then(records => {
    console.log(records);
})
```

### getRecord
Returns a NinoxRecord from a table by id

Usage:

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

### saveRecords
Saves NinoxRecords to a table in the database, omitting the id will create a new NinoxRecord, with the id will update the NinoxRecord

Usage:

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

### deleteRecord
Deletes NinoxRecords from a table in the database.

Usage:
```javascript
ninox.deleteRecord("YOUR_TABLE_NAME", 123).then(function(record) {
        console.log(record);
    }
)
```

### deleteRecords
Deletes all NinoxRecords from a table in the database (very slow, since it deletes all NinoxRecords with individual API calls).

Usage:
```javascript
ninox.deleteRecords("YOUR_TABLE_NAME", [123, 124, 125]).then(function(record) {
        console.log(record);
    }
)
```
### query
Allows you to query the database directly with a NXScript, which can do greater than, less than and other functions like contain() etc.

**note**: this doesn't allow you to modify the database directly, only read it. Also Ids returned via query() will carry their table prefix (e.g. "A36")

Usage:
```javascript
let name = "John"
let age = 21;
n.query(`(select YOUR_TABLE_NAME['First Name'="${name}" and Age >= ${age}])`).then(function(result) {
	console.log(result); //['A2','A7', 'A8']
    const ids = result.map(r => r.replace(/\D/g,'')) //remove the table prefix);
    
	n.getRecords('YOUR_TABLE_NAME', ids).then(function(records) {
		console.log(records);
	})

}).catch(function(err) {
	console.log(err);
});
```

