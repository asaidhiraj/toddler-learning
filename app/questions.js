// app/questions.js

export const learningModules = {
  tall_short: [
    {
      id: 1,
      question: "Which one is TALL?",
      options: [
        { id: 'a', label: '🦒', isCorrect: true, text: "Giraffe" },
        { id: 'b', label: '🦆', isCorrect: false, text: "Duck" }
      ]
    },
    {
      id: 2,
      question: "Which one is SHORT?",
      options: [
        { id: 'a', label: '🌲', isCorrect: false, text: "Tree" },
        { id: 'b', label: '🍄', isCorrect: true, text: "Mushroom" }
      ]
    }
  ],
  big_small: [
    {
      id: 3,
      question: "Which one is BIG?",
      options: [
        { id: 'a', label: '🐘', isCorrect: true, text: "Elephant" },
        { id: 'b', label: '🐜', isCorrect: false, text: "Ant" }
      ]
    },
    {
      id: 4,
      question: "Which one is SMALL?",
      options: [
        { id: 'a', label: '🐋', isCorrect: false, text: "Whale" },
        { id: 'b', label: '🐞', isCorrect: true, text: "Ladybug" }
      ]
    }
  ],
  fat_thin: [
    {
      id: 5,
      question: "Which one is FAT (Chubby)?",
      options: [
        { id: 'a', label: '🐡', isCorrect: true, text: "Pufferfish" },
        { id: 'b', label: '🐛', isCorrect: false, text: "Worm" }
      ]
    },
    {
      id: 6,
      question: "Which one is THIN?",
      options: [
        { id: 'a', label: '🎃', isCorrect: false, text: "Pumpkin" },
        { id: 'b', label: '✏️', isCorrect: true, text: "Pencil" }
      ]
    }
  ],
  more_less: [
    {
      id: 7,
      question: "Which side has MORE?",
      options: [
        { id: 'a', label: '🍪🍪🍪', isCorrect: true, text: "3 Cookies" },
        { id: 'b', label: '🍪', isCorrect: false, text: "1 Cookie" }
      ]
    },
    {
      id: 8,
      question: "Which side has LESS?",
      options: [
        { id: 'a', label: '🎈🎈🎈🎈', isCorrect: false, text: "4 Balloons" },
        { id: 'b', label: '🎈🎈', isCorrect: true, text: "2 Balloons" }
      ]
    }
  ],
  counting: [
    {
      id: 9,
      question: "How many Apples?",
      display: '🍎🍎',
      options: [
        { id: 'a', label: '2', isCorrect: true, text: "Two" },
        { id: 'b', label: '5', isCorrect: false, text: "Five" }
      ]
    },
    {
      id: 10,
      question: "How many Stars?",
      display: '⭐⭐⭐',
      options: [
        { id: 'a', label: '1', isCorrect: false, text: "One" },
        { id: 'b', label: '3', isCorrect: true, text: "Three" }
      ]
    }
  ]
};
