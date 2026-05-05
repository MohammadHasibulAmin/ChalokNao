let ioInstance = null;

function init(io) {
  ioInstance = io;
}

function getIo() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

module.exports = { init, getIo };
