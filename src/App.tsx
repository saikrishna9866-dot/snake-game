/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Trophy, Gamepad2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  {
    id: 1,
    title: "Neon Dreams",
    artist: "AI Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#00f3ff"
  },
  {
    id: 2,
    title: "Cyber Pulse",
    artist: "Digital Echo",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#ff00ff"
  },
  {
    id: 3,
    title: "Midnight Grid",
    artist: "Vector Flow",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#39ff14"
  }
];

// --- Types ---
type Point = { x: number; y: number };

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood!.x && segment.y === newFood!.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generateFood, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const gameLoop = useCallback((time: number) => {
    if (time - lastUpdateTimeRef.current > GAME_SPEED) {
      moveSnake();
      lastUpdateTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [moveSnake]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((currentTrackIndex + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00f3ff]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff00ff]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-3xl flex items-start justify-between mb-12 z-10 px-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
            <Gamepad2 className="w-7 h-7 text-neon-cyan" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-neon-cyan uppercase italic">Snake Beats</h1>
        </div>
        
        {/* Score Board */}
        <div className="flex gap-10 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-1">Score</span>
            <span className="text-2xl font-mono text-neon-lime font-bold tracking-widest">{score.toString().padStart(4, '0')}</span>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-1">High Score</span>
            <span className="text-2xl font-mono text-neon-magenta font-bold tracking-widest">{highScore.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </div>

      {/* Main Game Window */}
      <div className="relative z-10">
        <div className="relative p-1 rounded-sm bg-neon-cyan/20 border-2 border-neon-cyan shadow-[0_0_30px_rgba(0,243,255,0.2)] overflow-hidden">
          <div 
            className="grid bg-[#0a0a0a]" 
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: 'min(85vw, 520px)',
              height: 'min(85vw, 520px)'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div 
                  key={i} 
                  className="border-[0.5px] border-white/5 flex items-center justify-center"
                >
                  {isSnakeHead && (
                    <motion.div 
                      layoutId="snake-head"
                      className="w-[90%] h-[90%] rounded-[2px] bg-neon-cyan shadow-[0_0_15px_#00f3ff]" 
                    />
                  )}
                  {isSnakeBody && (
                    <div className="w-[85%] h-[85%] rounded-[1px] bg-neon-cyan/30" />
                  )}
                  {isFood && (
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-[70%] h-[70%] rounded-full bg-neon-magenta shadow-[0_0_20px_#ff00ff]" 
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {(isGameOver || isPaused) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                {isGameOver ? (
                  <>
                    <h2 className="text-4xl font-black text-neon-magenta mb-2 tracking-tighter uppercase italic">Game Over</h2>
                    <p className="text-white/60 mb-6 font-mono text-sm">Final Score: {score}</p>
                    <button 
                      onClick={resetGame}
                      className="flex items-center gap-2 px-6 py-3 bg-neon-magenta/20 border border-neon-magenta text-neon-magenta rounded-full hover:bg-neon-magenta hover:text-black transition-all font-bold uppercase tracking-widest text-xs"
                    >
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-neon-cyan mb-6 tracking-tighter uppercase italic">Paused</h2>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="flex items-center gap-2 px-8 py-3 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan rounded-full hover:bg-neon-cyan hover:text-black transition-all font-bold uppercase tracking-widest text-xs"
                    >
                      <Play className="w-4 h-4 fill-current" /> Resume
                    </button>
                    <p className="mt-4 text-[10px] text-white/30 uppercase tracking-widest">Press Space to toggle</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Music Player Bar */}
      <div className="w-full max-w-3xl mt-12 z-10">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          {/* Track Info */}
          <div className="flex items-center gap-5 flex-1 w-full">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden bg-black/40 border border-white/10"
            >
              <Music className="w-8 h-8" style={{ color: currentTrack.color }} />
              {isPlaying && (
                <div className="absolute inset-0 flex items-end justify-center gap-1 pb-3">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 16, 4] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                      className="w-1 rounded-full"
                      style={{ backgroundColor: currentTrack.color }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">Now Playing</span>
              <h3 className="text-xl font-bold tracking-tight text-white mb-0.5">{currentTrack.title}</h3>
              <p className="text-sm text-white/50 font-medium">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={prevTrack}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-white text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </button>
            <button 
              onClick={nextTrack}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
          </div>

          {/* Volume/Meta */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
            <div className="flex items-center gap-3 text-white/30">
              <Volume2 className="w-5 h-5" />
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
                <div className="w-2/3 h-full bg-white/40 group-hover:bg-white/60 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls Info */}
      <div className="mt-10 flex gap-10 text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <span className="px-2 py-1 border border-white/10 bg-white/5 rounded text-[9px]">ARROWS</span>
          </div>
          <span className="opacity-50">Move</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <span className="px-2 py-1 border border-white/10 bg-white/5 rounded text-[9px]">SPACE</span>
          </div>
          <span className="opacity-50">Pause</span>
        </div>
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
      />
    </div>
  );
}
