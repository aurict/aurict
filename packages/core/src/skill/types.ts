export interface SkillDetector {
  files?:    string[]    // dosya adları: "next.config.ts"
  deps?:     string[]    // package.json dep'leri: "react"
  dirs?:     string[]    // dizin varlığı: "app/", "prisma/"
  patterns?: string[]    // dosya yolu içerik eşleşmesi: ".tsx"
  keywords?: string[]    // semantic retrieval keywords
}

export interface SkillDef {
  id:           string
  name:         string
  description:  string
  detector:     SkillDetector
  contentPath:  string   // SKILL.md'nin mutlak yolu
  priority:     number   // yüksek = önce inject edilir
  tags:         string[]
  agent?:       string
  requires?:    string[] // otomatik yüklenecek bağımlı skill ID'leri
}

export interface LoadedSkill extends SkillDef {
  systemPrompt: string   // SKILL.md'den çıkarılan içerik
  tokenCount:   number   // systemPrompt'un tiktoken sayımı
}

export interface SkillMatch {
  skill:      SkillDef
  confidence: number     // 0-1
  reasons:    string[]
}
