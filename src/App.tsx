import React, { useState, useEffect, useRef } from 'react';
import { SVGS } from './SVGs';
import { playSound } from './audio';
import { getMapForLevel, generateWordMap } from './gameData';
import { Difficulty, ScreenState, GameMode, GameStatus, Command, MapData, RobotState, AlienState, LetterState } from './types';
import { Settings, Play, PenTool, Car, XCircle, RotateCcw, Trash2, Check, ArrowLeft } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('makkelijk');
  const [gameMode, setGameMode] = useState<GameMode>('mars');
  const [wordListStr, setWordListStr] = useState<string>(() => {
    const saved = localStorage.getItem('mars_words');
    return saved ? JSON.parse(saved).join(', ') : 'APPEL, BOOM, HUIS, AUTO, ZON';
  });

  const [showGhost, setShowGhost] = useState(() => localStorage.getItem('showGhost') === 'true');
  const toggleGhost = (val: boolean) => {
      setShowGhost(val);
      localStorage.setItem('showGhost', String(val));
  };

  const [level, setLevel] = useState(1);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [targetWord, setTargetWord] = useState<string>('');
  
  const [robot, setRobot] = useState<RobotState>({x:0, y:0, dir:0});
  const [aliens, setAliens] = useState<AlienState[]>([]);
  const [letters, setLetters] = useState<LetterState[]>([]);
  
  const [commands, setCommands] = useState<Command[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionIndex, setExecutionIndex] = useState(0);
  const [gameState, setGameState] = useState<GameStatus>('idle');
  const [checkpoint, setCheckpoint] = useState<{robot: RobotState, aliens: AlienState[], letters: LetterState[]} | null>(null);

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customMap, setCustomMap] = useState<MapData | null>(null);
  const [builderTool, setBuilderTool] = useState<'obstacle'|'target'|'alien-h'|'alien-v'|'erase'>('obstacle');

  const stateRef = useRef({ robot, aliens, letters, commands, executionIndex, gameState, currentMap, gameMode, targetWord });
  useEffect(() => {
    stateRef.current = { robot, aliens, letters, commands, executionIndex, gameState, currentMap, gameMode, targetWord };
  }, [robot, aliens, letters, commands, executionIndex, gameState, currentMap, gameMode, targetWord]);

  useEffect(() => {
    const words = wordListStr.split(',').map(w => w.trim()).filter(w => w);
    localStorage.setItem('mars_words', JSON.stringify(words));
  }, [wordListStr]);

  // -- GAME ENGINE --
  useEffect(() => {
    if (!isExecuting) return;
    const interval = setInterval(() => {
      const st = stateRef.current;
      if (st.gameState === 'won' || st.gameState.startsWith('lost')) return;
      if (!st.currentMap) return;

      const nextAliens = st.aliens.map(a => {
        let na = { ...a, prevX: a.x, prevY: a.y };
        if (na.axis === 'x') {
            if (na.x + na.dir > na.max || na.x + na.dir < na.min) na.dir *= -1;
            na.x += na.dir;
        } else {
            if (na.y + na.dir > na.max || na.y + na.dir < na.min) na.dir *= -1;
            na.y += na.dir;
        }
        return na;
      });
      setAliens(nextAliens);

      let nx = st.robot.x;
      let ny = st.robot.y;
      let ndir = st.robot.dir;
      let nGameState = st.gameState;

      if (st.executionIndex >= st.commands.length) {
          if (st.gameMode === 'mars') {
            if (st.currentMap.target && nx === st.currentMap.target.x && ny === st.currentMap.target.y) {
                nGameState = 'won'; playSound('win');
            } else {
                nGameState = 'lost_incomplete'; playSound('lose');
            }
          } else {
            nGameState = 'lost_incomplete'; playSound('lose');
          }
          setIsExecuting(false);
          setGameState(nGameState);
          return;
      }

      const cmd = st.commands[st.executionIndex];
      if (cmd === 'LEFT') { ndir = ndir - 1; playSound('turn'); }
      else if (cmd === 'RIGHT') { ndir = ndir + 1; playSound('turn'); }
      else if (cmd === 'WAIT') { playSound('move'); /* Wait in place */ }
      else if (cmd === 'FORWARD') {
          playSound('move');
          const normDir = ((ndir % 4) + 4) % 4;
          if (normDir === 0) ny -= 1;
          if (normDir === 1) nx += 1;
          if (normDir === 2) ny += 1;
          if (normDir === 3) nx -= 1;
      }

      if (cmd === 'FORWARD') {
          if (nx < 0 || nx >= st.currentMap.size || ny < 0 || ny >= st.currentMap.size) {
              setRobot({x: nx, y: ny, dir: ndir}); setGameState('lost_bounds'); playSound('lose'); setIsExecuting(false); return;
          }
          if (st.currentMap.obstacles.some(o => o.x === nx && o.y === ny)) {
              setRobot({x: nx, y: ny, dir: ndir}); setGameState('lost_crash'); playSound('lose'); setIsExecuting(false); return;
          }
      }

      const hitAlien = nextAliens.some(a => 
          (a.x === nx && a.y === ny) || 
          (a.x === st.robot.x && a.y === st.robot.y && a.prevX === nx && a.prevY === ny)
      );
      if (hitAlien) {
          setRobot({x: nx, y: ny, dir: ndir}); setGameState('lost_alien'); playSound('lose'); setIsExecuting(false); return;
      }

      let nextLetters = [...st.letters];
      let phaseWon = false;
      if (st.gameMode === 'auto' && (nx !== st.robot.x || ny !== st.robot.y)) {
         const collectedCount = nextLetters.filter(l => l.collected).length;
         const letterHereIdx = nextLetters.findIndex(l => l.x === nx && l.y === ny && !l.collected);
         if (letterHereIdx !== -1) {
            if (nextLetters[letterHereIdx].char === st.targetWord[collectedCount]) {
               nextLetters[letterHereIdx] = { ...nextLetters[letterHereIdx], collected: true };
               playSound('click');
               phaseWon = true;
            }
         }
      }

      setRobot({x: nx, y: ny, dir: ndir});
      setLetters(nextLetters);
      
      if (phaseWon) {
          const newCollectedCount = nextLetters.filter(l => l.collected).length;
          if (newCollectedCount === st.targetWord.length) {
              setGameState('won'); playSound('win');
              setIsExecuting(false);
          } else {
              setGameState('idle');
              setIsExecuting(false);
              setCommands([]);
              setExecutionIndex(0);
              setCheckpoint({
                  robot: {x: nx, y: ny, dir: ndir},
                  aliens: JSON.parse(JSON.stringify(nextAliens)),
                  letters: JSON.parse(JSON.stringify(nextLetters))
              });
              playSound('win');
          }
          return;
      }

      setExecutionIndex(idx => idx + 1);

    }, 600);
    return () => clearInterval(interval);
  }, [isExecuting]);

  // -- LOGIC --
  const showScreen = (s: ScreenState) => {
    playSound('click');
    setScreen(s);
  };

  const startLevel = (lvl: number, mode: GameMode, cMap?: MapData) => {
    playSound('click');
    setGameMode(mode);
    setIsCustomMode(!!cMap);
    setLevel(lvl);
    
    let mapData: MapData;
    let word = '';
    if (cMap) {
      mapData = JSON.parse(JSON.stringify(cMap));
    } else {
      if (mode === 'mars') {
        mapData = getMapForLevel(lvl, difficulty);
      } else {
        const words = wordListStr.split(',').map(w => w.trim()).filter(w => w);
        word = words.length > 0 ? words[Math.floor(Math.random() * words.length)].toUpperCase() : 'AUTO';
        mapData = generateWordMap(word, difficulty, lvl);
      }
    }

    setCurrentMap(mapData);
    setTargetWord(word);
    const initRobot = {...mapData.start};
    const initAliens = mapData.aliens ? JSON.parse(JSON.stringify(mapData.aliens)) : [];
    const initLetters = mapData.letters ? JSON.parse(JSON.stringify(mapData.letters)) : [];
    
    setRobot(initRobot);
    setAliens(initAliens);
    setLetters(initLetters);
    setCheckpoint({ robot: initRobot, aliens: initAliens, letters: initLetters });
    setCommands([]);
    setGameState('idle');
    setExecutionIndex(0);
    setIsExecuting(false);
    setScreen('game');
  };

  const openBuilder = () => {
    playSound('click');
    let size = difficulty === 'makkelijk' ? 5 : difficulty === 'gemiddeld' ? 7 : 9;
    setCustomMap({
        size: size,
        start: {x: 0, y: size - 1, dir: 0},
        target: {x: size - 1, y: 0},
        obstacles: [],
        aliens: []
    });
    setBuilderTool('obstacle');
    showScreen('builder');
  };

  // ... renders
  return (
    <div className="w-full h-full relative font-sans">
      {screen === 'start' && <StartScreen onStartMars={() => startLevel(1, 'mars')} onStartAuto={() => startLevel(1, 'auto')} onSettings={() => showScreen('settings')} />}
      {screen === 'settings' && <SettingsScreen diff={difficulty} setDiff={setDifficulty} wordListStr={wordListStr} setWordListStr={setWordListStr} showGhost={showGhost} toggleGhost={toggleGhost} onBack={() => showScreen('start')} onBuilder={openBuilder} />}
      {screen === 'builder' && <BuilderScreen customMap={customMap!} setCustomMap={setCustomMap} tool={builderTool} setTool={setBuilderTool} onBack={() => showScreen('settings')} onPlay={() => startLevel(1, 'mars', customMap!)} />}
      {screen === 'game' && <GameScreen 
          mapData={currentMap!} robot={robot} aliens={aliens} letters={letters} 
          commands={commands} isExecuting={isExecuting} executionIndex={executionIndex} gameState={gameState}
          gameMode={gameMode} targetWord={targetWord} level={level} isCustomMode={isCustomMode} diff={difficulty}
          showGhost={showGhost}
          onAddCommand={c => { if(!isExecuting) { playSound('click'); setCommands([...commands, c]); } }}
          onRemoveCommand={i => { if(!isExecuting) { playSound('click'); setCommands(commands.filter((_,idx)=>idx!==i)); } }}
          onPlay={() => { if(!isExecuting && commands.length > 0) { playSound('start'); setRobot(JSON.parse(JSON.stringify(checkpoint!.robot))); setAliens(JSON.parse(JSON.stringify(checkpoint!.aliens))); setLetters(JSON.parse(JSON.stringify(checkpoint!.letters))); setExecutionIndex(0); setGameState('running'); setIsExecuting(true); } }}
          onStop={() => { playSound('click'); setIsExecuting(false); setGameState('idle'); setRobot(JSON.parse(JSON.stringify(checkpoint!.robot))); setAliens(JSON.parse(JSON.stringify(checkpoint!.aliens))); setLetters(JSON.parse(JSON.stringify(checkpoint!.letters))); setExecutionIndex(0); }}
          onClear={() => { if(!isExecuting) { playSound('click'); setCommands([]); setGameState('idle'); setRobot(JSON.parse(JSON.stringify(checkpoint!.robot))); setAliens(JSON.parse(JSON.stringify(checkpoint!.aliens))); setLetters(JSON.parse(JSON.stringify(checkpoint!.letters))); setExecutionIndex(0); } }}
          onNext={() => startLevel(level+1, gameMode)}
          onRetry={() => { playSound('click'); setGameState('idle'); setRobot(JSON.parse(JSON.stringify(checkpoint!.robot))); setAliens(JSON.parse(JSON.stringify(checkpoint!.aliens))); setLetters(JSON.parse(JSON.stringify(checkpoint!.letters))); setExecutionIndex(0); }}
          onBack={() => showScreen('start')}
          onRebuild={() => showScreen('builder')}
      />}
    </div>
  );
}

