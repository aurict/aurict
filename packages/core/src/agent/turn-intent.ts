const CONTINUATION_PROMPT_RE = /\bcontinue (?:the task|from where)|do not summarize yet|keep working until\b/i

const ACTION_RE = /\b(?:continue|proceed|resume|finish|complete|implement|fix|repair|update|change|modify|refactor|apply|run|test|verify|build|deploy|install|bump|commit)\b/i

const TURKISH_ACTION_RE = /\b(?:devam(?:\s+et)?|s[üu]rd[üu]r|kald[ıi][gğ][ıi]n yerden|bitir|tamamla|uygula|ba[şs]la|ilerle|hallet|[çc][öo]z|d[üu]zelt|de[ğg]i[şs]tir|ekle|sil|yenile|kur|test(?:leri)?(?:\s+çalıştır)?|do[ğg]rula|derle|build|deploy|bump|commit)\b/i

const CASUAL_RE = /^(?:selam|selamlar|merhaba|naber|nas[ıi]ls[ıi]n|sa|hello|hi|hey|thanks|te[şs]ekk[üu]r(?:ler)?|eyvallah|tamam|ok|okay)[\s.!?]*$/i

const OPINION_ONLY_RE = /\b(?:sadece\s+(?:fikrini|yorumunu)|fikrin ne|ne d[üu][şs][üu]n[üu]yorsun|ka[çc]\s+(?:puan|verirsin)|objektif(?:\s+olarak)?\s+(?:yorum|puan)|de[ğg]erlendir(?:ir misin)?|anlat(?:[ıi]r m[ıi]s[ıi]n)?|a[çc][ıi]klar m[ıi]s[ıi]n)\b/i

/**
 * Long-task auto-continuation is for active work, not every turn in a dirty session.
 * A casual or opinion-only turn must not revive stale changed-file/task state.
 */
export function isTaskContinuationTurn(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (CONTINUATION_PROMPT_RE.test(t)) return true
  if (CASUAL_RE.test(t)) return false
  if (OPINION_ONLY_RE.test(t) && !ACTION_RE.test(t) && !TURKISH_ACTION_RE.test(t)) return false
  return ACTION_RE.test(t) || TURKISH_ACTION_RE.test(t)
}
