![‘npm version’](http://img.shields.io/npm/v/ninoxjs.svg?style=flat) ![‘downloads over month’](http://img.shields.io/npm/dm/ninoxjs.svg?style=flat)

ninox.js
========================

## What is this?

This is a simple JavaScript wrapper for Ninox API. This allows you to easily use Ninox API in your JavaScript code without needing to write REST API Calls.

## Install

```
npm install ninoxjs --save
```

### Example

```javascript
const ninox = require('ninoxjs');

ninox.auth({
    authKey: 'YOUR_AUTH_KEY',
    team: 'YOUR_TEAM_NAME',
    database: 'YOUR_DATABASE_NAME'
}).getRecords('YOUR_TABLE_NAME', [{
	name: 'John'
}], ['name', 'age']).then(function(records) {
    console.log(records);
});
```

`auth()` must be called once before using the API. It returns a Promise that resolve to itself so you can chain commands.

## Available methods

### getRecords
Retrieves all Records from the Table that match the filters.

Usage:
```javascript
ninox.getRecords(
	'YOUR_TABLE_NAME', // Table name
    [{
        name: 'John' // Filter
    }],
    ['name', 'age'] // Fields to retrieve
);
```

### getRecord
Returns a record from a table by id

Usage:
```javascript
ninox.getRecord("YOUR_TABLE_NAME", 123).then(function(record) {
        console.log(record);
    }
)
```

### saveRecords
Saves Records to a table in the database, omitting the id will create a new record, with the id will update the record

Usage:
```javascript
ninox.saveRecords("YOUR_TABLE_NAME", [{
	id: "1",
	fields: {
		field1: "value1",
		field2: "value2"
	},
}]);
```

### deleteRecord
Deletes Records from a table in the database.

Usage:
```javascript
ninox.deleteRecord("YOUR_TABLE_NAME", 123);
```

### deleteRecords
Deletes all Records from a table in the database (very slow, since it deletes all records with individual API calls).

Usage:
```javascript
ninox.deleteRecords("YOUR_TABLE_NAME", [123, 124, 125]);
```
