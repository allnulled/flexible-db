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

  const SELECT_ALL_FILTER = function (it) {
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
      lockingCheckInterval: 10,
      lockingFile: typeof global !== "undefined" ? require("path").resolve(process.cwd(), "db-locker.txt") : false,
      onPersist: function (db) { },
      onTrigger: function (event, parameters, db) { },
      onLock: async function (db) {
        if (typeof global === "undefined") return false;
        const fs = require("fs").promises;
        let isLocked = true;
        while (isLocked) {
          const contents = await fs.readFile(db.$options.lockingFile, "utf8");
          if (contents === "0") {
            isLocked = false;
          }
          await new Promise(function (resolve) {
            setTimeout(resolve, db.$options.lockingCheckInterval);
          });
        }
        await fs.writeFile(db.$options.lockingFile, "1", "utf8");
      },
      onUnlock: async function (db) {
        if (typeof global === "undefined") return false;
        const fs = require("fs").promises;
        fs.writeFile(db.$options.lockingFile, "0", "utf8");
      },
    };

    static knownTypes = ["boolean", "integer", "float", "string", "object", "array", "object-reference", "array-reference"];

    constructor(options = {}) {
      this.$options = Object.assign({}, this.constructor.defaultOptions, options);
      this.$ids = {};
      this.$data = {};
      this.$schema = false;
      if (typeof global !== "undefined") {
        require("fs").writeFileSync(this.$options.lockingFile, "0", "utf8");
      }
    }

    trace(methodId) {
      if (this.$options.trace) {
        console.log("[trace][flexible-db] " + methodId);
      }
    }

    ensureTable(table) {
      this.trace("ensureTable");
      if (!(table in this.$data)) {
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

    async setSchema(schema) {
      this.trace("setSchema");
      await this.$options.onLock(this);
      try {
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
            if (columnMetadata.type === "object-reference") {
              assertion(typeof columnMetadata.referredTable === "string", `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a string on «setSchema»`);
              assertion(columnMetadata.referredTable in schema, `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a known table on «setSchema»`);
            } else if (columnMetadata.type === "array-reference") {
              assertion(typeof columnMetadata.referredTable === "string", `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a string on «setSchema»`);
              assertion(columnMetadata.referredTable in schema, `Schema column type «${tableId}.${columnId}» requires property «referredTable» to be a known table on «setSchema»`);
            }
          }
        }
        this.$schema = schema;
        await this.persistDatabase();
        await this.triggerDatabase("setSchema", [schema]);
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async getSchema() {
      this.trace("getSchema");
      await this.triggerDatabase("getSchema", [schema]);
      return this.$schema;
    }

    validateProperties(table, value, contextId) {
      this.trace("validateProperties");
      const properties = Object.keys(value);
      const tableMetadata = this.$schema[table];
      Iterating_properties:
      for (let indexProperties = 0; indexProperties < properties.length; indexProperties++) {
        const propertyId = properties[indexProperties];
        if(propertyId === "id") {
          continue Iterating_properties;
        }
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

    async dehydrate() {
      this.trace("dehydrate");
      await this.triggerDatabase("dehydrate", []);
      return JSON.stringify({
        ids: this.$ids,
        data: this.$data,
        schema: this.$schema,
      });
    }

    async hydrate(stringifiedDatabase) {
      this.trace("hydrate");
      await this.$options.onLock(this);
      try {
        assertion(typeof stringifiedDatabase === "string", `Parameter «stringifiedDatabase» must be a string on «hydrate»`);
        const db = JSON.parse(stringifiedDatabase);
        assertion(typeof db === "object", `Parameter «stringifiedDatabase» must be a JSON of type object on «hydrate»`);
        assertion(typeof db.ids === "object", `Parameter «stringifiedDatabase» must be a JSON of type object containing property «ids» as object on «hydrate»`);
        assertion(typeof db.data === "object", `Parameter «stringifiedDatabase» must be a JSON of type object containing property «data» as object on «hydrate»`);
        assertion(typeof db.schema === "object", `Parameter «stringifiedDatabase» must be a JSON of type object containing property «schema» as object on «hydrate»`);
        this.$ids = db.ids;
        this.$data = db.data;
        this.$schema = db.schema;
        await this.triggerDatabase("hydrate", [stringifiedDatabase]);
        await this.persistDatabase();
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async renameTable(table, newName) {
      this.trace("renameTable");
      assertion(typeof table === "string", `Parameter «table» must be a string on «renameTable»`);
      assertion(typeof newName === "string", `Parameter «table» must be a string on «renameTable»`);
      assertion(table !== newName, `Parameter «table» cannot be equal to parameter «newName» on «renameTable»`);
      assertion(table in this.$schema, `Parameter «table» must be an existing table in the schema on «renameTable»`);
      assertion(!(newName in this.$schema), `Parameter «newName» cannot an existing table in the schema on «renameTable»`);
      await this.$options.onLock(this);
      try {
        Rename_in_schema: {
          const tempData = this.$schema[table];
          this.$schema[newName] = Object.assign({}, tempData);
          delete this.$schema[table];
        }
        Rename_in_data: {
          const tempData = this.$data[table] || {};
          this.$data[newName] = Object.assign({}, tempData);
          delete this.$data[table];
        }
        Rename_in_ids: {
          this.$ids[newName] = this.$ids[table];
          delete this.$ids[table];
        }
        await this.triggerDatabase("renameTable", [table, newName]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async renameColumn(table, column, newName) {
      this.trace("renameColumn");
      assertion(typeof table === "string", `Parameter «table» must be a string on «renameColumn»`);
      assertion(typeof column === "string", `Parameter «column» must be a string on «renameColumn»`);
      assertion(column !== "id", `Parameter «column» cannot be 'id' on «renameColumn»`);
      assertion(typeof newName === "string", `Parameter «table» must be a string on «renameColumn»`);
      assertion(column !== newName, `Parameter «column» cannot be equal to parameter «newName» on «renameColumn»`);
      assertion(table in this.$schema, `Parameter «table» must be an existing table in the schema on «renameColumn»`);
      assertion(column in this.$schema[table], `Parameter «column» must be an existing column in the schema table on «renameColumn»`);
      assertion(!(newName in this.$schema[table]), `Parameter «newName» cannot an existing column in the schema table on «renameColumn»`);
      await this.$options.onLock(this);
      try {
        Rename_in_schema: {
          const tempData = this.$schema[table][column];
          this.$schema[table][newName] = Object.assign({}, tempData);
          delete this.$schema[table][column];
        }
        Rename_in_data: {
          const allIds = Object.keys(this.$data[table] || {});
          for (let indexIds = 0; indexIds < allIds.length; indexIds++) {
            const id = allIds[indexIds];
            const tempData = this.$data[table][id][column];
            this.$data[table][id][newName] = tempData;
            delete this.$data[table][id][column];
          }
        }
        Rename_in_ids: {
          // @OK.
        }
        await this.triggerDatabase("renameColumn", [table, column, newName]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async dropTable(table) {
      this.trace("dropTable");
      assertion(typeof table === "string", `Parameter «table» must be a string on «dropTable»`);
      assertion(table in this.$schema, `Parameter «table» must be a schema table on «dropTable»`);
      this.checkIntegrityFree(table, null);
      await this.$options.onLock(this);
      try {
        delete this.$data[table];
        delete this.$schema[table];
        delete this.$ids[table];
        await this.triggerDatabase("dropTable", [table]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async dropColumn(table, column) {
      this.trace("dropColumn");
      assertion(typeof table === "string", `Parameter «table» must be a string on «dropColumn»`);
      assertion(table in this.$schema, `Parameter «table» must be a schema table on «dropColumn»`);
      assertion(typeof column === "string", `Parameter «column» must be a string on «dropColumn»`);
      assertion(column in this.$schema[table], `Parameter «column» must be a schema column on «dropColumn»`);
      await this.$options.onLock(this);
      try {
        const allIds = Object.keys(this.$data[table]);
        for(let indexIds=0; indexIds<allIds.length; indexIds++) {
          const id = allIds[indexIds];
          delete this.$data[table][id][column];
        }
        delete this.$schema[table][column];
        await this.triggerDatabase("dropColumn", [table]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async addTable(table) {
      this.trace("addTable");
      assertion(typeof table === "string", `Parameter «table» must be a string on «addTable»`);
      assertion(!(table in this.$schema), `Parameter «table» cannot be a schema table on «addTable»`);
      await this.$options.onLock(this);
      try {
        this.$ids[table] = 0;
        this.$data[table] = {};
        this.$schema[table] = {};
        await this.triggerDatabase("addTable", [table]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async addColumn(table, column, metadata) {
      this.trace("addColumn");
      assertion(typeof table === "string", `Parameter «table» must be a string on «addColumn»`);
      assertion(table in this.$schema, `Parameter «table» must be a schema table on «addColumn»`);
      assertion(typeof column === "string", `Parameter «column» must be a string on «addColumn»`);
      assertion(!(column in this.$schema[table]), `Parameter «column» cannot be a schema column on «addColumn»`);
      assertion(typeof metadata === "object", `Parameter «metadata» must be an object on «addColumn»`);
      assertion(typeof metadata.type === "string", `Parameter «metadata.type» must be a string on «addColumn»`);
      assertion(this.constructor.knownTypes.indexOf(metadata.type) !== -1, `Parameter «metadata.type» must be a known type on «addColumn»`);
      if(["object-reference", "array-reference"].indexOf(metadata.type) !== -1) {
        assertion(typeof metadata.referredTable === "string", `Parameter «metadata.referredTable» must be a string on «addColumn»`);
        assertion(metadata.referredTable in this.$schema, `Parameter «metadata.referredTable» must be an existing table on «addColumn»`);
      }
      await this.$options.onLock(this);
      try {
        this.$schema[table][column] = metadata;
        await this.triggerDatabase("addColumn", [table]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async reset() {
      this.trace("reset");
      this.$ids = {};
      this.$data = {};
      this.$schema = {};
      await this.triggerDatabase("reset", []);
      await this.persistDatabase();
    }

    checkIntegrityFree(table, id = null) {
      this.trace("checkIntegrityFree");
      const tableIds = Object.keys(this.$schema);
      Iterating_tables:
      for (let indexTables = 0; indexTables < tableIds.length; indexTables++) {
        const tableId = tableIds[indexTables];
        const columnIds = Object.keys(this.$schema[tableId]);
        Iterating_columns:
        for (let indexColumns = 0; indexColumns < columnIds.length; indexColumns++) {
          const columnId = columnIds[indexColumns];
          const columnMetadata = this.$schema[tableId][columnId];
          const isObjectReference = columnMetadata.type === "object-reference";
          const isArrayReference = columnMetadata.type === "array-reference";
          if ((!isObjectReference) && (!isArrayReference)) {
            continue Iterating_columns;
          }
          const isSameTable = columnMetadata.referredTable === table;
          if (!isSameTable) {
            continue Iterating_columns;
          }
          const referableRows = Object.values(this.$data[tableId] || {});
          for (let indexRows = 0; indexRows < referableRows.length; indexRows++) {
            const referableRow = referableRows[indexRows];
            if (isObjectReference) {
              const referableId = referableRow[columnId];
              if(id === null) {
                throw new IntegrityError(`Cannot delete «${table}» because it still contains external references on «${tableId}#${referableRow.id}.${columnId}» on «checkIntegrityFree»`);
              } else if (referableId === id) {
                throw new IntegrityError(`Cannot delete «${table}#${id}» because it still exists as object on «${tableId}#${referableRow.id}.${columnId}» on «checkIntegrityFree»`);
              }
            } else if (isArrayReference) {
              const referableIds = referableRow[columnId];
              if (referableIds.indexOf(id) !== -1) {
                throw new IntegrityError(`Cannot delete «${table}#${id}» because it still exists as array item on «${tableId}#${referableRow.id}.${columnId}» on «checkIntegrityFree»`);
              }
            }
          }
        }
      }
    }

    async persistDatabase() {
      this.trace("persistDatabase");
      await this.$options.onPersist(this);
    }

    async triggerDatabase(event, parameters) {
      this.trace("triggerDatabase");
      await this.$options.onTrigger(event, parameters, this);
    }

  };

  const FlexibleDBCrudLayer = class extends FlexibleDBBasicLayer {

    async selectMany(table, filter = SELECT_ALL_FILTER) {
      this.trace("selectMany");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «selectMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «selectMany»");
        assertion(typeof filter === "function", "Parameter «filter» must be a function on «selectMany»");
      }
      await this.triggerDatabase("reset", [table, filter]);
      return Object.values(this.$data[table]).filter(filter);
    }

    async insertOne(table, value) {
      this.trace("insertOne");
      await this.$options.onLock(this);
      try {
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
        await this.triggerDatabase("insertOne", [table, value]);
        await this.persistDatabase();
        return newId;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async insertMany(table, values) {
      this.trace("insertMany");
      await this.$options.onLock(this);
      try {
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
        for (let indexValues = 0; indexValues < values.length; indexValues++) {
          const value = values[indexValues];
          const newId = this.consumeIdOf(table);
          this.$data[table][newId] = { id: newId, ...value };
          newIds.push(newId);
        }
        await this.triggerDatabase("insertMany", [table, values]);
        await this.persistDatabase();
        return newIds;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async updateOne(table, id, properties) {
      this.trace("updateOne");
      await this.$options.onLock(this);
      try {
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
        await this.triggerDatabase("updateOne", [table, id, properties]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async updateMany(table, filter, properties) {
      this.trace("updateMany");
      await this.$options.onLock(this);
      try {
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
        for (let id in this.$data[table]) {
          counter++;
          const value = this.$data[table][id];
          let isAccepted = false;
          try {
            isAccepted = filter(value, counter);
          } catch (error) {
            console.log(error);
          }
          if (isAccepted) {
            this.$data[table][id] = Object.assign({}, this.$data[table][id], properties, { id: parseInt(id) });
            modifiedIds.push(id);
          }
        }
        await this.triggerDatabase("updateMany", [table, filter, properties]);
        await this.persistDatabase();
        return modifiedIds;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async deleteOne(table, id) {
      this.trace("deleteOne");
      await this.$options.onLock(this);
      try {
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
        await this.triggerDatabase("deleteOne", [table, id]);
        await this.persistDatabase();
        return true;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    async deleteMany(table, filter) {
      this.trace("deleteMany");
      await this.$options.onLock(this);
      try {
        Basic_validation: {
          assertion(typeof table === "string", "Parameter «table» must be a string on «deleteMany»");
          assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «deleteMany»");
          assertion(typeof filter === "function", "Parameter «filter» must be a function on «deleteMany»");
        }
        const deletedIds = [];
        let counter = 0;
        for (let id in this.$data[table]) {
          counter++;
          const value = this.$data[table][id];
          let isAccepted = false;
          try {
            isAccepted = filter(value, counter);
          } catch (error) {
            console.log(error);
          }
          if (isAccepted) {
            this.checkIntegrityFree(table, id);
            delete this.$data[table][id];
            deletedIds.push(id);
          }
        }
        await this.triggerDatabase("deleteMany", [table, filter]);
        await this.persistDatabase();
        return deletedIds;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

    copyObject(obj) {
      this.trace("copyObject");
      return JSON.parse(JSON.stringify(obj));
    }

    async modifyAll(table, modifier) {
      this.trace("modifyAll");
      await this.$options.onLock(this);
      try {
        Basic_validation: {
          assertion(typeof table === "string", "Parameter «table» must be a string on «modifyAll»");
          assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «modifyAll»");
          assertion(typeof modifier === "function", "Parameter «modifier» must be a function on «modifyAll»");
        }
        const errorIds = [];
        let counter = 0;
        for (let id in this.$data[table]) {
          counter++;
          const originalValue = this.copyObject(this.$data[table][id]);
          try {
            const modifiedValue = modifier(originalValue, counter);
            this.validateProperties(table, modifiedValue, "modifyAll");
            this.$data[table][id] = Object.assign({}, originalValue, modifiedValue, { id: parseInt(id) });
          } catch (error) {
            console.log(error);
            errorIds.push(id);
          }
        }
        await this.triggerDatabase("modifyAll", [table, modifier]);
        await this.persistDatabase();
        return errorIds;
      } catch (error) {
        throw error;
      } finally {
        await this.$options.onUnlock(this);
      }
    }

  }

  const FlexibleDB = class extends FlexibleDBCrudLayer {

  };

  return FlexibleDB;

});