(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window['FlexibleDB'] = mod;
  }
  if (typeof global !== 'undefined') {
    global['FlexibleDB'] = mod;
  }
  if (typeof module !== 'undefined') {
    module.exports = mod;
  }
})(function () {

  const SELECT_ALL_FILTER = function(it) {
    return true;
  };

  const AssertionError = class extends Error {
    constructor(...args) {
      super(...args);
      this.name = "AssertionError";
    }
  };

  const IntegrityError = class extends Error {
    constructor(...args) {
      super(...args);
      this.name = "IntegrityError";
    }
  };

  const assertion = function (condition, errorMessage, throwError = true) {
    if (condition) {
      return true;
    }
    const error = new AssertionError(errorMessage);
    if (throwError) {
      throw error;
    }
    return error;
  };

  const FlexibleDBBasicLayer = class {

    static AssertionError = AssertionError;
    
    static IntegrityError = IntegrityError;
    
    static assertion = assertion;

    static type(typeOfColumn, otherProperties = {}) {
      return {
        type: typeOfColumn,
        ...otherProperties,
      };
    }

    static create(...args) {
      return new this(...args);
    }

    static defaultOptions = {
      trace: false,
      onPersist: (db) => {},
    };

    static knownTypes = ["boolean", "integer", "float", "string", "object", "array", "object-reference", "array-reference"];

    constructor(options = {}) {
      this.$options = Object.assign({}, this.constructor.defaultOptions, options);
      this.$ids = {};
      this.$data = {};
      this.$schema = false;
    }

    trace(methodId) {
      if(this.$options.trace) {
        console.log("[trace][flexible-db] " + methodId);
      }
    }

    ensureTable(table) {
      this.trace("ensureTable");
      if(!(table in this.$data)) {
        this.$data[table] = {};
      }
    }

    consumeIdOf(table) {
      this.trace("consumeIdOf");
      assertion(typeof table === "string", "Parameter «table» must be a string on «consumeIdOf»");
      assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «consumeIdOf»");
      if (!(table in this.$ids)) {
        this.$ids[table] = 0;
      }
      return ++this.$ids[table];
    }

    setSchema(schema) {
      this.trace("setSchema");
      assertion(typeof schema === "object", "Parameter «schema» must be an object on «setSchema»");
      const tableIds = Object.keys(schema);
      for (let indexTables = 0; indexTables < tableIds.length; indexTables++) {
        const tableId = tableIds[indexTables];
        const tableMetadata = schema[tableId];
        assertion(typeof tableMetadata === "object", `Schema table «${tableId}» must be an object on «setSchema»`);
        const columnIds = Object.keys(tableMetadata);
        for (let indexColumns = 0; indexColumns < columnIds.length; indexColumns++) {
          const columnId = columnIds[indexColumns];
          const columnMetadata = tableMetadata[columnId];
          assertion(typeof columnMetadata === "object", `Schema column «${tableId}.${columnId}» must be an object on «setSchema»`);
          assertion(typeof columnMetadata.type === "string", `Schema column type «${tableId}.${columnId}» must be a string on «setSchema»`);
          assertion(this.constructor.knownTypes.indexOf(columnMetadata.type) !== -1, `Schema column type «${tableId}.${columnId}» must be a known type, this is «${this.constructor.knownTypes.join("|")}» on «setSchema»`);
          if(columnMetadata.type === "object-reference") {
            assertion(typeof columnMetadata.referredTable === "string", `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a string on «setSchema»`);
            assertion(columnMetadata.referredTable in schema, `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a known table on «setSchema»`);
          } else if(columnMetadata.type === "array-reference") {
            assertion(typeof columnMetadata.referredTable === "string", `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a string on «setSchema»`);
            assertion(columnMetadata.referredTable in schema, `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a known table on «setSchema»`);
          }
        }
      }
      this.$schema = schema;
      this.persistDatabase();
    }

    getSchema() {
      this.trace("getSchema");
      return this.$schema;
    }

    validateProperties(table, value, contextId) {
      this.trace("validateProperties");
      const properties = Object.keys(value);
      const tableMetadata = this.$schema[table];
      Iterating_properties:
      for (let indexProperties = 0; indexProperties < properties.length; indexProperties++) {
        const propertyId = properties[indexProperties];
        assertion(propertyId in tableMetadata, `Property «${propertyId}» must be a known column by the table in the schema on «${contextId}»`);
        const columnMetadata = tableMetadata[propertyId];
        if (columnMetadata.type === "boolean") {
          assertion(typeof value[propertyId] === "boolean", `Property «${propertyId}» must be a boolean on «${contextId}»`);
        } else if (columnMetadata.type === "integer") {
          assertion(typeof value[propertyId] === "number", `Property «${propertyId}» must be a number on «${contextId}»`);
          assertion((value[propertyId] % 1) === 0, `Property «${propertyId}» must be an integer number on «${contextId}»`);
        } else if (columnMetadata.type === "float") {
          assertion(typeof value[propertyId] === "number", `Property «${propertyId}» must be a number on «${contextId}»`);
        } else if (columnMetadata.type === "string") {
          assertion(typeof value[propertyId] === "string", `Property «${propertyId}» must be a string on «${contextId}»`);
        } else if (columnMetadata.type === "object") {
          assertion(typeof value[propertyId] === "object", `Property «${propertyId}» must be an object on «${contextId}»`);
        } else if (columnMetadata.type === "array") {
          assertion(Array.isArray(value[propertyId]), `Property «${propertyId}» must be an array on «${contextId}»`);
        } else if (columnMetadata.type === "object-reference") {
          assertion(typeof value[propertyId] === "number", `Property «${propertyId}» must be a number on «${contextId}»`);
        } else if (columnMetadata.type === "array-reference") {
          assertion(Array.isArray(value[propertyId]), `Property «${propertyId}» must be an array on «${contextId}»`);
          for (let indexItems = 0; indexItems < value[propertyId].length; indexItems++) {
            const item = value[propertyId][indexItems];
            assertion(typeof item === "number", `Property «${propertyId}» on index «${indexItems}» must be a number on «${contextId}»`);
          }
        }
      }
    }

    dehydrate() {
      this.trace("dehydrate");
      return JSON.stringify({
        ids: this.$ids,
        data: this.$data,
        schema: this.$schema,
      });
    }

    hydrate(stringifiedDatabase) {
      this.trace("hydrate");
      assertion(typeof stringifiedDatabase === "string", `Parameter «stringifiedDatabase» must be a string on «hydrate»`);
      const db = JSON.parse(stringifiedDatabase);
      assertion(typeof db === "object", `Parameter «stringifiedDatabase» must be a JSON of type object on «hydrate»`);
      assertion(typeof db.ids === "object", `Parameter «stringifiedDatabase» must be a JSON of type object containing property «ids» as object on «hydrate»`);
      assertion(typeof db.data === "object", `Parameter «stringifiedDatabase» must be a JSON of type object containing property «data» as object on «hydrate»`);
      assertion(typeof db.schema === "object", `Parameter «stringifiedDatabase» must be a JSON of type object containing property «schema» as object on «hydrate»`);
      this.$ids = db.ids;
      this.$data = db.data;
      this.$schema = db.schema;
      this.persistDatabase();
    }

    reset() {
      this.trace("reset");
      this.$ids = {};
      this.$data = {};
      this.$schema = {};
      this.persistDatabase();
    }

    checkIntegrityFree(table, id) {
      this.trace("checkIntegrityFree");
      const tableIds = Object.keys(this.$schema);
      Iterating_tables:
      for(let indexTables=0; indexTables<tableIds.length; indexTables++) {
        const tableId = tableIds[indexTables];
        const columnIds = Object.keys(this.$schema[tableId]);
        Iterating_columns:
        for(let indexColumns=0; indexColumns<columnIds.length; indexColumns++) {
          const columnId = columnIds[indexColumns];
          const columnMetadata = this.$schema[tableId][columnId];
          const isObjectReference = columnMetadata.type === "object-reference";
          const isArrayReference = columnMetadata.type === "array-reference";
          if((!isObjectReference) && (!isArrayReference)) {
            continue Iterating_columns;
          }
          const isSameTable = columnMetadata.referredTable === table;
          if(!isSameTable) {
            continue Iterating_columns;
          }
          const referableRows = Object.values(this.$data[tableId] || {});
          for(let indexRows=0; indexRows<referableRows.length; indexRows++) {
            const referableRow = referableRows[indexRows];
            if(isObjectReference) {
              const referableId = referableRow[columnId];
              if(referableId === id) {
                throw new IntegrityError(`Cannot delete «${table}#${id}» because it still exists as object on «${tableId}#${referableRow.id}.${columnId}» on «checkIntegrityFree»`);
              }
            } else if(isArrayReference) {
              const referableIds = referableRow[columnId];
              if(referableIds.indexOf(id) !== -1) {
                throw new IntegrityError(`Cannot delete «${table}#${id}» because it still exists as array item on «${tableId}#${referableRow.id}.${columnId}» on «checkIntegrityFree»`);
              }
            }
          }
        }
      }
    }

    persistDatabase() {
      this.trace("persistDatabase");
      this.$options.onPersist(this);
    }

  };

  const FlexibleDBCrudLayer = class extends FlexibleDBBasicLayer {

    selectMany(table, filter = SELECT_ALL_FILTER) {
      this.trace("selectMany");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «selectMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «selectMany»");
        assertion(typeof filter === "function", "Parameter «filter» must be a function on «selectMany»");
      }
      return Object.values(this.$data[table]).filter(filter);
    }

    insertOne(table, value) {
      this.trace("insertOne");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «insertOne»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «insertOne»");
        assertion(typeof value === "object", "Parameter «value» must be an object on «insertOne»");
      }
      Inserted_value_validation: {
        this.validateProperties(table, value, "insertOne");
      }
      this.ensureTable(table);
      const newId = this.consumeIdOf(table);
      this.$data[table][newId] = { id: newId, ...value };
      this.persistDatabase();
      return newId;
    }

    insertMany(table, values) {
      this.trace("insertMany");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «insertMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «insertMany»");
        assertion(Array.isArray(values), "Parameter «values» must be an array on «insertMany»");
      }
      Inserted_values_validation: {
        for (let indexValue = 0; indexValue < values.length; indexValue++) {
          const value = values[indexValue];
          this.validateProperties(table, value, "insertMany");
        }
      }
      this.ensureTable(table);
      const newIds = [];
      for(let indexValues=0; indexValues<values.length; indexValues++) {
        const value = values[indexValues];
        const newId = this.consumeIdOf(table);
        this.$data[table][newId] = { id: newId, ...value };
        newIds.push(newId);
      }
      this.persistDatabase();
      return newIds;
    }

    updateOne(table, id, properties) {
      this.trace("updateOne");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «updateOne»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «updateOne»");
        assertion(typeof id === "number", "Parameter «id» must be a number on «updateOne»");
        assertion(typeof properties === "object", "Parameter «properties» must be an object on «updateOne»");
      }
      Updated_value_validation: {
        this.validateProperties(table, properties, "updateOne");
        assertion(id in this.$data[table], `Parameter «id» (in this case «${id}») must be a known id for data table «${table}» on «updateOne»`);
      }
      this.$data[table][id] = Object.assign({}, this.$data[table][id], properties, { id });
      this.persistDatabase();
      return true;
    }

    updateMany(table, filter, properties) {
      this.trace("updateMany");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «updateMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «updateMany»");
        assertion(typeof filter === "function", "Parameter «filter» must be a function on «updateMany»");
        assertion(typeof properties === "object", "Parameter «properties» must be an object on «updateMany»");
      }
      Updated_value_validation: {
        this.validateProperties(table, properties, "updateMany");
      }
      const modifiedIds = [];
      let counter = 0;
      for(let id in this.$data[table]) {
        counter++;
        const value = this.$data[table][id];
        let isAccepted = false;
        try {
          isAccepted = filter(value, counter);
        } catch (error) {
          console.log(error);
        }
        if(isAccepted) {
          this.$data[table][id] = Object.assign({}, this.$data[table][id], properties, { id: parseInt(id) });
          modifiedIds.push(id);
        }
      }
      this.persistDatabase();
      return modifiedIds;
    }

    deleteOne(table, id) {
      this.trace("deleteOne");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «deleteOne»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «deleteOne»");
        assertion(typeof id === "number", "Parameter «id» must be a number on «deleteOne»");
      }
      Deleted_value_validation: {
        assertion(id in this.$data[table], `Parameter «id» (in this case «${id}») must be a known id for data table «${table}» on «deleteOne»`);
      }
      Deleted_integrity_validation: {
        this.checkIntegrityFree(table, id);
      }
      delete this.$data[table][id];
      this.persistDatabase();
      return true;
    }

    deleteMany(table, filter) {
      this.trace("deleteMany");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «deleteMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «deleteMany»");
        assertion(typeof filter === "function", "Parameter «filter» must be a function on «deleteMany»");
      }
      const deletedIds = [];
      let counter = 0;
      for(let id in this.$data[table]) {
        counter++;
        const value = this.$data[table][id];
        let isAccepted = false;
        try {
          isAccepted = filter(value, counter);
        } catch (error) {
          console.log(error);
        }
        if(isAccepted) {
          this.checkIntegrityFree(table, id);
          delete this.$data[table][id];
          deletedIds.push(id);
        }
      }
      this.persistDatabase();
      return deletedIds;
    }

  }

  const FlexibleDB = class extends FlexibleDBCrudLayer {

  };

  return FlexibleDB;

});