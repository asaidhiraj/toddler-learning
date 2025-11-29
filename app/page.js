// app/page.js
"use client";
import { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { learningModules } from './questions';

// Helper to shuffle questions so it's always different
const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Question Pool Management
const getQuestionPool = (category) => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(`toddlerApp_questionPool_${category}`);
  return saved ? JSON.parse(saved) : [];
};

const saveQuestionPool = (category, questions) => {
  if (typeof window === 'undefined') return;
  // Keep max 100 questions per category
  const existing = getQuestionPool(category);
  const combined = [...existing, ...questions];
  const unique = combined.filter((q, index, self) => 
    index === self.findIndex(t => t.q === q.q)
  );
  const pool = unique.slice(-100); // Keep last 100 unique questions
  localStorage.setItem(`toddlerApp_questionPool_${category}`, JSON.stringify(pool));
};

const getRandomQuestionsFromPool = (category, count = 2) => {
  const pool = getQuestionPool(category);
  if (pool.length === 0) return [];
  const shuffled = shuffleArray([...pool]);
  return shuffled.slice(0, count);
};

export default function Home() {
  const [category, setCategory] = useState(null);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [score, setScore] = useState(0); // Current streak in this round
  const [showReward, setShowReward] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef(null);
  const [stickers, setStickers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toddlerAppStickers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [totalStars, setTotalStars] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toddlerAppTotalStars');
      return saved ? parseInt(saved) || 0 : 0;
    }
    return 0;
  });
  const [gamesPlayed, setGamesPlayed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toddlerAppGamesPlayed');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [showParentMode, setShowParentMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [useAIQuestions, setUseAIQuestions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toddlerAppUseAI');
      return saved ? JSON.parse(saved) : true; // Default to AI
    }
    return true;
  });
  const audioContextRef = useRef(null);

  const WIN_CONDITION = 5; // He needs 5 right answers to get the big reward

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  // Text-to-Speech function
  const speakText = (text, rate = 0.8, pitch = 1.1) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      utterance.lang = 'en-US';
      
      const voices = window.speechSynthesis.getVoices();
      const childVoice = voices.find(voice => 
        voice.name.includes('Child') || 
        voice.name.includes('Kids') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen')
      );
      if (childVoice) {
        utterance.voice = childVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    }
  };

  // Load voices when available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Pre-populate question pools VERY slowly (only 1 category, with long delay)
  useEffect(() => {
    if (!useAIQuestions || typeof window === 'undefined') return;
    
    // Only pre-populate ONE most common category, very slowly
    const prePopulatePool = async () => {
      const catKey = 'colors'; // Just one category
      const pool = getQuestionPool(catKey);
      // Only pre-populate if pool is very small (< 10 questions)
      if (pool.length >= 10) return;
      
      const categoryTopics = {
        colors: 'colors and colored objects (vegetarian and Hindu context only)',
      };
      
      const topic = categoryTopics[catKey] || catKey;
      
      try {
        // Wait 10 seconds before even trying
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: catKey, topic })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.questions && data.questions.length > 0) {
            saveQuestionPool(catKey, data.questions);
            console.log('Pre-populated pool for', catKey);
          }
        } else if (response.status === 429) {
          console.log('Rate limited during pre-population, skipping');
        }
      } catch (error) {
        console.log('Background pre-population skipped');
      }
    };
    
    // Only pre-populate after 5 seconds, and only one category
    setTimeout(() => prePopulatePool(), 5000);
  }, [useAIQuestions]);

  // Auto-speak when question changes for math/alphabet/simple_addition modules
  useEffect(() => {
    if (questionQueue.length > 0 && category) {
      const currentQ = questionQueue[0];
      if (currentQ.speakText && (category === 'math_numbers' || category === 'alphabet' || category === 'simple_addition')) {
        const timer = setTimeout(() => {
          speakText(currentQ.speakText);
        }, 300);
        return () => clearTimeout(timer);
      }
      // Play animal sound if available
      if (currentQ.sound && category === 'animals') {
        const timer = setTimeout(() => {
          playAnimalSound(currentQ.sound);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [questionQueue, category]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Save stickers to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toddlerAppStickers', JSON.stringify(stickers));
      localStorage.setItem('toddlerAppTotalStars', totalStars.toString());
      localStorage.setItem('toddlerAppGamesPlayed', JSON.stringify(gamesPlayed));
    }
  }, [stickers, totalStars, gamesPlayed]);

  // --- AUDIO ENGINE ---
  // Initialize audio context on user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          // Resume immediately if suspended
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(err => console.log('Audio resume failed:', err));
          }
        }
      }
    };
    
    // Initialize on first user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  const playSound = (type) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.log('AudioContext not supported');
        return;
      }
      
      // Use existing context or create new one
      let audioCtx = audioContextRef.current;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
      }
      
      // Resume audio context if suspended (required by some browsers)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(err => {
          console.log('Audio resume failed:', err);
          return;
        });
      }
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

    if (type === 'correct') {
      // Cheerful chord
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => { // C Major chord
        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.connect(gn);
        gn.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.start(now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.stop(now + 0.5);
      });
    } else if (type === 'wrong') {
      // Gentle low "oops"
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'win') {
      // Victory Fanfare
      const now = audioCtx.currentTime;
      const melody = [523, 659, 783, 1046, 783, 1046];
      melody.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.connect(gn);
        gn.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'square';
        osc.start(now + i * 0.15);
        gn.gain.setValueAtTime(0.1, now + i * 0.15);
        gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.stop(now + i * 0.15 + 0.4);
      });
    } else if (type === 'pop') {
      // Pop sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'whoosh') {
      // Whoosh sound
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    }
    } catch (error) {
      console.error('Sound playback error:', error);
      // Try to create a new context if the old one failed
      if (audioContextRef.current && audioContextRef.current.state === 'closed') {
        audioContextRef.current = null;
      }
    }
  };

  // Animal sounds (simple tone approximations)
  const playAnimalSound = (animal) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.log('AudioContext not supported for animal sound');
        return;
      }
      
      // Use existing context or create new one
      let audioCtx = audioContextRef.current;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
      }
      
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(err => {
          console.log('Audio resume failed for animal sound:', err);
          return;
        });
      }
      
      const sounds = {
      moo: { freq: 150, duration: 0.4 },
      woof: { freq: 200, duration: 0.2 },
      meow: { freq: 400, duration: 0.3 },
      quack: { freq: 300, duration: 0.2 },
      roar: { freq: 100, duration: 0.5 },
      oink: { freq: 180, duration: 0.3 },
      baa: { freq: 250, duration: 0.4 },
      neigh: { freq: 350, duration: 0.4 }
    };
    
    const sound = sounds[animal];
    if (sound) {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = sound.freq;
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + sound.duration);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + sound.duration);
    }
    } catch (error) {
      console.log('Animal sound playback error:', error);
    }
  };

  const generateQuestionsWithAI = async (catKey) => {
    const categoryTopics = {
      tall_short: 'tall and short objects',
      big_small: 'big and small objects',
      colors: 'colors and colored objects',
      counting: 'counting numbers 1 to 5',
      fast_slow: 'fast and slow things',
      hot_cold: 'hot and cold things',
      more_less: 'more and less quantities',
      fat_thin: 'fat and thin objects',
      superhero: 'superheroes',
      math_numbers: 'numbers 1 to 10',
      alphabet: 'alphabet letters A to Z',
      shapes: 'shapes like circle, square, triangle',
      body_parts: 'body parts',
      opposites: 'opposites like up/down, in/out',
      animals: 'animals and their sounds (vegetarian context only)',
      food: 'vegetarian food items only (no meat, fish, eggs)',
      transportation: 'vehicles and transportation',
      emotions: 'emotions and feelings',
      weather: 'weather conditions',
      simple_addition: 'simple addition 1+1 to 5+5',
      find_object: 'finding objects among options',
      patterns: 'completing patterns',
      habits: 'good habits and bad habits',
      vegetables_fruits: 'vegetarian vegetables and fruits only',
      places_india: 'places in India (Hindu context)',
      important_people: 'important people like doctor, teacher',
      temples_gods: 'Hindu temples and Hindu gods only (no other religions)',
      heavy_light: 'heavy and light objects',
      family: 'family members',
      seasons: 'seasons like summer, winter, rainy',
      time_of_day: 'time of day like morning, afternoon, night',
      indoor_outdoor: 'indoor and outdoor activities',
      loud_quiet: 'loud and quiet sounds',
      clean_dirty: 'clean and dirty things',
      healthy_unhealthy: 'healthy and unhealthy vegetarian food only',
      can_fly: 'things that can fly',
      water_land: 'animals that live in water or on land (vegetarian context)',
      musical_instruments: 'musical instruments',
      indian_festivals: 'Hindu festivals only (Diwali, Holi, etc. - no other religions)',
      body_movements: 'body movements like jump, run, sit',
      same_different: 'same and different objects',
      living_nonliving: 'living and non-living things',
      safe_unsafe: 'safe and unsafe things',
      first_last: 'first and last in sequences',
      day_night_activities: 'day and night activities',
      indian_traditional: 'Indian traditional and modern items',
      bigger_smaller_number: 'bigger and smaller numbers',
      soft_hard: 'soft and hard objects',
      sweet_sour: 'sweet and sour tastes',
      trace_shape_matching: 'matching shapes to outlines',
      birds: 'birds',
      more_animals: 'different types of animals',
      daily_habits: 'daily habits and morning routines',
      utensils_eating: 'utensils like spoon, plate, cup, bowl, fork, knife',
      space: 'space, sun, moon, planets, galaxy, asteroid, stars'
    };

    // Step 1: Check pool first
    const poolQuestions = getRandomQuestionsFromPool(catKey, 7);
    const currentPool = getQuestionPool(catKey);
    
    if (poolQuestions.length >= 5) {
      // Start game immediately with pool questions
      console.log('Using questions from pool:', poolQuestions.length);
      setQuestionQueue(poolQuestions);
      setCategory(catKey);
      setScore(0);
      setShowReward(false);
      setIsGeneratingQuestions(false);
      
      // Step 2: Generate in background ONLY if pool is low (< 15) and wait 5 seconds
      if (currentPool.length < 15) {
        setTimeout(async () => {
          try {
            const topic = categoryTopics[catKey] || catKey;
            const response = await fetch('/api/generate-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category: catKey, topic })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.questions && data.questions.length > 0) {
                saveQuestionPool(catKey, data.questions);
                console.log('Background: saved', data.questions.length, 'questions to pool');
              }
            }
          } catch (error) {
            // Silently fail - user is playing
          }
        }, 5000); // Wait 5 seconds before background generation
      }
      return;
    }
    
    // Step 3: No pool available - generate immediately (loading screen already shown)
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('AI generation timeout, using static questions');
      if (learningModules[catKey]) {
        const questions = shuffleArray([...learningModules[catKey]]);
        setQuestionQueue(questions);
        setCategory(catKey);
        setScore(0);
        setShowReward(false);
        setIsGeneratingQuestions(false);
      }
    }, 10000); // 10 second timeout
    
    try {
      const topic = categoryTopics[catKey] || catKey;
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: catKey, topic })
      });

      clearTimeout(timeoutId); // Clear timeout if request succeeds

      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          const questions = shuffleArray(data.questions);
          saveQuestionPool(catKey, data.questions);
          setQuestionQueue(questions);
          setCategory(catKey);
          setScore(0);
          setShowReward(false);
          setIsGeneratingQuestions(false);
          return;
        }
      }
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Error generating questions:', error);
    }
    
    // Final fallback to static
    if (learningModules[catKey]) {
      console.log('Falling back to static questions for:', catKey);
      const questions = shuffleArray([...learningModules[catKey]]);
      setQuestionQueue(questions);
      setCategory(catKey);
      setScore(0);
      setShowReward(false);
      setIsGeneratingQuestions(false);
    } else {
      console.error('No questions available for category:', catKey);
      setIsGeneratingQuestions(false);
    }
  };

  const startCategory = (catKey) => {
    // Use AI if enabled, otherwise use static questions
    if (useAIQuestions) {
      generateQuestionsWithAI(catKey);
    } else {
      // Static mode: Use coin toss to decide between pool and static
      const pool = getQuestionPool(catKey);
      const usePool = pool.length > 0 && Math.random() > 0.5; // 50% chance to use pool
      
      if (usePool) {
        // Randomly select questions from pool
        const questions = getRandomQuestionsFromPool(catKey, 7);
        if (questions.length > 0) {
          setQuestionQueue(questions);
          setCategory(catKey);
          setScore(0);
          setShowReward(false);
          return;
        }
      }
      
      // Fallback to static questions
      if (learningModules[catKey]) {
        const questions = shuffleArray([...learningModules[catKey]]);
        setQuestionQueue(questions);
        setCategory(catKey);
        setScore(0);
        setShowReward(false);
      }
    }
  };

  const handleAnswer = (choice) => {
    const currentQ = questionQueue[0];
    let isCorrect;
    
    // Handle find_object game type (uses numeric index)
    if (category === 'find_object' && currentQ.options) {
      isCorrect = choice === currentQ.correct;
    } else {
      // Handle standard game type (uses 'a' or 'b')
      isCorrect = choice === currentQ.correct;
    }
    
    setShowHint(false);

    if (isCorrect) {
      playSound('correct');
      playSound('pop');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);
      setTotalStars(prev => prev + 1);

      setTimeout(() => {
        setFeedback(null);
        if (newScore >= WIN_CONDITION) {
          setShowReward(true);
          playSound('win');
          playSound('whoosh');
          
          // Award sticker
          const stickerEmojis = ['⭐', '🌟', '🎉', '🏆', '🎈', '🎊', '🎁', '🎯', '💫', '✨', '🎨', '🎪', '🎭', '🎬', '🎮'];
          const randomSticker = stickerEmojis[Math.floor(Math.random() * stickerEmojis.length)];
          setStickers(prev => [...prev, { emoji: randomSticker, category, date: new Date().toISOString() }]);
          
          // Track game played
          setGamesPlayed(prev => ({
            ...prev,
            [category]: (prev[category] || 0) + 1
          }));
        } else {
          // Remove current question and move to next
          setQuestionQueue(prev => {
            const newQueue = prev.slice(1);
            // If queue is getting low and we're using AI, refill from pool
            if (newQueue.length <= 1 && useAIQuestions && category) {
              const moreQuestions = getRandomQuestionsFromPool(category, 5);
              if (moreQuestions.length > 0) {
                console.log('Refilling queue with', moreQuestions.length, 'questions from pool');
                return [...newQueue, ...moreQuestions];
              }
            }
            return newQueue;
          });
        }
      }, 1000);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
    }
  };

  const resetGame = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCategory(null);
    setScore(0);
    setShowReward(false);
    setQuestionQueue([]);
    setFeedback(null);
  };

  const handleReplaySound = () => {
    if (questionQueue.length > 0) {
      const currentQ = questionQueue[0];
      if (currentQ.speakText) {
        speakText(currentQ.speakText);
      } else if (currentQ.sound && category === 'animals') {
        playAnimalSound(currentQ.sound);
      }
    }
  };

  const handleShowHint = () => {
    if (questionQueue.length > 0) {
      setShowHint(true);
      playSound('pop');
    }
  };

  const playRandomGame = () => {
    const categories = Object.keys(learningModules);
    if (categories.length === 0) {
      console.error('No categories available');
      return;
    }
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    console.log('Playing random game:', randomCategory);
    startCategory(randomCategory);
  };

  // --- SCREEN: REWARD ---
  if (showReward) {
    const rewardEmoji = category === 'superhero' ? '🦸' : category === 'math_numbers' ? '🔢' : category === 'alphabet' ? '📚' : category === 'simple_addition' ? '➕' : '🏆';
    const latestSticker = stickers[stickers.length - 1];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-300 via-pink-300 via-purple-300 to-blue-300 text-center p-4 relative overflow-hidden">
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={500} recycle={false} />
        {/* Floating emojis */}
        <div className="absolute top-10 left-10 text-7xl animate-bounce" style={{ animationDelay: '0s' }}>🎉</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDelay: '1.5s' }}>🎈</div>
        
        <div className="text-9xl mb-4 animate-bounce relative z-10" style={{ animationDuration: '0.8s' }}>{rewardEmoji}</div>
        <h1 className="text-7xl md:text-8xl font-black mb-4 drop-shadow-2xl relative z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent animate-pulse">YOU DID IT!</h1>
        {latestSticker && (
          <div className="mb-6">
            <p className="text-3xl font-bold text-purple-800 mb-2">You earned a sticker!</p>
            <div className="text-8xl animate-pulse">{latestSticker.emoji}</div>
          </div>
        )}
        <div className="mb-4 text-2xl font-bold text-purple-800">
          Total Stars: {totalStars} ⭐
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <button 
            onClick={() => startCategory(category)}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl rounded-full font-black shadow-2xl border-b-8 border-purple-800 hover:scale-110 active:scale-95 active:border-b-0 active:translate-y-2 transition-all transform relative z-10"
            style={{ boxShadow: '0 15px 35px rgba(147, 51, 234, 0.4)' }}
          >
            Play Again 🔄
          </button>
          <button 
            onClick={resetGame}
            className="px-10 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-2xl rounded-full font-black shadow-2xl border-b-8 border-blue-700 hover:scale-110 active:scale-95 active:border-b-0 active:translate-y-2 transition-all transform relative z-10"
            style={{ boxShadow: '0 15px 35px rgba(59, 130, 246, 0.4)' }}
          >
            New Game 🏠
          </button>
        </div>
      </div>
    );
  }

  // --- SCREEN: PARENT MODE ---
  if (showParentMode && !category) {
    const totalGames = Object.values(gamesPlayed).reduce((sum, count) => sum + count, 0);
    const favoriteGame = Object.entries(gamesPlayed).sort((a, b) => b[1] - a[1])[0];
    const categoryNames = {
      tall_short: 'Tall & Short',
      big_small: 'Big & Small',
      colors: 'Colors',
      counting: 'Counting',
      fast_slow: 'Fast & Slow',
      hot_cold: 'Hot & Cold',
      more_less: 'More & Less',
      fat_thin: 'Fat & Thin',
      superhero: 'Superhero',
      math_numbers: 'Math Numbers',
      alphabet: 'Alphabet',
      shapes: 'Shapes',
      body_parts: 'Body Parts',
      opposites: 'Opposites',
      animals: 'Animals',
      food: 'Food',
      transportation: 'Transportation',
      emotions: 'Emotions',
      weather: 'Weather',
      simple_addition: 'Simple Addition',
      find_object: 'Find Object',
      patterns: 'Patterns',
      habits: 'Good Habits',
      vegetables_fruits: 'Vegetables & Fruits',
      places_india: 'Places in India',
      important_people: 'Important People',
      temples_gods: 'Temples & Gods',
      heavy_light: 'Heavy & Light',
      family: 'Family',
      seasons: 'Seasons',
      time_of_day: 'Time of Day',
      indoor_outdoor: 'Indoor/Outdoor',
      loud_quiet: 'Loud & Quiet',
      clean_dirty: 'Clean & Dirty',
      healthy_unhealthy: 'Healthy Food',
      can_fly: 'Can Fly',
      water_land: 'Water & Land',
      musical_instruments: 'Musical Instruments',
      indian_festivals: 'Indian Festivals',
      body_movements: 'Body Movements',
      same_different: 'Same/Different',
      living_nonliving: 'Living Things',
      safe_unsafe: 'Safe & Unsafe',
      first_last: 'First & Last',
      day_night_activities: 'Day/Night Activities',
      indian_traditional: 'Indian Traditional',
      bigger_smaller_number: 'Bigger/Smaller Number',
      soft_hard: 'Soft & Hard',
      sweet_sour: 'Sweet & Sour',
      trace_shape_matching: 'Shape Matching',
      birds: 'Birds',
      more_animals: 'More Animals',
      daily_habits: 'Daily Habits',
      utensils_eating: 'Utensils & Eating',
      space: 'Space & Planets'
    };
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-4">
        <h1 className="text-5xl font-black text-indigo-800 mb-8">Parent Dashboard 📊</h1>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 bg-yellow-100 rounded-2xl">
              <div className="text-4xl font-black text-yellow-700">{totalStars}</div>
              <div className="text-xl font-bold text-yellow-800">Total Stars ⭐</div>
            </div>
            <div className="text-center p-4 bg-purple-100 rounded-2xl">
              <div className="text-4xl font-black text-purple-700">{stickers.length}</div>
              <div className="text-xl font-bold text-purple-800">Stickers Earned 🎖️</div>
            </div>
            <div className="text-center p-4 bg-green-100 rounded-2xl">
              <div className="text-4xl font-black text-green-700">{totalGames}</div>
              <div className="text-xl font-bold text-green-800">Games Completed 🎮</div>
            </div>
            <div className="text-center p-4 bg-pink-100 rounded-2xl">
              <div className="text-4xl font-black text-pink-700">{Object.keys(gamesPlayed).length}</div>
              <div className="text-xl font-bold text-pink-800">Games Played 📚</div>
            </div>
          </div>
          {favoriteGame && (
            <div className="mb-6 p-4 bg-indigo-100 rounded-2xl">
              <div className="text-2xl font-bold text-indigo-800 mb-2">Favorite Game:</div>
              <div className="text-3xl font-black text-indigo-900">{categoryNames[favoriteGame[0]] || favoriteGame[0]}</div>
              <div className="text-xl text-indigo-700">Played {favoriteGame[1]} time{favoriteGame[1] !== 1 ? 's' : ''}</div>
            </div>
          )}
          <div className="mb-6">
            <div className="text-2xl font-bold text-indigo-800 mb-3">Recent Stickers:</div>
            <div className="flex flex-wrap gap-2">
              {stickers.slice(-10).reverse().map((sticker, i) => (
                <span key={i} className="text-4xl">{sticker.emoji}</span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowParentMode(false)}
            className="w-full px-8 py-4 bg-indigo-600 text-white text-2xl rounded-full font-bold shadow-xl border-b-8 border-indigo-800 active:border-b-0 active:translate-y-2 transition-all"
          >
            Back to Games 🏠
          </button>
        </div>
      </div>
    );
  }

  // --- SCREEN: CATEGORY SELECTION ---
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 via-blue-200 to-yellow-200 p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>⭐</div>
        <div className="absolute top-20 right-20 text-5xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>✨</div>
        <div className="absolute bottom-20 left-20 text-4xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>🎈</div>
        <div className="absolute bottom-10 right-10 text-5xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }}>🎉</div>
        
        <div className="w-full max-w-3xl flex justify-between items-center mb-4 relative z-10">
          <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">⭐ {totalStars} Stars</div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const newValue = !useAIQuestions;
                setUseAIQuestions(newValue);
                localStorage.setItem('toddlerAppUseAI', JSON.stringify(newValue));
              }}
              className={`px-6 py-3 ${useAIQuestions ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white text-lg rounded-full font-black shadow-xl border-b-4 border-black/30 hover:scale-110 active:scale-95 transition-all transform flex items-center gap-2`}
              title={useAIQuestions ? 'AI is ON - Click to turn OFF (use static questions)' : 'AI is OFF - Click to turn ON (use AI questions)'}
            >
              <span>🤖 AI</span>
              <span className={`px-3 py-1 rounded-full text-sm font-black ${useAIQuestions ? 'bg-white text-green-600' : 'bg-gray-600 text-white'}`}>
                {useAIQuestions ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              onClick={() => setShowParentMode(true)}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg rounded-full font-black shadow-xl border-b-4 border-black/30 hover:scale-110 active:scale-95 transition-all transform"
            >
              📊 Stats
            </button>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tight relative z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">Let's Play! 🚀</h1>
        
        {/* Play a GAME Button - Prominent and Large */}
        <button
          onClick={playRandomGame}
          className="mb-10 px-16 py-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white text-4xl md:text-5xl font-black rounded-3xl shadow-2xl border-b-8 border-purple-900 hover:brightness-110 hover:scale-105 active:border-b-0 active:translate-y-2 transition-all transform relative z-10 animate-bounce hover:animate-none"
          style={{ boxShadow: '0 20px 40px rgba(147, 51, 234, 0.4)' }}
        >
          🎮 Play a GAME 🎮
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl relative z-10">
          <MenuButton onClick={() => startCategory('tall_short')} color="bg-orange-400" label="🦒 Tall & Short" />
          <MenuButton onClick={() => startCategory('big_small')} color="bg-green-500" label="🐘 Big & Small" />
          <MenuButton onClick={() => startCategory('colors')} color="bg-pink-500" label="🎨 Colors" />
          <MenuButton onClick={() => startCategory('counting')} color="bg-red-500" label="🍎 Counting" />
          <MenuButton onClick={() => startCategory('fast_slow')} color="bg-yellow-400" label="🚀 Fast & Slow" />
          <MenuButton onClick={() => startCategory('hot_cold')} color="bg-blue-400" label="🔥 Hot & Cold" />
          <MenuButton onClick={() => startCategory('more_less')} color="bg-purple-500" label="🍪 More & Less" />
          <MenuButton onClick={() => startCategory('fat_thin')} color="bg-teal-500" label="🐡 Fat & Thin" />
          <MenuButton onClick={() => startCategory('superhero')} color="bg-red-600" label="🦸 Superhero" />
          <MenuButton onClick={() => startCategory('math_numbers')} color="bg-indigo-500" label="🔢 Math Numbers" />
          <MenuButton onClick={() => startCategory('alphabet')} color="bg-emerald-500" label="📚 Alphabet" />
          <MenuButton onClick={() => startCategory('shapes')} color="bg-cyan-500" label="🔷 Shapes" />
          <MenuButton onClick={() => startCategory('body_parts')} color="bg-rose-500" label="👃 Body Parts" />
          <MenuButton onClick={() => startCategory('opposites')} color="bg-violet-500" label="⬆️ Opposites" />
          <MenuButton onClick={() => startCategory('animals')} color="bg-amber-500" label="🐄 Animals" />
          <MenuButton onClick={() => startCategory('food')} color="bg-lime-500" label="🍎 Food" />
          <MenuButton onClick={() => startCategory('transportation')} color="bg-sky-500" label="✈️ Transportation" />
          <MenuButton onClick={() => startCategory('emotions')} color="bg-fuchsia-500" label="😊 Emotions" />
          <MenuButton onClick={() => startCategory('weather')} color="bg-slate-400" label="☀️ Weather" />
          <MenuButton onClick={() => startCategory('simple_addition')} color="bg-orange-600" label="➕ Addition" />
          <MenuButton onClick={() => startCategory('find_object')} color="bg-amber-600" label="🔍 Find Object" />
          <MenuButton onClick={() => startCategory('patterns')} color="bg-purple-600" label="🔁 Patterns" />
          <MenuButton onClick={() => startCategory('habits')} color="bg-green-600" label="👍 Good Habits" />
          <MenuButton onClick={() => startCategory('vegetables_fruits')} color="bg-lime-600" label="🥕 Veg & Fruits" />
          <MenuButton onClick={() => startCategory('places_india')} color="bg-cyan-600" label="🏛️ Places India" />
          <MenuButton onClick={() => startCategory('important_people')} color="bg-blue-600" label="👮 Important People" />
          <MenuButton onClick={() => startCategory('temples_gods')} color="bg-yellow-600" label="🛕 Temples & Gods" />
          <MenuButton onClick={() => startCategory('heavy_light')} color="bg-gray-600" label="⚖️ Heavy & Light" />
          <MenuButton onClick={() => startCategory('family')} color="bg-pink-600" label="👨‍👩‍👧‍👦 Family" />
          <MenuButton onClick={() => startCategory('seasons')} color="bg-orange-500" label="🍂 Seasons" />
          <MenuButton onClick={() => startCategory('time_of_day')} color="bg-indigo-400" label="🌅 Time of Day" />
          <MenuButton onClick={() => startCategory('indoor_outdoor')} color="bg-green-400" label="🏠 Indoor/Outdoor" />
          <MenuButton onClick={() => startCategory('loud_quiet')} color="bg-red-400" label="🔊 Loud & Quiet" />
          <MenuButton onClick={() => startCategory('clean_dirty')} color="bg-blue-300" label="🧼 Clean & Dirty" />
          <MenuButton onClick={() => startCategory('healthy_unhealthy')} color="bg-emerald-400" label="🥗 Healthy Food" />
          <MenuButton onClick={() => startCategory('can_fly')} color="bg-sky-400" label="🦅 Can Fly" />
          <MenuButton onClick={() => startCategory('water_land')} color="bg-cyan-400" label="🌊 Water & Land" />
          <MenuButton onClick={() => startCategory('musical_instruments')} color="bg-purple-400" label="🎵 Instruments" />
          <MenuButton onClick={() => startCategory('indian_festivals')} color="bg-yellow-500" label="🎉 Festivals" />
          <MenuButton onClick={() => startCategory('body_movements')} color="bg-pink-400" label="🏃 Movements" />
          <MenuButton onClick={() => startCategory('same_different')} color="bg-violet-400" label="🔀 Same/Different" />
          <MenuButton onClick={() => startCategory('living_nonliving')} color="bg-lime-400" label="🌱 Living Things" />
          <MenuButton onClick={() => startCategory('safe_unsafe')} color="bg-red-300" label="🛡️ Safe & Unsafe" />
          <MenuButton onClick={() => startCategory('first_last')} color="bg-teal-400" label="🔢 First & Last" />
          <MenuButton onClick={() => startCategory('day_night_activities')} color="bg-slate-500" label="🌙 Day/Night" />
          <MenuButton onClick={() => startCategory('indian_traditional')} color="bg-amber-400" label="🇮🇳 Traditional" />
          <MenuButton onClick={() => startCategory('bigger_smaller_number')} color="bg-rose-400" label="🔢 Bigger Number" />
          <MenuButton onClick={() => startCategory('soft_hard')} color="bg-gray-400" label="🛏️ Soft & Hard" />
          <MenuButton onClick={() => startCategory('sweet_sour')} color="bg-yellow-400" label="🍬 Sweet & Sour" />
          <MenuButton onClick={() => startCategory('trace_shape_matching')} color="bg-indigo-300" label="🔷 Shape Match" />
          <MenuButton onClick={() => startCategory('birds')} color="bg-sky-300" label="🦅 Birds" />
          <MenuButton onClick={() => startCategory('more_animals')} color="bg-amber-300" label="🐅 More Animals" />
          <MenuButton onClick={() => startCategory('daily_habits')} color="bg-green-300" label="🌅 Daily Habits" />
          <MenuButton onClick={() => startCategory('utensils_eating')} color="bg-orange-300" label="🍽️ Utensils" />
          <MenuButton onClick={() => startCategory('space')} color="bg-indigo-600" label="🚀 Space & Planets" />
        </div>
      </div>
    );
  }

  // --- SCREEN: LOADING (Generating Questions) ---
  if (isGeneratingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4">
        <div className="relative w-64 h-64 mb-8">
          {/* Dancing emojis with different animations */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-8xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }}>🎉</div>
          <div className="absolute top-8 left-8 text-6xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.7s' }}>🕺</div>
          <div className="absolute top-8 right-8 text-6xl animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.8s' }}>💃</div>
          <div className="absolute bottom-8 left-1/4 text-5xl animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.65s' }}>⭐</div>
          <div className="absolute bottom-8 right-1/4 text-5xl animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.75s' }}>✨</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl animate-pulse">🤖</div>
        </div>
        <h2 className="text-5xl font-black text-purple-700 mb-4 drop-shadow-lg animate-pulse">Creating Magic Questions<span className="inline-block animate-pulse" style={{ animationDelay: '0s' }}>.</span><span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span><span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span></h2>
        <p className="text-2xl text-purple-600 font-semibold animate-pulse">AI is thinking super fast! 🚀</p>
        <div className="mt-8 flex gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  // --- SCREEN: GAME PLAY ---
  if (questionQueue.length === 0) return <div>Loading...</div>; // Safety check

  const currentQ = questionQueue[0];
  const isAudioModule = category === 'math_numbers' || category === 'alphabet' || category === 'simple_addition';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-all duration-500 ${feedback === 'correct' ? 'bg-gradient-to-br from-green-300 via-emerald-200 to-lime-200' : feedback === 'wrong' ? 'bg-gradient-to-br from-red-300 via-rose-200 to-pink-200' : category === 'superhero' ? 'bg-gradient-to-br from-red-100 via-blue-100 to-purple-100' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      
      {/* Top Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 absolute top-4 px-4 z-20">
        <button 
          onClick={resetGame} 
          className="px-5 py-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full font-black text-gray-700 shadow-xl border-b-4 border-gray-600 hover:scale-110 active:scale-95 active:border-b-0 active:translate-y-1 transition-all transform"
        >
          ✕ Exit
        </button>
        <div className="flex gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          {[...Array(WIN_CONDITION)].map((_, i) => (
            <span key={i} className={`text-4xl transition-all transform ${i < score ? 'opacity-100 scale-125 animate-bounce' : 'opacity-20 grayscale'}`} style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
          ))}
        </div>
      </div>

      {/* Hint Button */}
      {!showHint && (
        <button
          onClick={handleShowHint}
          className="absolute top-20 right-4 px-5 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xl rounded-full font-black shadow-xl border-b-4 border-yellow-600 hover:scale-110 active:scale-95 active:border-b-0 active:translate-y-1 transition-all transform z-20"
        >
          💡 Hint
        </button>
      )}

      {/* Hint Display */}
      {showHint && questionQueue.length > 0 && (
        <div className="absolute top-20 right-4 bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-3xl p-5 shadow-2xl z-20 max-w-xs animate-pulse">
          <div className="text-2xl font-black text-yellow-800 mb-2">💡 Hint:</div>
          <div className="text-xl text-yellow-900 font-bold">
            {category === 'find_object' && currentQ.options ? (
              <>Look for: {currentQ.options[currentQ.correct].txt} {currentQ.options[currentQ.correct].icon}</>
            ) : category === 'patterns' ? (
              <>The pattern repeats!</>
            ) : (
              <>Look for: {currentQ[currentQ.correct]?.txt} {currentQ[currentQ.correct]?.icon}</>
            )}
          </div>
        </div>
      )}

      {/* Question Text - Show for trace_shape_matching too */}
      <div className="w-full max-w-3xl text-center mb-4 mt-16">
        {useAIQuestions && (
          <div className="inline-block px-5 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white text-lg font-black rounded-full mb-3 shadow-lg animate-pulse">
            🤖 AI Generated
          </div>
        )}
      </div>
      {category === 'trace_shape_matching' ? (
        <h2 className="text-4xl md:text-5xl font-black mb-4 text-center leading-tight bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent drop-shadow-lg">{currentQ.q}</h2>
      ) : (
        <h2 className="text-5xl md:text-7xl font-black mb-8 text-center leading-tight bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent drop-shadow-lg animate-pulse">{currentQ.q}</h2>
      )}
      
      {/* Special Display for Counting, Math, Alphabet, and Shape Matching */}
      {(currentQ.display || currentQ.outline) && (
        <DisplayContent question={currentQ} isAudioModule={isAudioModule} category={category} />
      )}

      {/* Replay Sound Button for Audio Modules */}
      {(isAudioModule && currentQ.speakText) || (category === 'animals' && currentQ.sound) ? (
        <button
          onClick={handleReplaySound}
          disabled={isSpeaking}
          className="mb-6 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl rounded-full font-black shadow-xl border-b-4 border-blue-700 hover:scale-110 active:scale-95 active:border-b-0 active:translate-y-1 transition-all transform disabled:opacity-50"
        >
          {isSpeaking ? '🔊 Playing...' : category === 'animals' ? '🔊 Hear Sound' : '🔊 Listen Again'}
        </button>
      ) : null}

      {/* Answer Buttons */}
      {category === 'find_object' && currentQ.options ? (
        <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
          {currentQ.options.map((option, index) => (
            <GameButton key={index} option={option} onClick={() => handleAnswer(index)} />
          ))}
        </div>
      ) : category === 'patterns' && currentQ.pattern ? (
        <div className="w-full max-w-3xl">
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl">
            <div className="text-4xl md:text-5xl flex justify-center gap-2 mb-4 flex-wrap">
              {currentQ.pattern.map((item, i) => (
                <span key={i}>{item}</span>
              ))}
              <span className="text-gray-400">?</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <GameButton option={currentQ.options[0]} onClick={() => handleAnswer('a')} />
            <GameButton option={currentQ.options[1]} onClick={() => handleAnswer('b')} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
          <GameButton option={currentQ.a} onClick={() => handleAnswer('a')} />
          <GameButton option={currentQ.b} onClick={() => handleAnswer('b')} />
        </div>
      )}

      {/* Celebration Overlay */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-[150px] animate-bounce drop-shadow-2xl">✨</div>
          <div className="absolute text-[100px] animate-ping" style={{ animationDelay: '0.2s' }}>🎉</div>
          <div className="absolute text-[80px] animate-pulse" style={{ animationDelay: '0.4s' }}>⭐</div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

function DisplayContent({ question, isAudioModule, category }) {
  const [imageError, setImageError] = useState(false);
  const showImage = question.displayImage && !imageError;
  
  // Special display for trace shape matching - show geometric shape outline
  if (category === 'trace_shape_matching' && question.outline) {
    // Map outline emojis to larger geometric shapes
    const shapeMap = {
      '⬜': '▢', // Square
      '⭕': '○', // Circle
      '🔺': '△', // Triangle
      '▭': '▭', // Rectangle
      '⭐': '⭐', // Star
      '❤️': '❤️', // Heart
    };
    
    const displayShape = shapeMap[question.outline] || question.outline;
    
    return (
      <div className="mb-8 mt-16 p-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl border-4 border-blue-300 flex flex-col items-center justify-center">
        <div className="text-9xl md:text-[200px] font-black text-blue-600" style={{ 
          textShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
          fontFamily: 'Arial, sans-serif'
        }}>
          {displayShape}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`text-7xl mb-8 p-6 bg-slate-50 rounded-3xl shadow-inner border-4 border-slate-100 ${isAudioModule ? 'animate-pulse' : ''} flex items-center justify-center`}>
      {showImage ? (
        <img 
          src={question.displayImage} 
          alt="Counting fingers"
          className="w-48 h-48 md:w-64 md:h-64 object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-6xl md:text-8xl font-black">{question.display}</span>
      )}
    </div>
  );
}

function MenuButton({ onClick, color, label }) {
  return (
    <button 
      onClick={onClick} 
      className={`p-6 ${color} rounded-3xl shadow-2xl border-b-8 border-black/30 text-white text-2xl md:text-3xl font-black hover:brightness-110 hover:scale-105 hover:rotate-1 active:border-b-0 active:translate-y-2 active:scale-95 transition-all transform flex items-center justify-center gap-2 relative overflow-hidden group`}
      style={{ 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function GameButton({ option, onClick }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 md:p-10 bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border-b-8 border-blue-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 hover:border-purple-400 hover:-translate-y-2 hover:scale-105 active:border-b-0 active:translate-y-2 active:scale-95 transition-all transform h-64 group relative overflow-hidden"
      style={{ boxShadow: '0 15px 35px rgba(59, 130, 246, 0.3)' }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/20 to-purple-400/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
      {option.imageUrl && !imageError ? (
        <img 
          src={option.imageUrl} 
          alt={option.txt}
          className="w-32 h-32 md:w-40 md:h-40 mb-4 object-cover rounded-2xl drop-shadow-lg transform transition-transform group-hover:scale-125 group-hover:rotate-6 relative z-10"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-8xl md:text-9xl mb-4 drop-shadow-lg transform transition-transform group-hover:scale-125 group-hover:rotate-12 relative z-10">
          {option.icon}
        </span>
      )}
      <span className="text-2xl md:text-4xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-black relative z-10">{option.txt}</span>
    </button>
  );
}
