import * as path from "node:path";

/**
 * Dosya uzantısına göre uygun formatter komutunu döndürür.
 * @param filePath Formatlanacak dosyanın yolu
 * @returns Format komutu ve argümanları, bulunamazsa null
 */
export function getFormatCommand(filePath: string): { command: string; args: string[] } | null {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".ts":
    case ".tsx":
    case ".js":
    case ".jsx":
    case ".json":
    case ".md":
    case ".yaml":
    case ".yml":
    case ".html":
    case ".css":
      return { command: "npx", args: ["prettier", "--write", filePath] };
    case ".go":
      return { command: "gofmt", args: ["-w", filePath] };
    case ".py":
      return { command: "black", args: [filePath] };
    case ".rs":
      return { command: "rustfmt", args: [filePath] };
    case ".c":
    case ".cpp":
    case ".h":
    case ".hpp":
      return { command: "clang-format", args: ["-i", filePath] };
    default:
      return null;
  }
}

/**
 * Verilen dosyayı ilgili dildeki formatter ile formatlar.
 * @param filePath Formatlanacak dosyanın mutlak veya göreceli yolu
 * @returns Başarı durumu (true: formatlandı, false: desteklenmiyor veya hata oluştu)
 */
export async function formatFile(filePath: string): Promise<boolean> {
  const formatCmd = getFormatCommand(filePath);

  if (!formatCmd) {
    // Desteklenmeyen uzantı, sessizce atla
    return false;
  }

  try {
    const proc = Bun.spawn([formatCmd.command, ...formatCmd.args], {
      stdout: "ignore",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      console.error(`Formatter error (${filePath}):`, stderr);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Formatter failed (${filePath}):`, error);
    return false;
  }
}
