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
      await this.triggerDatabase("getSchema", []);
      return this.$schema;
    }

    async getRelationsSchema() {
      await this.triggerDatabase("getRelationsSchema", []);
      const relations = {};
      const tableIds = Object.keys(this.$schema);
      Iterating_tables_first:
      for (let indexTable = 0; indexTable < tableIds.length; indexTable++) {
        const tableId = tableIds[indexTable];
        const tableMetadata = this.$schema[tableId];
        relations[tableId] = {
          active: {},
          passive: {},
        };
        const columnIds = Object.keys(tableMetadata);
        Iterating_columns_for_actives:
        for (let indexColumn = 0; indexColumn < columnIds.length; indexColumn++) {
          const columnId = columnIds[indexColumn];
          const columnMetadata = this.$schema[tableId][columnId];
          const quantity = columnMetadata.type === "array-reference" ? "N" : columnMetadata.type === "object-reference" ? "1" : undefined;
          if (typeof quantity === "undefined") {
            continue Iterating_columns_for_actives;
          }
          relations[tableId].active[tableId + "." + columnId] = {
            quantity,
            referredTable: columnMetadata.referredTable,
          };
        }
        Iterating_tables_again_for_passives:
        for (let indexTable2 = 0; indexTable2 < tableIds.length; indexTable2++) {
          const tableId2 = tableIds[indexTable2];
          const columnIds2 = Object.keys(this.$schema[tableId2]);
          Iterating_columns_again_for_passives:
          for (let indexColumn2 = 0; indexColumn2 < columnIds2.length; indexColumn2++) {
            const columnId2 = columnIds2[indexColumn2];
            const columnMetadata2 = this.$schema[tableId2][columnId2];
            const quantity = columnMetadata2.type === "array-reference" ? "N" : columnMetadata2.type === "object-reference" ? "1" : undefined;
            if (typeof quantity === "undefined") {
              continue Iterating_columns_again_for_passives;
            }
            const refersToSelf = columnMetadata2.referredTable === tableId;
            if (!refersToSelf) {
              continue Iterating_columns_again_for_passives;
            }
            relations[tableId].passive[tableId2 + "." + columnId2] = {
              quantity,
              referredTable: columnMetadata2.referredTable,
            };
          }
        }
      }
      return relations;
    }

    validateProperties(table, value, contextId) {
      this.trace("validateProperties");
      const allColumns = Object.keys(this.$schema[table]);
      const tableMetadata = this.$schema[table];
      Iterating_all_columns:
      for (let indexColumn = 0; indexColumn < allColumns.length; indexColumn++) {
        const columnId = allColumns[indexColumn];
        const isUndefined = typeof value[columnId] === "undefined";
        const hasDefault = "default" in tableMetadata[columnId];
        Parching_with_default_value_when_needed: {
          if (isUndefined && hasDefault) {
            if (typeof tableMetadata[columnId].default === "function") {
              value[columnId] = tableMetadata[columnId].default.call();
            } else if (tableMetadata[columnId].defaultType === "js") {
              const defaultCallback = new Function(tableMetadata[columnId].default);
              value[columnId] = defaultCallback();
            } else {
              value[columnId] = tableMetadata[columnId].default;
            }
          }
        }
      }
      const properties = Object.keys(value);
      Iterating_properties_of_value:
      for (let indexProperties = 0; indexProperties < properties.length; indexProperties++) {
        const propertyId = properties[indexProperties];
        if (propertyId === "id") {
          continue Iterating_properties_of_value;
        }
        assertion(propertyId in tableMetadata, `Property «${propertyId}» must be a known column by the table in the schema on «${contextId}»`);
        const columnMetadata = tableMetadata[propertyId];
        const isNullable = (typeof columnMetadata.nullable === "boolean") && (columnMetadata.nullable === true);
        const isNotNull = value[propertyId] !== null;
        Checking_validity: {
          Checking_nullability: {
            if (isNotNull) {
              break Checking_nullability;
            }
            if (isNullable) {
              break Checking_validity;
            } else {
              throw new Error(`Property «${propertyId}» cannot be null on «${contextId}»`);
            }
          }
          Checking_type: {
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
          Checking_uniqueness: {
            if ((typeof columnMetadata.unique !== "boolean") || (columnMetadata.unique !== true)) {
              break Checking_uniqueness;
            }
            const rows = Object.values(this.$data[table] || {});
            const isUpdating = contextId.startsWith("update");
            Iterating_rows:
            for (let index = 0; index < rows.length; index++) {
              const row = rows[index];
              if ((row.id === value.id) && isUpdating) {
                continue Iterating_rows;
              }
              const rowPropertyValue = row[propertyId];
              assertion(value[propertyId] !== rowPropertyValue, `Property «${propertyId}» must be unique but is repeated on id «${row.id}» on «${contextId}»`);
            }
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
        for (let indexIds = 0; indexIds < allIds.length; indexIds++) {
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
      if (["object-reference", "array-reference"].indexOf(metadata.type) !== -1) {
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
              if (id === null) {
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

    async selectOne(table, id, withTableType = false) {
      this.trace("selectOne");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «selectOne»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «selectOne»");
        assertion(["string", "number"].indexOf(typeof id), "Parameter «id» must be a string on «selectOne»");
      }
      await this.triggerDatabase("selectOne", [table, id]);
      assertion(id in this.$data[table], `No row found by «id=${id}» on «selectOne»`);
      const row = this.copyObject(this.$data[table][id]);
      if (withTableType) {
        row.type = table;
      }
      return row;
    }

    async selectMany(table, filter = SELECT_ALL_FILTER, expandSpec = false, withTableType = false) {
      this.trace("selectMany");
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «selectMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «selectMany»");
        assertion(typeof filter === "function", "Parameter «filter» must be a function on «selectMany»");
      }
      await this.triggerDatabase("selectMany", [table, filter]);
      const all = this.copyObject(Object.values(this.$data[table] || {}));
      if (withTableType !== false) {
        const key = typeof withTableType === "string" ? withTableType : "type";
        for (let indexRow = 0; indexRow < all.length; indexRow++) {
          const row = all[indexRow];
          row[key] = table;
        }
      }
      const filtered = all.filter(filter);
      if (expandSpec) {
        return this.expandRecords(table, filtered, expandSpec);
      }
      return filtered;
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

    async modifyAll(table, modifier, errorHandler = console.log) {
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
            errorHandler(error, originalValue, id, counter);
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

    async expandRecords(sourceTable, records, expandSpec) {
      this.trace("expandRecords");
      const tableSchema = this.$schema[sourceTable];
      const expandedRecords = [];
      Iterating_records:
      for (const record of records) {
        const expanded = record;
        Iterating_expanders:
        for (const field in expandSpec) {
          const def = tableSchema[field];
          if (!def) {
            continue Iterating_expanders;
          }
          const subExpand = expandSpec[field]; // puede ser true o un objeto o array
          Depending_on_type:
          if (def.type === "object-reference") {
            const refTable = def.referredTable;
            const id = record[field];
            if (id != null) {
              const ref = await this.selectOne(refTable, id);
              if (ref) {
                const isExpandedByField = (subExpand && (subExpand !== true));
                expanded[field] = isExpandedByField ? (await this.expandRecords(refTable, [ref], this.normalizeExpandSpec(subExpand)))[0] : ref;
              }
            }
          } else if (def.type === "array-reference") {
            const refTable = def.referredTable;
            const ids = Array.isArray(record[field]) ? record[field] : [];
            const refs = await this.selectMany(refTable, r => ids.includes(r.id), true);
            const isExpandedByField = (subExpand && (subExpand !== true));
            expanded[field] = isExpandedByField ? await this.expandRecords(refTable, refs, this.normalizeExpandSpec(subExpand)) : refs;
          }
        }
        expandedRecords.push(expanded);
      }
      return expandedRecords;
    }

    // Permite usar arrays como ["persona"] o objetos { persona: true }
    normalizeExpandSpec(spec) {
      this.trace("normalizeExpandSpec");
      if (spec === true) return {};
      if (Array.isArray(spec)) {
        const obj = {};
        for (const k of spec) obj[k] = true;
        return obj;
      }
      return spec;
    }

    async attachRecords(sourceTable, newColumn, referredTable, referredColumn, records) {
      this.trace("attachRecords");
      assertion(sourceTable in this.$schema, `Parameter «sourceTable» must be a table in schema on «attachRecords»`);
      assertion(!(newColumn in this.$schema[sourceTable]), `Parameter «newColumn» cannot be a column of table «${sourceTable}» in schema on «attachRecords»`);
      assertion(referredTable in this.$schema, `Parameter «referredTable» must be a table in schema on «attachRecords»`);
      assertion(referredColumn in this.$schema[referredTable], `Parameter «referredColumn» must be a column of table «${referredTable}» in schema on «attachRecords»`);
      assertion(["array-reference", "object-reference"].indexOf(this.$schema[referredTable][referredColumn].type) !== -1, `Parameter «referredColumn» must point to a column of table «${referredTable}» that has a strict relation having as «type» one of «array-reference» or «object-reference» in schema on «attachRecords»`);
      assertion(this.$schema[referredTable][referredColumn].referredTable === sourceTable, `Parameter «referredColumn» must point to a column of table «${referredTable}» that has a strict relation contract having as «referredTable» only «${sourceTable}» in schema on «attachRecords»`);
      const isArray = this.$schema[referredTable][referredColumn].type === "array-reference";
      const isObject = this.$schema[referredTable][referredColumn].type === "object-reference";
      const attachedRecords = [];
      for (let indexRecord = 0; indexRecord < records.length; indexRecord++) {
        const record = records[indexRecord];
        const filter = isArray ? function (line) {
          return line[referredColumn].indexOf(record.id) !== -1;
        } : function (line) {
          return line[referredColumn] === record.id;
        };
        const matchedReferences = await this.selectMany(referredTable, filter);
        records[indexRecord][newColumn] = matchedReferences;
      }
      return attachedRecords;
    }

  };

  const FlexibleDBProxiesLayer = class extends FlexibleDBCrudLayer {

    static DatasetProxy = class {

      static from(...args) {
        return new this(...args);
      }

      constructor(dataset, table = null, database = null) {
        this.$dataset = dataset;
        this.$table = table;
        this.$database = database;
      }

      findBySelector(selectorList = []) {
        // Si el selector está vacío o sólo tiene "*", devuelve el dataset completo
        assertion(Array.isArray(selectorList), `Parameter «selectorList» must be an array on «DatasetProxy.findBySelector»`);
        for (let indexSelector = 0; indexSelector < selectorList.length; indexSelector++) {
          const selectorItem = selectorList[indexSelector];
          assertion(typeof selectorItem === "string", `Parameter «selectorList[${indexSelector}]» must be a string on «DatasetProxy.findBySelector»`);
        }
        if ((selectorList.length === 0) || (selectorList.length === 1 && selectorList[0] === "*")) {
          return this;
        }
        let output = this.$dataset;
        for (let indexSelector = 0; indexSelector < selectorList.length; indexSelector++) {
          const selectorItem = selectorList[indexSelector];
          if (selectorItem === "*") {
            output = output;
          } else {
            let requiresFlat = false;
            output = output.map((row) => {
              if(Array.isArray(row[selectorItem])) {
                requiresFlat = true;
              }
              return row[selectorItem];
            });
            if(requiresFlat) {
              output = output.flat();
            }
          }
        }
        this.$dataset = output;
        return this;
      }

      setDataset(dataset) {
        this.$dataset = dataset;
        return this;
      }

      setTable(table) {
        this.$table = table;
        return this;
      }

      setDatabase(database) {
        this.$database = database;
        return this;
      }

      getDataset() {
        return this.$dataset;
      }

      copy() {
        this.$dataset = JSON.parse(JSON.stringify(this.$dataset));
        return this;
      }

      clone() {
        return new this.constructor(this.$dataset, this.$table, this.$database);
      }

      async filter(callback) {
        const output = [];
        for (let indexRow = 0; indexRow < this.$dataset.length; indexRow++) {
          const row = this.$dataset[indexRow];
          try {
            const isFiltered = await callback(row, indexRow);
            if (isFiltered === true) {
              output.push(row);
            }
          } catch (error) {
            console.log(error);
            console.log("filter failed but process continues anyway.");
          }
        }
        this.$dataset = output;
        return true;
      }

      async map(callback) {
        const output = [];
        for (let indexRow = 0; indexRow < this.$dataset.length; indexRow++) {
          const row = this.$dataset[indexRow];
          try {
            const isModified = await callback(row, indexRow);
            if (typeof isModified !== "undefined") {
              output.push(isModified);
            } else {
              output.push(row);
            }
          } catch (error) {
            console.log(error);
            console.log("map failed but process continues anyway.");
          }
        }
        this.$dataset = output;
        return this;
      }

      async reduce(callback, original = []) {
        let output = original;
        for (let indexRow = 0; indexRow < this.$dataset.length; indexRow++) {
          const row = this.$dataset[indexRow];
          try {
            const isChanged = await callback(output, row, indexRow);
            if (typeof isChanged !== "undefined") {
              if (output !== isChanged) {
                output = isChanged;
              }
            }
          } catch (error) {
            console.log(error);
            console.log("reduce failed, but process continues anyway.");
          }
        }
        this.$dataset = output;
        return this;
      }

      flat() {
        this.$dataset = this.$dataset.flat();
        return this;
      }

      async each(callback, original = []) {
        let output = original;
        for (let indexRow = 0; indexRow < this.$dataset.length; indexRow++) {
          const row = this.$dataset[indexRow];
          try {
            await callback(output, row, indexRow);
          } catch (error) {
            console.log(error);
            console.log("(each failed, but process continues anyway.");
          }
        }
        return this;
      }

      deduplicate() {
        const output = [];
        const outputIds = [];
        for (let indexRow = 0; indexRow < this.$dataset.length; indexRow++) {
          const row = this.$dataset[indexRow];
          const hasRowId = !!row.id;
          const pos = outputIds.indexOf(hasRowId ? row.id : row);
          if (pos === -1) {
            outputIds.push(hasRowId ? row.id : row);
            output.push(row);
          }
        }
        this.$dataset = output;
        return this;
      }

      async expandRecords(sourceTable, expandSpec = {}) {
        await this.$database.expandRecords(sourceTable, this.$dataset, expandSpec);
        return this;
      }

      async attachRecords(sourceTable, newColumn, referredTable, referredColumn) {
        await this.$database.attachRecords(sourceTable, newColumn, referredTable, referredColumn, this.$dataset);
        return this;
      }

    };

    proxifyDataset(dataset, table) {
      return new this.constructor.DatasetProxy(dataset, table, this);
    }

  };

  const FlexibleDB = class extends FlexibleDBProxiesLayer {

  };

  return FlexibleDB;

});