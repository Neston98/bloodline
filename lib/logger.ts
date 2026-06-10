type Level = "debug" | "info" | "warn" | "error"

const encoder = new TextEncoder()

function log(level: Level, module: string, message: string, data?: unknown, error?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = `[BloodLine] [${level.toUpperCase()}] [${module}]`

  if (level === "error") {
    console.error(prefix, message, data ?? "", error ?? "")
  } else if (level === "warn") {
    console.warn(prefix, message, data ?? "")
  } else {
    console.log(prefix, message, data ?? "")
  }
}

export const logger = {
  debug(module: string, message: string, data?: unknown) {
    log("debug", module, message, data)
  },
  info(module: string, message: string, data?: unknown) {
    log("info", module, message, data)
  },
  warn(module: string, message: string, data?: unknown) {
    log("warn", module, message, data)
  },
  error(module: string, message: string, error?: unknown, data?: unknown) {
    log("error", module, message, data, error)
  },
}
