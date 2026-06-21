import { describe, it, expect } from "bun:test"
import { chooseSandboxBackend, shouldUseSandbox } from "../src/terminal/sandbox.js"
import { classifyCommand }  from "../src/terminal/classifier.js"

function analysis(cmd: string) {
  return classifyCommand(cmd)
}

describe("shouldUseSandbox", () => {
  it("ls does NOT need sandbox", () => {
    expect(shouldUseSandbox("ls -la", analysis("ls -la"))).toBe(false)
  })

  it("cat does NOT need sandbox", () => {
    expect(shouldUseSandbox("cat file.txt", analysis("cat file.txt"))).toBe(false)
  })

  it("git status does NOT need sandbox", () => {
    expect(shouldUseSandbox("git status", analysis("git status"))).toBe(false)
  })

  it("node script.js uses policy sandbox", () => {
    expect(chooseSandboxBackend("node script.js", analysis("node script.js")).backend).toBe("policy")
    expect(shouldUseSandbox("node script.js", analysis("node script.js"))).toBe(true)
  })

  it("python main.py uses policy sandbox", () => {
    expect(chooseSandboxBackend("python main.py", analysis("python main.py")).backend).toBe("policy")
  })

  it("python3 main.py uses policy sandbox", () => {
    expect(chooseSandboxBackend("python3 app.py", analysis("python3 app.py")).backend).toBe("policy")
  })

  it("ruby script.rb uses policy sandbox", () => {
    expect(chooseSandboxBackend("ruby script.rb", analysis("ruby script.rb")).backend).toBe("policy")
  })

  it("bash script uses policy sandbox", () => {
    expect(chooseSandboxBackend("bash deploy.sh", analysis("bash deploy.sh")).backend).toBe("policy")
  })

  it("sh -c command uses policy sandbox", () => {
    expect(chooseSandboxBackend("sh -c 'echo hi'", analysis("sh -c 'echo hi'")).backend).toBe("policy")
  })

  it("bun run uses policy sandbox", () => {
    expect(chooseSandboxBackend("bun run test", analysis("bun run test")).backend).toBe("policy")
  })

  it("tsc --noEmit does NOT need sandbox", () => {
    expect(shouldUseSandbox("tsc --noEmit", analysis("tsc --noEmit"))).toBe(false)
  })

  it("docker backend is opt-in", () => {
    expect(chooseSandboxBackend("node script.js", analysis("node script.js"), { backend: "docker" }).backend).toBe("docker")
  })

  it("sandbox can be explicitly disabled", () => {
    expect(chooseSandboxBackend("node script.js", analysis("node script.js"), { backend: "none" }).backend).toBe("none")
  })
})
