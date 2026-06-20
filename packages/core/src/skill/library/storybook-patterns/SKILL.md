---
name: storybook-patterns
description: "Storybook: Component documentation, Stories writing, Addons, Controls, Testing stories."
triggers:
  files: [".storybook/main.ts", ".storybook/preview.ts"]
  directories: ["stories/", "src/**/*.stories.ts"]
  keywords: ["Storybook", "storybookjs", "component documentation", "controls"]
auto_load_when: "Building component libraries or documenting UI components"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Storybook Patterns

**Focus:** Component documentation, story writing, addons

## 1. Story Structure

```
Basic Story (CSF 3.0):
import Button from './Button.svelte'

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    onClick: { action: 'clicked' }
  }
}

export const Primary = {
  args: {
    variant: 'primary',
    label: 'Primary Button'
  }
}

export const Secondary = {
  args: {
    variant: 'secondary',
    label: 'Secondary Button'
  }
}

Multi-component Story:
export const ButtonGroup = {
  render: (args) => ({
    Component: ButtonGroup,
    props: args
  }),
  args: {
    buttons: [
      { label: 'One', variant: 'primary' },
      { label: 'Two', variant: 'secondary' }
    ]
  }
}
```

---

## 2. Controls & Args

```
ArgTypes:
export default {
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger']
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg']
    },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    loading: { control: 'boolean' }
  }
}

Regex Control:
description: {
  control: 'text',
  validate: (val) => val.length > 3 || 'Too short'
}

Object/Array Control:
items: {
  control: 'object',
  defaultValue: [{ id: 1, name: 'Item 1' }]
}

Color Picker:
color: {
  control: 'color'
}
```

---

## 3. Decorators & Context

```
Global Decorator (.storybook/preview.ts):
import '../src/styles/global.css'

export const decorators = [
  (story) => ({
    Component: story,
    props: {
      ...story.args,
      // Add global props
    }
  })
]

Theme Decorator:
import { ThemeProvider } from 'my-design-system'

export const decorators = [
  (story) => ({
    Component: ThemeProvider,
    props: {
      theme: 'dark',
      children: story()
    }
  })
]

Router Decorator:
export const decorators = [
  (story) => ({
    Component: MemoryRouter,
    props: { initialEntries: ['/'] },
    children: story()
  })
]
```

---

## 4. Testing Integration

```
Play Function (Interaction Testing):
export const Clickable = {
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button')
    await userEvent.click(button)
    // Assertions
  }
}

Component Tests:
import { render, screen, fireEvent } from '@testing-library/svelte'
import Button from './Button.svelte'

test('renders button', () => {
  render(Button, { props: { label: 'Test' } })
  expect(screen.getByText('Test')).toBeInTheDocument()
})

test('clicks button', async () => {
  const handleClick = vi.fn()
  render(Button, { props: { onClick: handleClick } })
  await fireEvent.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalled()
})
```

---

## Key Patterns

1. **Document components** — Every UI component should have stories
2. **Use controls** — Make props editable in Storybook
3. **Add interactions** — Use play function for testing
4. **Decorators** — Wrap stories with providers
5. **ArgTypes** — Document and constrain props

---

## Anti-Patterns

```
❌ No stories for components
✅ Every component needs at least one story

❌ Stories without controls
✅ Make props editable for easier testing

❌ Not testing interactions
✅ Use play function for click/hover tests

❌ Hardcoded values in stories
✅ Use args for flexibility

❌ No documentation
✅ Add description to components and args

❌ Not using controls
✅ Enable controls for all props
```

---

## Quick Reference

| Feature | Syntax | Note |
|---|---|---|
| Story | export const Name = { args: {} } | Define story |
| Controls | argTypes with control | Editable props |
| Decorator | decorators: [(story) => {...}] | Wrap stories |
| Play | play: async ({ canvasElement }) => | Interaction test |
| Actions | onClick: { action: 'clicked' } | Event handler |
