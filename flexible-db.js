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
      this.$ids = { uid: 0 };
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

    consumeUid() {
      this.trace("consumeUid");
      return ++this.$ids.uid;
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
        } else if (propertyId === "uid") {
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
      this.$ids = { uid: 0 };
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

    transformFilterByUser(filterByUser, blockEmpty = false) {
      if (!Array.isArray(filterByUser)) {
        return filterByUser;
      }
      if (!filterByUser.length) {
        if (blockEmpty) {
          return () => false;
        } else {
          return () => true;
        }
      }
      return function (row) {
        let isValid = true;
        for (let index = 0; index < filterByUser.length; index++) {
          const filterRule = filterByUser[index];
          assertion(Array.isArray(filterRule), `Parameter «filterByUser» on index «${index}» must be an array on «transformFilterByUser»`)
          const [column, op, target, targetType = "string"] = filterRule;
          switch (op) {
            case "=": {
              isValid = isValid && row[column] === target;
              break;
            }
            case "!=": {
              isValid = isValid && (row[column] !== target);
              break;
            }
            case "<": {
              isValid = isValid && (row[column] < target);
              break;
            }
            case ">": {
              isValid = isValid && (row[column] > target);
              break;
            }
            case "<=": {
              isValid = isValid && (row[column] <= target);
              break;
            }
            case ">=": {
              isValid = isValid && (row[column] >= target);
              break;
            }
            case "is null": {
              isValid = isValid && (row[column] === null);
              break;
            }
            case "is not null": {
              isValid = isValid && (row[column] !== null);
              break;
            }
            case "is in": {
              isValid = isValid && (target.indexOf(row[column]) !== -1);
              break;
            }
            case "is not in": {
              isValid = isValid && (target.indexOf(row[column]) === -1);
              break;
            }
            case "has": {
              isValid = isValid && (row[column].indexOf(target) !== -1);
              break;
            }
            case "has not": {
              isValid = isValid && (row[column].indexOf(target) === -1);
              break;
            }
            default:
              throw new Error(`Logical operator not found «${op}» on «transformFilterByUser»`);
          }
          if (!isValid) {
            return false;
          }
        }
        return true;
      };
    }

    async selectMany(table, filterByUser = SELECT_ALL_FILTER, withTableType = false) {
      this.trace("selectMany");
      const filter = this.transformFilterByUser(filterByUser, false);
      Basic_validation: {
        assertion(typeof table === "string", "Parameter «table» must be a string on «selectMany»");
        assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «selectMany»");
        assertion(typeof filter === "function", "Parameter «filter» must be a function on «selectMany»");
        assertion((typeof withTableType === "boolean") || (typeof withTableType === "string"), "Parameter «withTableType» must be a boolean or a string on «selectMany»");
      }
      await this.triggerDatabase("selectMany", [table, filter]);
      const all = this.copyObject(Object.values(this.$data[table] || {}));
      const filtered = all.filter(filter);
      if (withTableType !== false) {
        const key = typeof withTableType === "string" ? withTableType : "type";
        for (let indexRow = 0; indexRow < filtered.length; indexRow++) {
          const row = filtered[indexRow];
          row[key] = table;
        }
      }
      return filtered;
    }

    async selectByUid(uid) {
      this.trace("selectByUid");
      const allTables = Object.keys(this.$schema);
      for (let index = 0; index < allTables.length; index++) {
        const tableId = allTables[index];
        const allMatches = await this.selectMany(tableId, [["uid", "=", uid]], true);
        if (allMatches.length) {
          return allMatches[0];
        }
      }
      return null;
    }

    async selectByLabel(table, label) {
      assertion(typeof table === "string", `Parameter «table» must be a string on «selectByLabel»`);
      assertion(typeof label === "string", `Parameter «label» must be a string on «selectByLabel»`);
      const columns = this.$schema[table];
      const labelableIds = [];
      for (let columnId in columns) {
        const column = columns[columnId];
        if (column.label === true) {
          labelableIds.push(columnId);
        }
      }
      return await this.selectMany(table, row => {
        for (let indexLabel = 0; indexLabel < labelableIds.length; indexLabel++) {
          const labelableId = labelableIds[indexLabel];
          const labelableColumn = row[labelableId];
          if (typeof labelableColumn === "string") {
            if (label === labelableColumn) {
              return true;
            }
          } else if (Array.isArray(labelableColumn)) {
            if (labelableColumn.indexOf(label) !== -1) {
              return true;
            }
          }
        }
      });
    }

    async selectByLabels(table, labels = []) {
      assertion(typeof table === "string", `Parameter «table» must be a string on «selectByLabels»`);
      assertion(Array.isArray(labels), `Parameter «labels» must be an array on «selectByLabels»`);
      assertion(table in this.$schema, `Parameter «table» must be a valid table of «db.$schema» on «selectByLabels»`);
      const columns = this.$schema[table];
      const labelableIds = [];
      for (let columnId in columns) {
        const column = columns[columnId];
        if (column.label === true) {
          labelableIds.push(columnId);
        }
      }
      return await this.selectMany(table, row => {
        for (let indexLabel = 0; indexLabel < labelableIds.length; indexLabel++) {
          const labelableId = labelableIds[indexLabel];
          const labelableColumn = row[labelableId];
          if (typeof labelableColumn === "string") {
            if (labels.indexOf(labelableColumn) !== -1) {
              return true;
            }
          } else if (Array.isArray(labelableColumn)) {
            const haveCommon = this.createDataset(labelableColumn).hasAnyOf(labels);
            if (haveCommon) {
              return true;
            }
          }
        }
      });
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
        const newUid = this.consumeUid();
        this.$data[table][newId] = { ...value, id: newId, uid: newUid };
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
          const newUid = this.consumeUid();
          this.$data[table][newId] = { ...value, id: newId, uid: newUid };
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
          assertion(typeof properties.uid === "undefined", "Parameter «properties.uid» must be undefined on «updateOne»");
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

    async updateMany(table, filterByUser, properties) {
      this.trace("updateMany");
      await this.$options.onLock(this);
      const filter = this.transformFilterByUser(filterByUser, true);
      try {
        Basic_validation: {
          assertion(typeof table === "string", "Parameter «table» must be a string on «updateMany»");
          assertion(Object.keys(this.$schema).indexOf(table) !== -1, "Parameter «table» must be a known table on «updateMany»");
          assertion(typeof filter === "function", "Parameter «filter» must be a function on «updateMany»");
          assertion(typeof properties === "object", "Parameter «properties» must be an object on «updateMany»");
          assertion(typeof properties.uid === "undefined", "Parameter «properties.uid» must be undefined on «updateMany»");
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

    async deleteMany(table, filterByUser = []) {
      this.trace("deleteMany");
      await this.$options.onLock(this);
      const filter = this.transformFilterByUser(filterByUser, true);
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

    async expandRecordsBySelector(sourceTable, records, selector, expandSpec) {
      this.trace("expandRecordsBySelector");
      assertion(typeof sourceTable === "string", `Parameter «sourceTable» must be a string on «expandRecordsBySelector»`);
      assertion(Array.isArray(selector), `Parameter «selector» must be an arrau on «expandRecordsBySelector»`);
      assertion(Array.isArray(records), `Parameter «records» must be an array on «expandRecordsBySelector»`);
      assertion(typeof expandSpec === "object", `Parameter «expandSpec» must be an object on «expandRecordsBySelector»`);
      let secondSet = records;
      for (let index = 0; index < selector.length; index++) {
        const selectorItem = selector[index];
        secondSet = secondSet[selectorItem];
      }
      await this.expandRecords(sourceTable, secondSet, expandSpec);
      return records;
    }

    async expandRecords(sourceTable, records, expandSpec) {
      this.trace("expandRecords");
      assertion(typeof sourceTable === "string", `Parameter «sourceTable» must be a string on «expandRecords»`);
      assertion(Array.isArray(records), `Parameter «records» must be an array on «expandRecords»`);
      assertion(typeof expandSpec === "object", `Parameter «expandSpec» must be an object on «expandRecords»`);
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

  const FlexibleDBDatasetApiLayer = class extends FlexibleDBCrudLayer {

    createDataset(dataset, table) {
      return new this.constructor.BasicDataset(dataset, table, this);
    }

    static BasicDataset = class {

      static from(...args) {
        return new this(...args);
      }

      constructor(dataset, table = null, database = null) {
        this.$dataset = dataset;
        this.$table = table;
        this.$database = database;
      }

      static hasAnyOf(a, b) {
        return a.some(x => b.includes(x));
      }

      hasAnyOf(b) {
        return this.constructor.hasAnyOf(this.$dataset, b);
      }

      findBySelectorPrevious(selectorList = []) {
        // Si el selector está vacío o sólo tiene "*", devuelve el dataset completo
        assertion(Array.isArray(selectorList), `Parameter «selectorList» must be an array on «BasicDataset.findBySelector»`);
        for (let indexSelector = 0; indexSelector < selectorList.length; indexSelector++) {
          const selectorItem = selectorList[indexSelector];
          assertion(typeof selectorItem === "string", `Parameter «selectorList[${indexSelector}]» must be a string on «BasicDataset.findBySelector»`);
        }
        if ((selectorList.length === 0) || (selectorList.length === 1 && selectorList[0] === "*")) {
          return this;
        }
        let output = this.$dataset;
        for (let indexSelector = 0; indexSelector < selectorList.length; indexSelector++) {
          const selectorItem = selectorList[indexSelector];
          if (selectorItem === "*") {
            if (Array.isArray(output)) {
              output = output;
            } else if (typeof output === "object") {
              output = Object.values(output);
            }
          } else {
            let requiresFlat = false;
            output = output.map((row) => {
              if (Array.isArray(row[selectorItem])) {
                requiresFlat = true;
              }
              return row[selectorItem];
            });
            if (requiresFlat) {
              output = output.flat();
            }
          }
        }
        this.$dataset = output;
        return this;
      }

      findBySelector(selectorList = []) {
        // Nuevo: modo de operación basado en forma del dataset
        let mode = Array.isArray(this.$dataset) ? "rows" : "columns";
        let output = this.$dataset;
        // Caso selector vacío o ["*"]
        if (selectorList.length === 0 || (selectorList.length === 1 && selectorList[0] === "*")) {
          return this;
        }
        const rowsToColumns = function (rows) {
          const columns = {};
          for (const row of rows) {
            if (typeof row === "object" && row !== null) {
              for (const key of Object.keys(row)) {
                if (!columns[key]) columns[key] = [];
                columns[key].push(row[key]);
              }
            }
          }
          return columns;
        };
        for (let indexSelector = 0; indexSelector < selectorList.length; indexSelector++) {
          const selectorItem = selectorList[indexSelector];
          if (selectorItem === "*") {
            if (mode === "rows") {
              // Si viene otro "*" luego, cambiar a modo columnas
              const next = selectorList[indexSelector + 1];
              if (next === "*") {
                output = rowsToColumns(output);
                mode = "columns";
              }
              // Si no hay siguiente "*", no se modifica
            } else if (mode === "columns") {
              // "*" en columnas mantiene columnas tal como están
              output = output;
            }
          } else {
            // Selector por clave
            if (mode === "rows") {
              let requiresFlat = false;
              output = output.map((row) => {
                if (Array.isArray(row[selectorItem])) {
                  requiresFlat = true;
                }
                return row[selectorItem];
              });
              if (requiresFlat) {
                output = output.flat();
              }
              mode = "rows"; // mantiene orientación filas
            } else if (mode === "columns") {
              output = output[selectorItem];
              // Si una única columna, vuelve a orientación filas
              if (Array.isArray(output)) {
                mode = "rows";
              }
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
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «filter»`);
        assertion(typeof callback === "function", `Parameter «callback» must be a function on «filter»`);
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

      filterById(id) {
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «filterById»`);
        assertion(typeof id === "string", `Parameter «id» must be a string on «filterById»`);
        this.$dataset = this.$dataset.filter(row => row[id]);
        return this;
      }

      async map(callback) {
        const output = [];
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «map»`);
        assertion(typeof callback === "function", `Parameter «callback» must be a function on «map»`);
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

      mapById(id) {
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «mapById»`);
        assertion(typeof id === "string", `Parameter «id» must be a string on «mapById»`);
        this.$dataset = this.$dataset.map(row => row[id]);
        return this;
      }

      async reduce(callback, original = []) {
        let output = original;
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «reduce»`);
        assertion(typeof callback === "function", `Parameter «callback» must be a function on «reduce»`);
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
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «flat»`);
        this.$dataset = this.$dataset.flat();
        return this;
      }

      async each(callback, original = []) {
        let output = original;
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «each»`);
        assertion(typeof callback === "function", `Parameter «callback» must be a function on «each»`);
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
        assertion(Array.isArray(this.$dataset), `Parameter «this.$dataset» must be an array on «deduplicate»`);
        for (let indexRow = 0; indexRow < this.$dataset.length; indexRow++) {
          const row = this.$dataset[indexRow];
          const hasRowId = typeof row?.id !== "undefined";
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

    }

  };

  const FlexibleDBServersLayer = class extends FlexibleDBDatasetApiLayer {

    createServer(port, options) {
      return this.constructor.BasicServer.from(port, this, options);
    }

    static BasicServer = class {

      static from(...args) {
        return new this(...args);
      }

      static defaultOptions = {
        authentication: false,
      };

      constructor(port, database, options = {}) {
        this.$port = port;
        this.$database = database;
        this.$app = null;
        this.$server = null;
        this.$options = Object.assign({}, this.constructor.defaultOptions, options);
        this.$firewall = null;
      }

      async onAuthenticate(opcode, args, authenticationToken = null, request = null, response = null) {
        assertion(typeof opcode === "string", `Parameter «opcode» must be a string on «BasicServer.onAuthenticate»`);
        assertion(typeof args === "object", `Parameter «args» must be an object on «BasicServer.onAuthenticate»`);
        if (authenticationToken !== null) {
          assertion(typeof authenticationToken === "string", `Parameter «authenticationToken» must be a string on «BasicServer.onAuthenticate»`);
        }
        Authentication_process: {
          if (this.$options.authentication !== true) {
            break Authentication_process;
          }
          const [table] = args;
          const isSensibleOperation = ["insertOne", "insertMany", "updateOne", "updateMany", "deleteOne", "deleteMany", "addTable", "addColumn", "renameTable", "renameColumn", "dropTable", "dropColumn", "setSchema"].indexOf(opcode) !== -1;
          const isSensibleTable = ["Usuario", "Sesion"].indexOf(table) !== -1;
          if (isSensibleOperation) {
            assertion(authenticationToken !== null, `Authentication cannot be null due to sensible operation «${opcode}» on «BasicServer.onAuthenticate»`);
          } else if (isSensibleTable) {
            assertion(authenticationToken !== null, `Authentication cannot be null due to sensible table «${table}» on «BasicServer.onAuthenticate»`);
          }
          On_sensible_context:
          if (isSensibleOperation || isSensibleTable) {
            const openedSessions = await this.$database.selectMany("Sesion", [["token", "=", authenticationToken]]);
            assertion(openedSessions.length !== 0, `No opened sessions with token provided on sensible context`);
            const dataset1 = await this.$database.selectMany("Usuario", [
              ["id", "=", openedSessions[0].id]
            ]);
            await this.$database.attachRecords("Usuario", "grupos", "Grupo", "usuarios", dataset1);
            await this.$database.expandRecords("Grupo", dataset1[0].grupos, {
              permisos: true,
            });
            const proxy1 = await this.$database.createDataset(dataset1, "Usuario");
            const proxyOperaciones = proxy1.findBySelector(["grupos", "permisos"]).flat().deduplicate().mapById("operacion");
            const allOperaciones = proxyOperaciones.getDataset();
            const serverEvent = "server." + opcode;
            const eventIds = [serverEvent];
            const subevents = eventIds[0].split(".");
            let isValid = allOperaciones.indexOf(eventIds[0]) !== -1;
            if (!isValid) {
              Iterate_subevents:
              for (let index = 0; index < subevents.length; index++) {
                const omitted = subevents.pop();
                const subevent = subevents.concat(["*"]).join(".");
                isValid = allOperaciones.indexOf(subevent) !== -1;
                if (isValid) {
                  break Iterate_subevents;
                }
              }
            }
            assertion(isValid, `No permission found for «${eventIds[0]}» on «onAuthenticate»`);
          }
        }
        await this.triggerFirewall(opcode, args, authenticationToken, request, response);
      }

      getFirewall() {
        return this.$firewall;
      }

      setFirewall(source) {
        if (typeof global !== "undefined") {
          if (typeof ControllerLanguage === "undefined") {
            const path = require("path");
            const fs = require("fs");
            const controllerPath = path.resolve(__dirname, "controller-language.js");
            require(controllerPath);
          }
        }
        if (typeof ControllerLanguage !== "undefined") {
          const jsCode = ControllerLanguage.parse(source)
          const AsyncFunction = (async function () { }).constructor;
          this.$firewall = new AsyncFunction("operation", "args", "authenticationToken", "request", "response", "model", jsCode);
        }
        return this;
      }

      async triggerFirewall(operation, args, authenticationToken, request, response) {
        assertion(typeof this.$firewall === "function", `Firewall is not operative, the execution must end here`);
        return await this.$firewall.call(this, operation, args, authenticationToken, request, response, args[0] || "none");
      }

      generateSessionToken(len = 10) {
        let alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        let output = "";
        while (output.length < len) {
          output += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return output;
      }

      async authenticateRequest(request) {
        assertion(typeof request === "object", `Parameter «request» must be an object on «authenticateRequest»`);
        assertion(typeof request.body === "object", `Parameter «request.body» must be an object on «authenticateRequest»`);
        assertion(typeof request.body.authentication === "string", `Parameter «request.body.authentication» must be a string on «authenticateRequest»`);
        const sessionToken = request.body.authentication;
        const matchedSessions = await this.$database.selectMany("Sesion", row => row.token === sessionToken);
        if (matchedSessions.length === 0) {
          return false;
        }
        const matchedUsuario = await this.$database.selectOne("Usuario", matchedSessions[0].usuario);
        const matchedGrupos = await this.$database.selectMany("Grupo", [
          ["usuarios", "has", matchedUsuario.id]
        ]);
        const matchedGrupoPermisos = matchedGrupos.map(row => row.permisos);
        const matchedPermisos = await this.$database.selectMany("Permiso", [
          ["id", "is in", matchedGrupoPermisos.flat()]
        ]);
        request.authentication = {
          usuario: matchedUsuario,
          sesion: matchedSessions[0],
          grupos: matchedGrupos,
          permisos: matchedPermisos,
        }
        return request.authentication;
      }

      async login(username, email, password) {
        assertion(typeof username === "string" || typeof email === "string", `Parameter «username» or «email» must be a string on «BasicServer.login»`);
        assertion(typeof password === "string", `Parameter «password» must be a string on «BasicServer.login»`);
        const usuariosMatched = await this.$database.selectMany("Usuario", function (it) {
          const isMatch = it.alias === username || it.email === email;
          return isMatch;
        });
        assertion(usuariosMatched.length !== 0, `No user matched by name or email «${username}» or «${email}» on «BasicServer.login»`);
        assertion(usuariosMatched[0].password === password, `Password is not correct`);
        const usuarioId = usuariosMatched[0].id;
        const activeSessions = await this.$database.selectMany("Sesion", row => {
          return row.usuario === usuarioId;
        });
        const newToken = this.generateSessionToken(100);
        if (activeSessions.length === 0) {
          await this.$database.insertOne("Sesion", {
            token: newToken,
            usuario: usuarioId
          });
        } else {
          await this.$database.updateMany("Sesion", [
            ["usuario", "=", usuarioId]
          ], {
            token: newToken
          });
        }
        return newToken;
      }

      async logout(sessionToken) {
        // @TODO...
        assertion(typeof sessionToken === "string", `Parameter «sessionToken» must be a string on «BasicServer.logout»`);
        assertion(sessionToken.length === 10, `Parameter «sessionToken» must have correct length on «BasicServer.logout»`);
        const matchedSessions = await this.$database.selectMany("Sesion", [
          ["token", "=", sessionToken]
        ]);
        assertion(matchedSessions.length !== 0, `Parameter «sessionToken» must match a current session token on «BasicServer.logout»`);
        await this.$database.deleteOne("Sesion", matchedSessions[0].id);
        return true;
      }

      async operation(opcode, args = [], authenticationToken = null, request = null, response = null) {
        assertion(typeof opcode === "string", `Parameter «opcode» must be a string on «operation» specifically «${opcode}»`);
        assertion(Array.isArray(args), `Parameter «args» must be an array on «operation» specifically «${opcode}»`);
        let output = null;
        switch (opcode) {
          case "login": {
            return await this.login(...args);
          }
        }
        assertion(typeof authenticationToken === "string", `Parameter «authenticationToken» must be a string on «operation» specifically «${opcode}»`);
        assertion(typeof request === "object", `Parameter «request» must be an object on «operation» specifically «${opcode}»`);
        assertion(typeof response === "object", `Parameter «response» must be an object on «operation» specifically «${opcode}»`);
        await this.onAuthenticate(opcode, args, authenticationToken, request, response);
        switch (opcode) {
          case "logout": {
            output = await this.logout(...args);
            break;
          }
          case "selectOne": {
            output = await this.$database.selectOne(...args);
            break;
          }
          case "selectOne": {
            output = await this.$database.selectOne(...args);
            break;
          }
          case "selectMany": {
            output = await this.$database.selectMany(...args);
            break;
          }
          case "insertOne": {
            output = await this.$database.insertOne(...args);
            break;
          }
          case "insertMany": {
            output = await this.$database.insertMany(...args);
            break;
          }
          case "updateOne": {
            output = await this.$database.updateOne(...args);
            break;
          }
          case "updateMany": {
            output = await this.$database.updateMany(...args);
            break;
          }
          case "deleteOne": {
            output = await this.$database.deleteOne(...args);
            break;
          }
          case "deleteMany": {
            output = await this.$database.deleteMany(...args);
            break;
          }
          case "addTable": {
            output = await this.$database.addTable(...args);
            break;
          }
          case "addColumn": {
            output = await this.$database.addColumn(...args);
            break;
          }
          case "renameTable": {
            output = await this.$database.renameTable(...args);
            break;
          }
          case "renameColumn": {
            output = await this.$database.renameColumn(...args);
            break;
          }
          case "dropTable": {
            output = await this.$database.dropTable(...args);
            break;
          }
          case "dropColumn": {
            output = await this.$database.dropColumn(...args);
            break;
          }
          case "getSchema": {
            output = await this.$database.getSchema(...args);
            break;
          }
          case "setSchema": {
            output = await this.$database.setSchema(...args);
            break;
          }
          default: {
            throw new Error(`Parameter «opcode» must be a known opcode on «BasicServer.operation»`);
          }
        }
        return output;
      }

      async start(port = this.$port) {
        if (typeof global !== "undefined") {
          const express = require("express");
          this.$app = express();
          this.$server = require("http").createServer(this.$app);
          const bodyParser = require("body-parser");
          this.$app.use(bodyParser.json());
          this.$app.use(async (request, response) => {
            let opcode = "unknown";
            try {
              opcode = (request.body || {}).opcode;
              assertion(typeof opcode === "string", `Parameter «opcode» must be a string on «BasicServer.start.controller»`);
              assertion(typeof request.body === "object", `Parameter «request.body» must be an object on «BasicServer.start.controller»`);
              assertion(typeof request.body.parameters === "object", `Parameter «request.body.parameters» must be an object on «BasicServer.start.controller»`);
              assertion(typeof request.body.authentication === "string", `Parameter «request.body.authentication» must be a string on «BasicServer.start.controller»`);
              const result = await this.operation(
                opcode,
                request.body.parameters,
                request.body.authentication,
                request,
                response,
                request.body.parameters,
              );
              return response.json({
                opcode: opcode,
                status: 200,
                message: "Success",
                parameters: {
                  headers: request.headers,
                  query: request.query,
                  body: JSON.stringify(request.body).length,
                },
                result: result || null,
                error: false,
              });
            } catch (error) {
              console.log(error);
              return response.json({
                opcode: opcode,
                status: 500,
                message: "Bad request",
                parameters: {
                  headers: request.headers,
                  query: request.query,
                  body: JSON.stringify(request.body).length,
                },
                result: null,
                error: {
                  name: error.name,
                  message: error.message,
                },
              });
            }
          });
          await new Promise((resolve, reject) => {
            this.$server.listen(port, function () {
              resolve();
            });
          });
        }
        return this;
      }

      clone() {
        return this.constructor.from(this.$port, this.$database);
      }

      stop() {
        if (this.$server) {
          this.$server.close();
        }
        return this;
      }

    }

  };

  const FlexibleDB = class extends FlexibleDBServersLayer {

  };

  return FlexibleDB;

});