// ---- SCREENS ----

function StartScreen({onStartMars, onStartAuto, onSettings}:any) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="relative flex justify-center items-center w-full max-w-[300px] md:max-w-[400px] aspect-[4/3] cloud-float mx-auto mb-8">
            <svg className="absolute inset-0 w-full h-full drop-shadow-2xl" viewBox="0 0 200 150">
                <defs>
                    <filter id="yellow-outline">
                        <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="5"></feMorphology>
                        <feFlood floodColor="#f59e0b" floodOpacity="1" result="YELLOW"></feFlood>
                        <feComposite in="YELLOW" in2="DILATED" operator="in" result="OUTLINE"></feComposite>
                        <feMerge><feMergeNode in="OUTLINE" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <g filter="url(#yellow-outline)" fill="#ffffff">
                    <circle cx="60" cy="75" r="35" /><circle cx="100" cy="50" r="45" /><circle cx="145" cy="70" r="40" />
                    <rect x="60" y="55" width="85" height="55" rx="5" />
                </g>
            </svg>
            <h1 className="relative z-10 text-3xl md:text-5xl font-bold text-[#201d4c] text-center leading-[1.1] pt-4">Mars Missie<br/>& Auto</h1>
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-sm z-10">
            <button onClick={onStartMars} className="bg-green-500 border-[4px] border-[#201d4c] text-white text-xl py-3 rounded-2xl shadow-[0_6px_0_#201d4c] active:shadow-[0_0px_0_#201d4c] active:translate-y-1.5 transition-all font-bold flex justify-center items-center gap-2">
                <Play fill="currentColor" size={24}/> Start Mars Missie
            </button>
            <button onClick={onStartAuto} className="bg-sky-400 border-[4px] border-[#201d4c] text-white text-xl py-3 rounded-2xl shadow-[0_6px_0_#201d4c] active:shadow-[0_0px_0_#201d4c] active:translate-y-1.5 transition-all font-bold flex justify-center items-center gap-2">
                <Car fill="currentColor" size={24}/> Start Auto Missie
            </button>
            <button onClick={onSettings} className="bg-amber-400 border-[4px] border-[#201d4c] text-[#201d4c] text-xl py-3 rounded-2xl shadow-[0_6px_0_#201d4c] active:shadow-[0_0px_0_#201d4c] active:translate-y-1.5 transition-all font-bold flex justify-center items-center gap-2">
                <Settings size={24}/> Instellingen
            </button>
        </div>
    </div>
  );
}

