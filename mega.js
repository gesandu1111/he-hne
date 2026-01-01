const { Storage } = require("megajs");

// Use your Mega account email & password
const MEGA_EMAIL = "gesandsanmira19202@gmail.com";
const MEGA_PASSWORD = "Gesa123!@#";

async function upload(stream, filename) {
  return new Promise((resolve, reject) => {
    // Create Mega storage instance
    const storage = new Storage({
      email: MEGA_EMAIL,
      password: MEGA_PASSWORD,
    });

    const file = storage.upload({
      name: filename,
    });

    // Pipe the stream
    stream.pipe(file);

    file.on("ready", () => {
      // Get download link
      resolve(file.link());
    });

    file.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = { upload };
