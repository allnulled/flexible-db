require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create({
  onPersist: function(db) {
    const stringifiedDb = db.dehydrate();
    require("fs").writeFileSync(__dirname + "/test-data/test-of-persistence.json", stringifiedDb, "utf8");
  }
});

flexdb.setSchema({
  Usuario: {
    nombre: { type: "string" },
  }
})