function SettingsScreen({diff, setDiff, wordListStr, setWordListStr, showGhost, toggleGhost, onBack, onBuilder}:any) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-sm border-[5px] border-[#201d4c] rounded-[2rem] p-6 max-w-md w-full shadow-2xl my-auto">
        <h2 className="text-2xl font-bold mb-4 text-center text-[#201d4c]">Instellingen</h2>
        
        <div className="flex flex-col gap-3 mb-6">
          <label className="font-bold text-sm text-[#201d4c] uppercase tracking-wider">Moeilijkheidsgraad</label>
          {(['makkelijk', 'gemiddeld', 'moeilijk'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDiff(d)} className={`border-[3px] border-[#201d4c] text-lg py-2 px-4 rounded-xl font-bold flex justify-between items-center transition-all ${diff === d ? 'ring-[4px] ring-[#201d4c] scale-105 border-white ' + (d==='makkelijk'?'bg-green-400':d==='gemiddeld'?'bg-amber-400':'bg-red-400') : 'bg-gray-100 opacity-80'}`}>
              {d.charAt(0).toUpperCase() + d.slice(1)} {diff === d && <Check size={20} strokeWidth={4}/>}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className="font-bold text-sm text-[#201d4c] uppercase tracking-wider">Woordenlijst (Auto Missie)</label>
          <p className="text-xs opacity-70 leading-tight">Voer woorden in gescheiden door een komma. De Auto zal de letters moeten ophalen in de juiste volgorde!</p>
          <textarea 
            value={wordListStr} onChange={e => setWordListStr(e.target.value)}
            className="w-full h-24 p-3 border-[3px] border-[#201d4c] rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-4 focus:ring-amber-300"
            placeholder="KAT, BOOM, APPEL"
          />
        </div>

        <div className="flex flex-col gap-2 mb-6">
            <label className="font-bold text-sm text-[#201d4c] uppercase tracking-wider">Hulp</label>
            <label className="flex items-center justify-between p-3 border-[3px] border-[#201d4c] rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
               <div className="flex flex-col">
                  <span className="font-bold text-[#201d4c]">Spook-auto tonen</span>
                  <span className="text-[10px] opacity-70">Toont een half doorzichtige wagen op de eindbestemming</span>
               </div>
               <div className={`w-12 h-6 rounded-full border-[2px] border-[#201d4c] p-0.5 transition-colors ${showGhost ? 'bg-green-400' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white border border-[#201d4c] rounded-full transition-transform ${showGhost ? 'translate-x-6' : 'translate-x-0'}`}></div>
               </div>
               <input type="checkbox" checked={showGhost} onChange={e => toggleGhost(e.target.checked)} className="hidden"/>
            </label>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onBuilder} className="bg-blue-400 border-[3px] border-[#201d4c] text-white text-lg py-3 rounded-xl shadow-[0_4px_0_#201d4c] active:shadow-none active:translate-y-1 transition-all font-bold flex justify-center items-center gap-2">
            <PenTool size={20}/> Map Maker
          </button>
          <button onClick={onBack} className="bg-gray-200 border-[3px] border-[#201d4c] text-[#201d4c] text-lg py-3 rounded-xl shadow-[0_4px_0_#201d4c] active:shadow-none active:translate-y-1 transition-all font-bold flex justify-center items-center gap-2">
            Terug
          </button>
        </div>
      </div>
    </div>
  );
}

