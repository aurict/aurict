import { describe, it, expect } from "bun:test"
import { shouldUseSandbox } from "../src/terminal/sandbox.js"
import { classifyCommand }  from "../src/terminal/classifier.js"

function analysis(cmd: string) {
  return classifyCommand(cmd)
}

describe("shouldUseSandbox", () => {
  // Docker sandbox devre dışı — tüm komutlar false döner
  // Security permission layer ile sağlanır (kullanıcı onayı)
  
  it("ls does NOT need sandbox", () => {
    expect(shouldUseSandbox("ls -la", analysis("ls -la"))).toBe(false)
  })

  it("cat does NOT need sandbox", () => {
    expect(shouldUseSandbox("cat file.txt", analysis("cat file.txt"))).toBe(false)
  })

  it("git status does NOT need sandbox", () => {
    expect(shouldUseSandbox("git status", analysis("git status"))).toBe(false)
  })

  it("node script.js does NOT need sandbox (sandbox disabled)", () => {
    // Docker sandbox devre dışı — permission layer kullanılır
    expect(shouldUseSandbox("node script.js", analysis("node script.js"))).toBe(false)
  })

  it("python main.py does NOT need sandbox (sandbox disabled)", () => {
    expect(shouldUseSandbox("python main.py", analysis("python main.py"))).toBe(false)
  })

  it("python3 main.py does NOT need sandbox (sandbox disabled)", () => {
    expect(shouldUseSandbox("python3 app.py", analysis("python3 app.py"))).toBe(false)
  })

  it("ruby script.rb does NOT need sandbox (sandbox disabled)", () => {
    expect(shouldUseSandbox("ruby script.rb", analysis("ruby script.rb"))).toBe(false)
  })

  it("bash script does NOT need sandbox (sandbox disabled)", () => {
    expect(shouldUseSandbox("bash deploy.sh", analysis("bash deploy.sh"))).toBe(false)
  })

  it("sh -c command does NOT need sandbox (sandbox disabled)", () => {
    expect(shouldUseSandbox("sh -c 'echo hi'", analysis("sh -c 'echo hi'"))).toBe(false)
  })

  it("bun run does NOT need sandbox", () => {
    expect(shouldUseSandbox("bun run test", analysis("bun run test"))).toBe(false)
  })

  it("tsc --noEmit does NOT need sandbox", () => {
    expect(shouldUseSandbox("tsc --noEmit", analysis("tsc --noEmit"))).toBe(false)
  })
})
