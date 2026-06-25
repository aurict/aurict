# Aurict demo — generate with: vhs docs/demo.tape
# Install vhs: https://github.com/charmbracelet/vhs

Output docs/demo.gif

Set Shell "zsh"
Set FontSize 14
Set Width 1200
Set Height 700
Set Theme "Catppuccin Mocha"
Set TypingSpeed 60ms
Set PlaybackSpeed 1.0

# Start aurict (dev mode — runs directly from source)
Type "cd /home/f0x017/Desktop/Aurict && bun run dev"
Enter
Sleep 3s

# Type a realistic coding request
Type "read the auth module and find any security issues"
Sleep 500ms
Enter
Sleep 6s

# Show file edit flow
Type "fix the most critical one"
Sleep 500ms
Enter
Sleep 5s

Sleep 2s
