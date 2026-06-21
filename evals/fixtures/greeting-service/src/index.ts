import { formatGreeting } from "./greeting"

export function welcomeUser(name: string): string {
  return formatGreeting(name)
}
