export default class Logger {
  static colorize(text, colorCode) {
    return `\x1b[${colorCode}m${text}\x1b[0m`;
  }

  static formatMessage(message, prefix, colorCode) {
    const coloredPrefix = this.colorize(prefix, colorCode);

    if (typeof message === "string") {
      return `${coloredPrefix} ${message}`;
    }

    let objToStringify = {};

    if (typeof message === "object") {
      objToStringify = { ...message };

      if (message instanceof Error) {
        objToStringify.message = message.message;
        objToStringify.stack = message.stack;
      }
    }

    const formattedMessage = `\n${JSON.stringify(
      objToStringify,
      null,
      2
    ).replace(/\\n/g, "\n")}`;

    

    return `${coloredPrefix}${formattedMessage}`;
  }

  static info(message) {
    console.log(this.formatMessage(message, "[INFO]:", "36")); // Cyan
  }

  static error(message) {
    console.log(this.formatMessage(message, "[ERROR]:", "31")); // Red
  }

  static warn(message) {
    console.warn(this.formatMessage(message, "[WARN]:", "33")); // Yellow
  }

  static success(message) {
    console.log(this.formatMessage(message, "[SUCCESS]:", "32")); // Green
  }

  static debug(message) {
    console.log(this.formatMessage(message, "[DEBUG]:", "34")); // Blue
  }
}