function BuilderScreen({customMap, setCustomMap, tool, setTool, onBack, onPlay}:any) {
  const size = customMap.size;
  const gridClick = (x:number, y:number) => {
    playSound('click');
    if (x === customMap.start.x && y === customMap.start.y) return;
    let nmap = {...customMap};
    nmap.obstacles = nmap.obstacles.filter((o:any) => !(o.x === x && o.y === y));
    nmap.aliens = nmap.aliens.filter((a:any) => !(a.x === x && a.y === y));
    if (tool === 'target') nmap.target = {x, y};
    else if (tool === 'obstacle') {
      if (!(nmap.target.x === x && nmap.target.y === y)) nmap.obstacles.push({x, y});
    } else if (tool === 'alien-h') {
      if (!(nmap.target.x === x && nmap.target.y === y)) nmap.aliens.push({x, y, axis: 'x', min: 0, max: size - 1, dir: 1});
    } else if (tool === 'alien-v') {
      if (!(nmap.target.x === x && nmap.target.y === y)) nmap.aliens.push({x, y, axis: 'y', min: 0, max: size - 1, dir: 1});
    }
    setCustomMap(nmap);
  };

  return (
    <div className="w-full h-full flex flex-col p-2 gap-2 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white/70 border-[3px] border-[#201d4c] rounded-xl p-2">
        <button onClick={onBack} className="p-2 bg-amber-400 border-[3px] border-[#201d4c] rounded-lg shadow-[0_3px_0_#201d4c] active:shadow-none active:translate-y-1"><ArrowLeft size={20}/></button>
        <div className="text-center"><h2 className="text-xl font-extrabold text-[#201d4c]">Map Maker</h2></div>
        <button onClick={onPlay} className="p-2 bg-green-500 border-[3px] border-[#201d4c] text-white rounded-lg shadow-[0_3px_0_#201d4c] active:shadow-none active:translate-y-1 flex gap-1 font-bold"><Play fill="currentColor" size={20}/></button>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 items-center justify-center bg-[#a8dded] rounded-3xl border-[4px] border-[#201d4c]/10 p-2 shadow-inner">
        <div className="grid-wrapper bg-[#c46f4d] border-[6px] border-[#201d4c] rounded-2xl relative shadow-xl shrink-0" style={{maxWidth: '550px', maxHeight: '550px'}}>
          <div className="absolute inset-0 grid" style={{gridTemplateColumns:`repeat(${size}, 1fr)`, gridTemplateRows:`repeat(${size}, 1fr)`}}>
            {Array.from({length: size*size}).map((_, i) => {
              const x = i%size; const y = Math.floor(i/size);
              const isTarget = customMap.target.x === x && customMap.target.y === y;
              const isObstacle = customMap.obstacles.some((o:any) => o.x === x && o.y === y);
              const hasAlien = customMap.aliens.find((a:any) => a.x === x && a.y === y);
              const obstacleSvg = (x * 7 + y * 3) % 2 === 0 ? SVGS.obstacle : SVGS.crater;
              return (
                <div key={i} onClick={() => gridClick(x,y)} className="border border-[#201d4c]/10 relative flex items-center justify-center cursor-pointer hover:bg-white/30">
                  {isTarget && <div className="w-[80%] h-[80%] absolute pointer-events-none">{SVGS.target}</div>}
                  {isObstacle && <div className="w-[85%] h-[85%] absolute pointer-events-none">{obstacleSvg}</div>}
                  {hasAlien && <div className="w-[85%] h-[85%] absolute font-extrabold text-xl text-white flex items-center justify-center">{SVGS.alien}</div>}
                  {hasAlien && <span className="absolute z-20 text-white font-extrabold" style={{textShadow:'0 0 4px #000'}}>{hasAlien.axis==='x'?'↔':'↕'}</span>}
                </div>
              );
            })}
          </div>
          <div className="absolute z-10 flex items-center justify-center pointer-events-none" style={{width:`${100/size}%`, height:`${100/size}%`, left:`${customMap.start.x*(100/size)}%`, top:`${customMap.start.y*(100/size)}%`}}>
             <div className="w-[85%] h-[85%]">{SVGS.rover}</div>
          </div>
        </div>

        <div className="bg-white/70 border-[4px] border-[#201d4c] rounded-2xl p-4 w-full md:w-64 shrink-0 grid grid-cols-2 gap-2">
            <ToolBtn id="obstacle" t={tool} onClick={()=>setTool('obstacle')} svg={SVGS.obstacle} name="Rots" />
            <ToolBtn id="target" t={tool} onClick={()=>setTool('target')} svg={SVGS.target} name="Finish" />
            <ToolBtn id="alien-h" t={tool} onClick={()=>setTool('alien-h')} svg={SVGS.alien} name="Alien ↔" label="↔" />
            <ToolBtn id="alien-v" t={tool} onClick={()=>setTool('alien-v')} svg={SVGS.alien} name="Alien ↕" label="↕" />
            <button onClick={()=>setTool('erase')} className={`col-span-2 p-2 rounded-xl font-bold border-[3px] border-[#201d4c] transition-all flex flex-col items-center gap-1 ${tool==='erase'?'bg-amber-300 ring-[4px] ring-[#201d4c]':'bg-red-100 text-red-600'}`}>
              <Trash2 size={24}/> <span className="text-xs">Wis Vakje</span>
            </button>
        </div>
      </div>
    </div>
  );
}
function ToolBtn({id, t, onClick, svg, name, label}:any) {
  return (
    <button onClick={onClick} className={`p-2 rounded-xl font-bold border-[3px] border-[#201d4c] transition-all flex flex-col items-center gap-1 ${t===id?'bg-amber-300 ring-[4px] ring-[#201d4c]':'bg-white'}`}>
      <div className="w-8 h-8 relative flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0">{svg}</div>
        {label && <span className="absolute z-10 text-white" style={{textShadow:'0 0 4px #000'}}>{label}</span>}
      </div>
      <span className="text-[10px]">{name}</span>
    </button>
  );
}

function GameScreen({mapData, robot, aliens, letters, commands, isExecuting, executionIndex, gameState, gameMode, targetWord, level, diff, isCustomMode, showGhost, onAddCommand, onRemoveCommand, onPlay, onStop, onClear, onNext, onRetry, onBack, onRebuild}:any) {
  
  const size = mapData.size;
  const collectedCount = letters.filter((l:LetterState) => l.collected).length;

  let ghostRobot = null;
  const showGhostFeature = showGhost && !isExecuting && commands.length > 0;
  if (showGhostFeature) {
      ghostRobot = { ...robot };
      for (const cmd of commands) {
          if (cmd === 'LEFT') ghostRobot.dir -= 1;
          else if (cmd === 'RIGHT') ghostRobot.dir += 1;
          else if (cmd === 'FORWARD') {
              const normDir = ((ghostRobot.dir % 4) + 4) % 4;
              const dx = normDir === 1 ? 1 : normDir === 3 ? -1 : 0;
              const dy = normDir === 2 ? 1 : normDir === 0 ? -1 : 0;
              const nx = ghostRobot.x + dx;
              const ny = ghostRobot.y + dy;
              
              if (nx >= 0 && nx < size && ny >= 0 && ny < size && !mapData.obstacles.some((o:any) => o.x === nx && o.y === ny)) {
                  ghostRobot.x = nx;
                  ghostRobot.y = ny;
              }
          }
      }
  }

  return (
    <div className="w-full h-full flex flex-col p-2 gap-2 max-w-5xl mx-auto">
      <div className="shrink-0 flex items-center justify-between bg-white/70 border-[3px] border-[#201d4c] rounded-xl p-2 shadow-sm relative">
        <button onClick={onBack} className="p-2 bg-amber-400 border-[3px] border-[#201d4c] rounded-lg shadow-[0_3px_0_#201d4c] active:translate-y-1"><ArrowLeft size={20}/></button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h2 className="text-xl font-extrabold text-[#201d4c] leading-none mb-1">{isCustomMode?'Eigen Map':gameMode==='mars'?`Missie ${level}`:`Woorden Auto`}</h2>
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{isCustomMode?'MAATWERK':diff}</span>
        </div>
        <div className="opacity-0 pointer-events-none">Placeholder</div>
      </div>

      {gameMode === 'auto' && (
        <div className="shrink-0 bg-white border-[3px] border-[#201d4c] rounded-xl p-2 md:p-3 flex flex-col md:flex-row items-center justify-center gap-3 shadow-md z-1">
           <span className="text-sm md:text-base font-bold uppercase text-amber-500">Doelwoord:</span>
           <div className="flex flex-wrap justify-center gap-1 md:gap-2">
             {targetWord.split('').map((char:string, i:number) => (
               <div key={i} className={`w-8 h-8 md:w-12 md:h-12 rounded-lg border-[3px] md:border-[4px] border-[#201d4c] flex items-center justify-center font-extrabold text-xl md:text-3xl transition-all ${i < collectedCount ? 'bg-green-400 text-white scale-110 shadow-lg shadow-green-500/50' : 'bg-[#e2e8f0] text-[#64748b] opacity-80'}`}>
                 {char}
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        <div className="flex-1 min-h-0 flex items-center justify-center relative bg-[#a8dded] rounded-3xl border-[4px] border-[#201d4c]/10 p-2 shadow-inner">
          <div className="grid-wrapper bg-[#c46f4d] border-[6px] border-[#201d4c] rounded-3xl relative shadow-xl overflow-hidden" style={{maxWidth: '600px', maxHeight: '600px'}}>
            <div className="absolute inset-0 grid" style={{gridTemplateColumns:`repeat(${size},1fr)`, gridTemplateRows:`repeat(${size},1fr)`}}>
              {Array.from({length: size*size}).map((_, i) => {
                const x = i%size; const y = Math.floor(i/size);
                const isTarget = gameMode==='mars' && mapData.target && mapData.target.x === x && mapData.target.y === y;
                const isObstacle = mapData.obstacles.some((o:any) => o.x === x && o.y === y);
                const obstacleSvg = (x * 7 + y * 3) % 2 === 0 ? SVGS.obstacle : SVGS.crater;
                return (
                  <div key={i} className="border border-[#201d4c]/10 relative flex items-center justify-center">
                    {isTarget && <div className="w-[80%] h-[80%] absolute">{SVGS.target}</div>}
                    {isObstacle && <div className="w-[85%] h-[85%] absolute">{obstacleSvg}</div>}
                  </div>
                );
              })}
            </div>
            
            {letters.map((l:any, i:number) => !l.collected && (
               <div key={`letter-${i}`} className="absolute flex items-center justify-center transition-all duration-300" style={{width:`${100/size}%`, height:`${100/size}%`, left:`${l.x*(100/size)}%`, top:`${l.y*(100/size)}%`}}>
                  <div className="w-[70%] h-[70%] bg-white border-[3px] border-[#201d4c] rounded-md flex items-center justify-center text-xl md:text-2xl font-extrabold text-[#201d4c] shadow-sm transform rotate-[-5deg]">{l.char}</div>
               </div>
            ))}

            {aliens.map((a:any, i:number) => (
                <div key={`alien-${i}`} className="absolute flex items-center justify-center transition-all duration-500 z-10" style={{width:`${100/size}%`, height:`${100/size}%`, left:`${a.x*(100/size)}%`, top:`${a.y*(100/size)}%`}}>
                   <div className="w-[85%] h-[85%] animate-pulse">{SVGS.alien}</div>
                </div>
            ))}

            <div className="absolute z-20 flex items-center justify-center transition-all duration-500 ease-in-out" style={{width:`${100/size}%`, height:`${100/size}%`, left:`${robot.x*(100/size)}%`, top:`${robot.y*(100/size)}%`}}>
                <div className="w-[85%] h-[85%] transition-transform duration-500" style={{transform: `rotate(${robot.dir*90}deg)`}}>{gameMode === 'mars' ? SVGS.rover : SVGS.car}</div>
            </div>

            {ghostRobot && (
                <div className="absolute z-10 flex items-center justify-center pointer-events-none opacity-40 grayscale" style={{width:`${100/size}%`, height:`${100/size}%`, left:`${ghostRobot.x*(100/size)}%`, top:`${ghostRobot.y*(100/size)}%`, transition: 'all 0.3s ease'}}>
                   <div className="w-[85%] h-[85%]" style={{transform: `rotate(${ghostRobot.dir*90}deg)`, transition: 'transform 0.3s ease'}}>{gameMode === 'mars' ? SVGS.rover : SVGS.car}</div>
                </div>
            )}

            {(gameState !== 'idle' && gameState !== 'running') && (
              <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-4 backdrop-blur-sm">
                 <div className="bg-[#8bccd8] border-[5px] border-[#201d4c] p-6 rounded-3xl text-center shadow-2xl w-[90%] max-w-sm">
                    <h2 className="text-3xl font-bold mb-4">{gameState==='won'?'🎉 Geweldig!':'💥 Oeps!'}</h2>
                    <p className="text-xl font-bold mb-6">
                      {gameState==='won' ? 'Missie Voltooid!' :
                       gameState==='lost_crash' ? 'Je botste tegen een rots!' :
                       gameState==='lost_bounds' ? 'Je reed het gebied uit!' :
                       gameState==='lost_alien' ? 'Geraakt door een alien!' : 'Doel niet bereikt!'}
                    </p>
                    {gameState==='won' ? 
                      <button onClick={isCustomMode ? onRebuild : onNext} className="w-full py-4 bg-green-500 border-[4px] border-[#201d4c] rounded-2xl text-xl font-bold text-white shadow-[0_4px_0_#201d4c] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none transition-all">
                        {isCustomMode ? <PenTool size={24}/> : <Play fill="currentColor"/>} {isCustomMode ? 'Aanpassen' : 'Volgende'}
                      </button>
                    :
                      <button onClick={onRetry} className="w-full py-4 bg-amber-400 border-[4px] border-[#201d4c] rounded-2xl text-xl font-bold text-[#201d4c] shadow-[0_4px_0_#201d4c] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none transition-all">
                         <RotateCcw size={24}/> Opnieuw
                      </button>
                    }
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-96 flex flex-col shrink-0 gap-4 h-[40%] md:h-auto min-h-0">
          <div className="flex-1 bg-white/70 border-[4px] border-[#201d4c] rounded-2xl p-3 shadow-lg flex flex-col min-h-0 relative">
             <div className="flex-1 overflow-y-auto flex flex-wrap gap-2 content-start pr-1 pb-1">
                {commands.length === 0 ? <span className="m-auto text-gray-500 font-bold opacity-50">Plaats blokken...</span> : 
                  commands.map((cmd:string, i:number) => {
                    const isCur = i === executionIndex && isExecuting;
                    const svg = cmd==='FORWARD'?SVGS.arrowUp:cmd==='LEFT'?SVGS.arrowLeft:cmd==='RIGHT'?SVGS.arrowRight:SVGS.wait;
                    return (
                      <div key={i} onClick={()=>onRemoveCommand(i)} className={`w-12 h-12 rounded-xl border-[3px] border-[#201d4c] flex items-center justify-center transition-all ${isCur?'bg-amber-300 scale-110 z-10 shadow-[0_0_15px_#fbbf24]':'bg-white shadow-[0_4px_0_#201d4c] cursor-pointer hover:-translate-y-1'}`}>{svg}</div>
                    )
                  })
                }
             </div>
             {commands.length > 0 && <style>{'#commands-list::-webkit-scrollbar { width: 4px; } #commands-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }'}</style>}
          </div>
          
          <div className="flex gap-2">
            {!isExecuting ? 
              <button disabled={commands.length===0} onClick={onPlay} className={`flex-1 bg-green-500 border-[4px] border-[#201d4c] text-white font-bold rounded-2xl p-3 flex items-center justify-center gap-1 transition-all ${commands.length===0?'opacity-50':'shadow-[0_4px_0_#201d4c] active:translate-y-1 active:shadow-none'}`}><Play fill="currentColor"/> START</button>
            : 
              <button onClick={onStop} className="flex-1 bg-red-500 border-[4px] border-[#201d4c] text-white font-bold rounded-2xl p-3 shadow-[0_4px_0_#201d4c] flex items-center justify-center gap-1 active:translate-y-1 active:shadow-none transition-all"><XCircle fill="currentColor"/> STOP</button>
            }
            <button disabled={isExecuting||commands.length===0} onClick={onClear} className={`w-16 bg-gray-200 border-[4px] border-[#201d4c] rounded-2xl p-3 flex items-center justify-center transition-all ${isExecuting||commands.length===0?'opacity-50':'shadow-[0_4px_0_#201d4c] active:translate-y-1 active:shadow-none'}`}><Trash2 className="text-[#201d4c]"/></button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button disabled={isExecuting} onClick={()=>onAddCommand('LEFT')} className="bg-amber-400 border-[4px] border-[#201d4c] rounded-2xl p-2 md:p-3 shadow-[0_4px_0_#201d4c] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50 hover:bg-amber-300">
               <div className="w-6 h-6 md:w-8 md:h-8 pointer-events-none">{SVGS.arrowLeft}</div> <span className="text-[9px] md:text-[10px] font-bold mt-1">Links</span>
            </button>
            <button disabled={isExecuting} onClick={()=>onAddCommand('FORWARD')} className="bg-amber-400 border-[4px] border-[#201d4c] rounded-2xl p-2 md:p-3 shadow-[0_4px_0_#201d4c] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50 hover:bg-amber-300">
               <div className="w-6 h-6 md:w-8 md:h-8 pointer-events-none">{SVGS.arrowUp}</div> <span className="text-[9px] md:text-[10px] font-bold mt-1">Vooruit</span>
            </button>
            <button disabled={isExecuting} onClick={()=>onAddCommand('WAIT')} className="bg-amber-400 border-[4px] border-[#201d4c] rounded-2xl p-2 md:p-3 shadow-[0_4px_0_#201d4c] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50 hover:bg-amber-300">
               <div className="w-6 h-6 md:w-8 md:h-8 pointer-events-none">{SVGS.wait}</div> <span className="text-[9px] md:text-[10px] font-bold mt-1">Wacht</span>
            </button>
            <button disabled={isExecuting} onClick={()=>onAddCommand('RIGHT')} className="bg-amber-400 border-[4px] border-[#201d4c] rounded-2xl p-2 md:p-3 shadow-[0_4px_0_#201d4c] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50 hover:bg-amber-300">
               <div className="w-6 h-6 md:w-8 md:h-8 pointer-events-none">{SVGS.arrowRight}</div> <span className="text-[9px] md:text-[10px] font-bold mt-1">Rechts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
