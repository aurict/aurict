import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import type { QuestionRequest, QuestionAnswer } from "@aurict/core"

interface Props {
  request:  QuestionRequest
  onAnswer: (answers: QuestionAnswer[]) => void
  onReject: () => void
}

export function QuestionPrompt({ request, onAnswer, onReject }: Props) {
  const [questionIdx, setQuestionIdx]   = useState(0)
  const [optionIdx,   setOptionIdx]     = useState(0)
  // Her soru için seçili label'lar
  const [selected,    setSelected]      = useState<QuestionAnswer[]>(
    () => request.questions.map(() => []),
  )

  const currentQuestion = request.questions[questionIdx]!
  const allOptions = [
    ...currentQuestion.options,
    ...(currentQuestion.custom !== false ? [{ label: "Custom answer...", description: "Type your own answer" }] : []),
  ]
  const isMultiple = currentQuestion.multiple === true
  const isLastQ    = questionIdx === request.questions.length - 1

  useInput((_input, key) => {
    if (key.escape) {
      onReject()
      return
    }

    if (key.upArrow) {
      setOptionIdx((i) => Math.max(0, i - 1))
      return
    }

    if (key.downArrow) {
      setOptionIdx((i) => Math.min(allOptions.length - 1, i + 1))
      return
    }

    // Space: toggle seçim (multiple modunda)
    if (key.tab || _input === " ") {
      if (!isMultiple) return
      const label = allOptions[optionIdx]?.label ?? ""
      setSelected((prev) => {
        const next = [...prev]
        const cur  = next[questionIdx] ?? []
        if (cur.includes(label)) {
          next[questionIdx] = cur.filter((l) => l !== label)
        } else {
          next[questionIdx] = [...cur, label]
        }
        return next
      })
      return
    }

    // Enter: onayla
    if (key.return) {
      const label = allOptions[optionIdx]?.label ?? ""

      // Seçim yap (single mode veya empty selection)
      let finalSelected: QuestionAnswer[]
      if (isMultiple) {
        const cur = selected[questionIdx] ?? []
        finalSelected = [
          ...selected.slice(0, questionIdx),
          cur.length > 0 ? cur : [label],
          ...selected.slice(questionIdx + 1),
        ]
      } else {
        finalSelected = [
          ...selected.slice(0, questionIdx),
          [label],
          ...selected.slice(questionIdx + 1),
        ]
      }

      setSelected(finalSelected)

      if (isLastQ) {
        onAnswer(finalSelected)
      } else {
        setQuestionIdx((q) => q + 1)
        setOptionIdx(0)
      }
    }
  })

  if (!currentQuestion) return null

  const curSelected = selected[questionIdx] ?? []

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      paddingY={0}
      marginBottom={1}
    >
      {/* Başlık */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🤔 {currentQuestion.header}
        </Text>
        <Text color="gray"> ({questionIdx + 1}/{request.questions.length})</Text>
      </Box>

      {/* Soru metni */}
      <Box marginBottom={1}>
        <Text wrap="wrap">{currentQuestion.question}</Text>
      </Box>

      {/* Seçenekler */}
      {allOptions.map((opt, i) => {
        const isActive   = i === optionIdx
        const isSelected = curSelected.includes(opt.label)
        const prefix     = isMultiple
          ? (isSelected ? "[✓] " : "[ ] ")
          : (isActive ? "▶ " : "  ")

        return (
          <Box key={i} marginLeft={1}>
            <Text
              color={isActive ? "yellow" : isSelected ? "green" : "white"}
              bold={isActive}
            >
              {prefix}
              <Text bold={isActive}>{opt.label}</Text>
              {opt.description ? (
                <Text color="gray"> — {opt.description}</Text>
              ) : null}
            </Text>
          </Box>
        )
      })}

      {/* Tuş yardımı */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {isMultiple
            ? "↑↓ navigate  Space toggle  Enter confirm  Esc dismiss"
            : "↑↓ navigate  Enter select  Esc dismiss"}
        </Text>
      </Box>
    </Box>
  )
}
