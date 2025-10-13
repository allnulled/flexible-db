require(__dirname + "/flexible-db.js");

const alphabet = "abcdefghijklmnopqrstuvwxyz";

const getRandomString = function (len = 10) {
  let out = "";
  while (out.length < len) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
};

const main = async function () {

  Sin_locks: {

    const flexdb = FlexibleDB.create({
      onLock() { },
      onUnlock() { },
      onPersist: async function (db) {
        // const stringifiedDb = await db.dehydrate();
        // require("fs").writeFileSync(__dirname + "/test-data/test-of-persistence.json", stringifiedDb, "utf8");
      }
    });

    await flexdb.setSchema({
      Usuario: {
        nombre: { type: "string" },
      }
    });

    const startTime = new Date();
    for (let index = 0; index < 500; index++) {
      await flexdb.insertOne("Usuario", {
        nombre: getRandomString()
      });
    }
    const endTime = new Date();
    const millisecondsTaken = endTime - startTime;
    const secondsTaken = Math.round(millisecondsTaken) / 1000;

    console.log(`[*] Sin locks tomó ${secondsTaken} segundos`);
    console.log(`[*] Sin locks tomó ${secondsTaken / 500} segundos por ítem`);

  }

  Con_locks: {

    const flexdb = FlexibleDB.create({
      onPersist: async function (db) {
        const stringifiedDb = await db.dehydrate();
        require("fs").writeFileSync(__dirname + "/test-data/test-of-persistence.json", stringifiedDb, "utf8");
      }
    });

    await flexdb.setSchema({
      Usuario: {
        nombre: { type: "string" },
      }
    });

    const startTime = new Date();
    for (let index = 0; index < 500; index++) {
      await flexdb.insertOne("Usuario", {
        nombre: getRandomString()
      });
    }
    const endTime = new Date();
    const millisecondsTaken = endTime - startTime;
    const secondsTaken = Math.round(millisecondsTaken) / 1000;

    console.log(`[*] Con locks tomó ${secondsTaken} segundos`);
    console.log(`[*] Con locks tomó ${secondsTaken / 500} segundos por ítem`);

  }

  console.log("Completado test-of-performance.js");
};

module.exports = main();