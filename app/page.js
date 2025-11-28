// app/page.js
"use client";
import { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { learningModules } from './questions';

// Helper to shuffle questions so it's always different
const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
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

  // Auto-speak when question changes for math/alphabet modules
  useEffect(() => {
    if (questionQueue.length > 0 && category) {
      const currentQ = questionQueue[0];
      if (currentQ.speakText && (category === 'math_numbers' || category === 'alphabet')) {
        const timer = setTimeout(() => {
          speakText(currentQ.speakText);
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

  // --- AUDIO ENGINE ---
  const playSound = (type) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    }
  };

  const startCategory = (catKey) => {
    // Shuffle the questions for this category
    const questions = shuffleArray(learningModules[catKey]);
    setQuestionQueue(questions);
    setCategory(catKey);
    setScore(0);
    setShowReward(false);
  };

  const handleAnswer = (choice) => {
    const currentQ = questionQueue[0];
    const isCorrect = choice === currentQ.correct;

    if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      setTimeout(() => {
        setFeedback(null);
        if (newScore >= WIN_CONDITION) {
          setShowReward(true);
          playSound('win');
        } else {
          // Remove current question and move to next
          setQuestionQueue(prev => prev.slice(1));
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
      }
    }
  };

  // --- SCREEN: REWARD ---
  if (showReward) {
    const rewardEmoji = category === 'superhero' ? '🦸' : category === 'math_numbers' ? '🔢' : category === 'alphabet' ? '📚' : '🏆';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-300 text-center p-4">
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={500} recycle={false} />
        <div className="text-9xl mb-4 animate-bounce">{rewardEmoji}</div>
        <h1 className="text-6xl font-black text-purple-700 mb-8 drop-shadow-md">YOU DID IT!</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => startCategory(category)}
            className="px-8 py-4 bg-purple-600 text-white text-2xl rounded-full font-bold shadow-xl border-b-8 border-purple-800 active:border-b-0 active:translate-y-2 transition-all"
          >
            Play Again 🔄
          </button>
          <button 
            onClick={resetGame}
            className="px-8 py-4 bg-blue-500 text-white text-2xl rounded-full font-bold shadow-xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all"
          >
            New Game 🏠
          </button>
        </div>
      </div>
    );
  }

  // --- SCREEN: CATEGORY SELECTION ---
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-purple-100 to-pink-100 p-4">
        <h1 className="text-5xl font-black text-sky-800 mb-8 tracking-tight">Let's Play! 🚀</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
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
        </div>
      </div>
    );
  }

  // --- SCREEN: GAME PLAY ---
  if (questionQueue.length === 0) return <div>Loading...</div>; // Safety check

  const currentQ = questionQueue[0];
  const isAudioModule = category === 'math_numbers' || category === 'alphabet';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 ${feedback === 'correct' ? 'bg-green-200' : feedback === 'wrong' ? 'bg-red-200' : category === 'superhero' ? 'bg-gradient-to-br from-red-50 to-blue-50' : 'bg-white'}`}>
      
      {/* Top Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 absolute top-4 px-4">
        <button onClick={resetGame} className="px-4 py-2 bg-gray-200 rounded-full font-bold text-gray-600">✕ Exit</button>
        <div className="flex gap-1">
          {[...Array(WIN_CONDITION)].map((_, i) => (
            <span key={i} className={`text-3xl transition-all ${i < score ? 'opacity-100 scale-125' : 'opacity-20 grayscale'}`}>⭐</span>
          ))}
        </div>
      </div>

      {/* Question Text */}
      <h2 className="text-4xl md:text-6xl font-black text-slate-800 mb-8 text-center leading-tight mt-12">{currentQ.q}</h2>
      
      {/* Special Display for Counting, Math, and Alphabet */}
      {currentQ.display && (
        <div className={`text-7xl mb-8 p-6 bg-slate-50 rounded-3xl shadow-inner border-4 border-slate-100 ${isAudioModule ? 'animate-pulse' : ''}`}>
          {currentQ.display}
        </div>
      )}

      {/* Replay Sound Button for Audio Modules */}
      {isAudioModule && currentQ.speakText && (
        <button
          onClick={handleReplaySound}
          disabled={isSpeaking}
          className="mb-6 px-6 py-3 bg-blue-500 text-white text-xl rounded-full font-bold shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
        >
          {isSpeaking ? '🔊 Speaking...' : '🔊 Listen Again'}
        </button>
      )}

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
        <GameButton option={currentQ.a} onClick={() => handleAnswer('a')} />
        <GameButton option={currentQ.b} onClick={() => handleAnswer('b')} />
      </div>

      {/* Celebration Overlay */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
           <div className="text-[150px] animate-bounce drop-shadow-2xl">✨</div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

function MenuButton({ onClick, color, label }) {
  return (
    <button 
      onClick={onClick} 
      className={`p-6 ${color} rounded-2xl shadow-lg border-b-8 border-black/20 text-white text-2xl md:text-3xl font-black hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2`}
    >
      {label}
    </button>
  );
}

function GameButton({ option, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 md:p-10 bg-white rounded-3xl shadow-xl border-b-8 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:-translate-y-1 active:border-b-0 active:translate-y-2 transition-all h-64"
    >
      <span className="text-8xl md:text-9xl mb-4 drop-shadow-sm transform transition-transform hover:scale-110">{option.icon}</span>
      <span className="text-2xl md:text-4xl text-slate-600 font-bold">{option.txt}</span>
    </button>
  );
}
