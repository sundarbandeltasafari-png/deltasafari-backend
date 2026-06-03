const fs = require('fs').promises;

async function deleteFile(path) {
  try {
    await fs.rm(path, { force: true });
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {deleteFile}