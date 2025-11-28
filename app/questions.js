// app/questions.js

export const learningModules = {
  tall_short: [
    { q: "Which one is TALL?",  a: { txt: "Giraffe", icon: "🦒" }, b: { txt: "Duck", icon: "🦆" }, correct: 'a' },
    { q: "Which one is SHORT?", a: { txt: "Tree", icon: "🌲" },   b: { txt: "Flower", icon: "🌻" }, correct: 'b' },
    { q: "Which one is TALL?",  a: { txt: "Building", icon: "🏢" }, b: { txt: "House", icon: "🏠" }, correct: 'a' },
    { q: "Which one is SHORT?", a: { txt: "Ladder", icon: "🪜" },  b: { txt: "Stool", icon: "🪑" }, correct: 'b' },
    { q: "Which one is TALL?",  a: { txt: "Mountain", icon: "🏔️" }, b: { txt: "Hill", icon: "⛰️" }, correct: 'a' },
    { q: "Which one is SHORT?", a: { txt: "Adult", icon: "👨" },   b: { txt: "Baby", icon: "👶" }, correct: 'b' },
    { q: "Which one is TALL?",  a: { txt: "Tower", icon: "🗼" },   b: { txt: "Tent", icon: "⛺" }, correct: 'a' },
  ],
  big_small: [
    { q: "Which one is BIG?",   a: { txt: "Elephant", icon: "🐘" }, b: { txt: "Ant", icon: "🐜" }, correct: 'a' },
    { q: "Which one is SMALL?", a: { txt: "Whale", icon: "🐋" },   b: { txt: "Fish", icon: "🐠" }, correct: 'b' },
    { q: "Which one is BIG?",   a: { txt: "Bus", icon: "🚌" },      b: { txt: "Car", icon: "🚗" }, correct: 'a' },
    { q: "Which one is SMALL?", a: { txt: "Watermelon", icon: "🍉" }, b: { txt: "Grape", icon: "🍇" }, correct: 'b' },
    { q: "Which one is BIG?",   a: { txt: "Earth", icon: "🌍" },    b: { txt: "Moon", icon: "🌕" }, correct: 'a' },
    { q: "Which one is SMALL?", a: { txt: "Lion", icon: "🦁" },    b: { txt: "Mouse", icon: "🐭" }, correct: 'b' },
    { q: "Which one is BIG?",   a: { txt: "Truck", icon: "🚛" },    b: { txt: "Bike", icon: "🚲" }, correct: 'a' },
  ],
  fat_thin: [
    { q: "Which one is FAT (Chubby)?", a: { txt: "Pufferfish", icon: "🐡" }, b: { txt: "Worm", icon: "🪱" }, correct: 'a' },
    { q: "Which one is THIN?",       a: { txt: "Pumpkin", icon: "🎃" },    b: { txt: "Pencil", icon: "✏️" }, correct: 'b' },
    { q: "Which one is FAT?",        a: { txt: "Hippo", icon: "🦛" },      b: { txt: "Snake", icon: "🐍" }, correct: 'a' },
    { q: "Which one is THIN?",       a: { txt: "Tree Trunk", icon: "🪵" }, b: { txt: "Twig", icon: "🌿" }, correct: 'b' },
    { q: "Which one is FAT?",        a: { txt: "Pig", icon: "🐖" },        b: { txt: "Flamingo", icon: "🦩" }, correct: 'a' },
  ],
  more_less: [
    { q: "Which side has MORE?", a: { txt: "3 Cookies", icon: "🍪🍪🍪" }, b: { txt: "1 Cookie", icon: "🍪" }, correct: 'a' },
    { q: "Which side has LESS?", a: { txt: "4 Balloons", icon: "🎈🎈🎈🎈" }, b: { txt: "2 Balloons", icon: "🎈🎈" }, correct: 'b' },
    { q: "Which side has MORE?", a: { txt: "5 Stars", icon: "⭐⭐⭐⭐⭐" }, b: { txt: "2 Stars", icon: "⭐⭐" }, correct: 'a' },
    { q: "Which side has LESS?", a: { txt: "3 Apples", icon: "🍎🍎🍎" }, b: { txt: "1 Apple", icon: "🍎" }, correct: 'b' },
    { q: "Which side has MORE?", a: { txt: "Many Fish", icon: "🐟🐟🐟🐟" }, b: { txt: "One Fish", icon: "🐟" }, correct: 'a' },
  ],
  counting: [
    { q: "How many Apples?", display: "🍎🍎", a: { txt: "Two", icon: "2️⃣" }, b: { txt: "Five", icon: "5️⃣" }, correct: 'a' },
    { q: "How many Stars?",  display: "⭐⭐⭐", a: { txt: "One", icon: "1️⃣" }, b: { txt: "Three", icon: "3️⃣" }, correct: 'b' },
    { q: "How many Cars?",   display: "🚗", a: { txt: "One", icon: "1️⃣" }, b: { txt: "Four", icon: "4️⃣" }, correct: 'a' },
    { q: "How many Balls?",  display: "⚽⚽⚽⚽", a: { txt: "Two", icon: "2️⃣" }, b: { txt: "Four", icon: "4️⃣" }, correct: 'b' },
    { q: "How many Cats?",   display: "🐱🐱", a: { txt: "Two", icon: "2️⃣" }, b: { txt: "Six", icon: "6️⃣" }, correct: 'a' },
  ],
  // --- NEW CATEGORIES ---
  colors: [
    { q: "Touch the RED one", a: { txt: "Apple", icon: "🍎" }, b: { txt: "Leaf", icon: "🍃" }, correct: 'a' },
    { q: "Touch the BLUE one", a: { txt: "Sun", icon: "☀️" }, b: { txt: "Ocean", icon: "🌊" }, correct: 'b' },
    { q: "Touch the YELLOW one", a: { txt: "Banana", icon: "🍌" }, b: { txt: "Grapes", icon: "🍇" }, correct: 'a' },
    { q: "Touch the GREEN one", a: { txt: "Fire", icon: "🔥" }, b: { txt: "Turtle", icon: "🐢" }, correct: 'b' },
    { q: "Touch the ORANGE one", a: { txt: "Basketball", icon: "🏀" }, b: { txt: "Moon", icon: "🌕" }, correct: 'a' },
  ],
  fast_slow: [
    { q: "Which one is FAST?", a: { txt: "Rocket", icon: "🚀" }, b: { txt: "Snail", icon: "🐌" }, correct: 'a' },
    { q: "Which one is SLOW?", a: { txt: "Race Car", icon: "🏎️" }, b: { txt: "Turtle", icon: "🐢" }, correct: 'b' },
    { q: "Which one is FAST?", a: { txt: "Cheetah", icon: "🐆" }, b: { txt: "Sloth", icon: "🦥" }, correct: 'a' },
    { q: "Which one is SLOW?", a: { txt: "Plane", icon: "✈️" }, b: { txt: "Walking", icon: "🚶" }, correct: 'b' },
  ],
  hot_cold: [
    { q: "Which one is HOT?", a: { txt: "Fire", icon: "🔥" }, b: { txt: "Snowman", icon: "⛄" }, correct: 'a' },
    { q: "Which one is COLD?", a: { txt: "Soup", icon: "🍲" }, b: { txt: "Ice Cube", icon: "🧊" }, correct: 'b' },
    { q: "Which one is HOT?", a: { txt: "Sun", icon: "☀️" }, b: { txt: "Rain", icon: "🌧️" }, correct: 'a' },
    { q: "Which one is COLD?", a: { txt: "Volcano", icon: "🌋" }, b: { txt: "Ice Cream", icon: "🍦" }, correct: 'b' },
  ]
};
