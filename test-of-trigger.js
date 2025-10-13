require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    onTrigger: function (event, parameters) {
      require("fs").appendFileSync(__dirname + "/test-data/test-of-trigger.txt", (new Date()) + "=" + event + ":" + JSON.stringify(parameters) + "\n", "utf8");
    }
  });

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string" },
    }
  });

  await flexdb.insertOne("Usuario", { nombre: "Carlos" });

  console.log("Completado test-of-triggers.js");

};

module.exports = main();