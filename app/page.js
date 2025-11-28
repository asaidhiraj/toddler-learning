// app/page.js
"use client";
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { learningModules } from './questions';

export default function Home() {
  const [category, setCategory] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' or 'wrong'
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  // --- AUDIO ENGINE (No files needed!) ---
  const playSound = (type) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'correct') {
      // Happy "Ding!"
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'wrong') {
      // Gentle "Buh-buh"
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'win') {
      // Victory Sequence
      const now = audioCtx.currentTime;
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.connect(gn);
        gn.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.start(now + i * 0.1);
        gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
        osc.stop(now + i * 0.1 + 0.5);
      });
    }
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      setTimeout(() => {
        setFeedback(null);
        if (currentQIndex + 1 < learningModules[category].length) {
          setCurrentQIndex(currentQIndex + 1);
        } else {
          setShowReward(true);
          playSound('win');
        }
      }, 1000);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
    }
  };

  const resetGame = () => {
    setCategory(null);
    setCurrentQIndex(0);
    setShowReward(false);
  };

  // --- SCREEN: REWARD ---
  if (showReward) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100 text-center p-4">
        <Confetti width={windowSize.width} height={windowSize.height} />
        <h1 className="text-6xl font-bold text-purple-600 mb-8 animate-bounce">YOU WON! 🎉</h1>
        <div className="text-9xl mb-8">🏆</div>
        <button 
          onClick={resetGame}
          className="px-8 py-4 bg-blue-500 text-white text-2xl rounded-full font-bold shadow-lg hover:bg-blue-600 transition"
        >
          Play Again
        </button>
      </div>
    );
  }

  // --- SCREEN: CATEGORY SELECTION ---
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
        <h1 className="text-4xl font-bold text-blue-800 mb-8">Let's Learn! 🎓</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
          <button onClick={() => setCategory('tall_short')} className="p-6 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-100 border-b-4 border-blue-200">🦒 Tall vs Short</button>
          <button onClick={() => setCategory('big_small')} className="p-6 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-green-100 border-b-4 border-green-200">🐘 Big vs Small</button>
          <button onClick={() => setCategory('fat_thin')} className="p-6 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-orange-100 border-b-4 border-orange-200">🐡 Fat vs Thin</button>
          <button onClick={() => setCategory('more_less')} className="p-6 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-purple-100 border-b-4 border-purple-200">🍪 More vs Less</button>
          <button onClick={() => setCategory('counting')} className="p-6 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-red-100 border-b-4 border-red-200">🍎 Counting</button>
        </div>
      </div>
    );
  }

  // --- SCREEN: GAME QUESTION ---
  const currentQ = learningModules[category][currentQIndex];

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 ${feedback === 'correct' ? 'bg-green-100' : feedback === 'wrong' ? 'bg-red-100' : 'bg-slate-50'}`}>
      
      {/* Back Button */}
      <button onClick={resetGame} className="absolute top-4 left-4 text-gray-500 text-lg font-bold">← Home</button>

      {/* Progress Bar */}
      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-8">
        <div className="bg-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${((currentQIndex) / learningModules[category].length) * 100}%` }}></div>
      </div>

      {/* Question */}
      <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-8 text-center">{currentQ.question}</h2>
      
      {/* Extra Display for Counting (if exists) */}
      {currentQ.display && (
        <div className="text-6xl mb-8 p-4 bg-white rounded-2xl shadow-sm border-2 border-gray-100">
          {currentQ.display}
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
        {currentQ.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleAnswer(opt.isCorrect)}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border-b-8 border-gray-200 hover:border-blue-300 hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all"
          >
            <span className="text-8xl md:text-9xl mb-4 transform hover:scale-110 transition-transform">{opt.label}</span>
            <span className="text-xl md:text-2xl text-gray-500 font-bold">{opt.text}</span>
          </button>
        ))}
      </div>
      
      {/* Feedback Message */}
      {feedback === 'correct' && <div className="absolute top-1/2 text-9xl animate-ping">✨</div>}
    </div>
  );
}
