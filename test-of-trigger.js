require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create({
  onTrigger: function(event, parameters) {
    require("fs").appendFileSync(__dirname + "/test-data/test-of-trigger.txt", (new Date()) + "=" + event + ":" + JSON.stringify(parameters) + "\n", "utf8");
  }
});

flexdb.setSchema({
  Usuario: {
    nombre: { type: "string" },
  }
});

flexdb.insertOne("Usuario", { nombre: "Carlos" });