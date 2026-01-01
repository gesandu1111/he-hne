const { Storage } = require("megajs");

async function upload(stream, filename) {
  return new Promise((resolve, reject) => {
    const file = new Storage.File({ name: filename });
    file.upload(stream, (err) => {
      if (err) return reject(err);
      resolve(file.link());
    });
  });
}

module.exports = { upload };
