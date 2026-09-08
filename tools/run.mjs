// Executes a command on the remote server over SSH and streams its output.
// Usage: node tools/run.mjs "command here"
import { Client } from "ssh2";
import { readFileSync } from "fs";

const cmd = process.argv.slice(2).join(" ");
if (!cmd) {
  console.error("usage: node tools/run.mjs '<command>'");
  process.exit(2);
}

const conn = new Client();
let exitCode = 0;

conn
  .on("ready", () => {
    conn.exec(cmd, { pty: false }, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      stream
        .on("close", (code) => {
          exitCode = code ?? 0;
          conn.end();
        })
        .on("data", (d) => process.stdout.write(d))
        .stderr.on("data", (d) => process.stderr.write(d));
    });
  })
  .on("error", (err) => {
    console.error("SSH ERROR:", err.message);
    process.exit(3);
  })
  .connect({
    host: "31.56.48.186",
    port: 22,
    username: "root",
    password: "TP9hHXexXUT59zl_bX",
    readyTimeout: 20000,
  });

conn.on("close", () => process.exit(exitCode));
