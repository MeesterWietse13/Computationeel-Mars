import { Difficulty, MapData, Point, AlienState, LetterState, Direction } from './types';

const MAPS = {
  makkelijk: [
      { size: 5, start: {x: 2, y: 4, dir: 0 as Direction}, target: {x: 2, y: 1}, obstacles: [], aliens: [] },
      { size: 5, start: {x: 0, y: 4, dir: 0 as Direction}, target: {x: 4, y: 4}, obstacles: [], aliens: [] },
      { size: 5, start: {x: 0, y: 4, dir: 0 as Direction}, target: {x: 4, y: 0}, obstacles: [{x:2, y:2}, {x:2, y:3}, {x:2, y:4}], aliens: [{x: 0, y: 2, axis: 'x' as const, min: 0, max: 4, dir: 1}] },
      { size: 5, start: {x: 2, y: 4, dir: 0 as Direction}, target: {x: 2, y: 0}, obstacles: [{x:1, y:2}, {x:2, y:2}], aliens: [{x: 4, y: 1, axis: 'x' as const, min: 2, max: 4, dir: 1}] },
      { size: 5, start: {x: 4, y: 4, dir: 0 as Direction}, target: {x: 0, y: 0}, obstacles: [{x:1, y:1}, {x:2, y:2}, {x:3, y:3}], aliens: [] }
  ],
  gemiddeld: [
      { size: 7, start: {x: 3, y: 6, dir: 0 as Direction}, target: {x: 3, y: 0}, obstacles: [{x:2, y:3}, {x:3, y:3}, {x:4, y:3}], aliens: [] },
      { size: 7, start: {x: 0, y: 6, dir: 0 as Direction}, target: {x: 6, y: 0}, obstacles: [{x:2, y:6}, {x:2, y:5}, {x:2, y:4}, {x:4, y:0}, {x:4, y:1}, {x:4, y:2}], aliens: [] },
      { size: 7, start: {x: 3, y: 6, dir: 0 as Direction}, target: {x: 3, y: 0}, obstacles: [{x:1, y:4}, {x:3, y:4}, {x:5, y:4}], aliens: [{x: 1, y: 3, axis: 'x' as const, min: 1, max: 5, dir: 1}] },
      { size: 7, start: {x: 3, y: 6, dir: 0 as Direction}, target: {x: 3, y: 0}, obstacles: [{x:0, y:3}, {x:1, y:3}, {x:2, y:3}, {x:4, y:3}, {x:5, y:3}, {x:6, y:3}], aliens: [] },
      { size: 7, start: {x: 6, y: 6, dir: 0 as Direction}, target: {x: 0, y: 0}, obstacles: [{x:4, y:4}, {x:2, y:2}], aliens: [{x: 4, y: 0, axis: 'y' as const, min: 0, max: 6, dir: 1}] }
  ],
  moeilijk: [
      { size: 9, start: {x: 4, y: 8, dir: 0 as Direction}, target: {x: 4, y: 0}, obstacles: [{x:4, y:4}, {x:3, y:4}, {x:5, y:4}, {x:4, y:3}, {x:4, y:5}], aliens: [] },
      { size: 9, start: {x: 0, y: 8, dir: 0 as Direction}, target: {x: 8, y: 0}, obstacles: [{x:2, y:8}, {x:2, y:7}, {x:2, y:6}, {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:6, y:8}, {x:6, y:7}, {x:6, y:6}], aliens: [] },
      { size: 9, start: {x: 4, y: 8, dir: 0 as Direction}, target: {x: 4, y: 0}, obstacles: [{x:2, y:2}, {x:6, y:2}, {x:2, y:6}, {x:6, y:6}], aliens: [{x: 0, y: 4, axis: 'x' as const, min: 0, max: 8, dir: 1}] },
      { size: 9, start: {x: 0, y: 4, dir: 1 as Direction}, target: {x: 8, y: 4}, obstacles: [{x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:4, y:3}, {x:4, y:5}, {x:4, y:6}, {x:4, y:7}, {x:4, y:8}], aliens: [{x: 3, y: 4, axis: 'y' as const, min: 0, max: 8, dir: 1}, {x: 5, y: 4, axis: 'y' as const, min: 0, max: 8, dir: -1}] },
      { size: 9, start: {x: 8, y: 8, dir: 0 as Direction}, target: {x: 0, y: 0}, obstacles: [{x:1, y:1}, {x:3, y:3}, {x:5, y:5}, {x:7, y:7}], aliens: [{x: 2, y: 0, axis: 'y' as const, min: 0, max: 8, dir: 1}, {x: 6, y: 8, axis: 'y' as const, min: 0, max: 8, dir: -1}] }
  ]
};

function isPathValid(size: number, start: Point, target: Point, obstacles: Point[]) {
  const queue = [{x: start.x, y: start.y}];
  const visited = new Set([`${start.x},${start.y}`]);
  const isObs = (x:number, y:number) => obstacles.some(o => o.x === x && o.y === y);

  while(queue.length > 0) {
      const {x, y} = queue.shift()!;
      if (x === target.x && y === target.y) return true;
      const neighbors = [{x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1}];

      for (const n of neighbors) {
          if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size && !isObs(n.x, n.y)) {
              const key = `${n.x},${n.y}`;
              if (!visited.has(key)) {
                  visited.add(key);
                  queue.push(n);
              }
          }
      }
  }
  return false;
}

export function getMapForLevel(lvl: number, diff: Difficulty): MapData {
  let predef = MAPS[diff];
  if (lvl <= predef.length) return predef[lvl - 1];
  
  let size = diff === 'makkelijk' ? 5 : diff === 'gemiddeld' ? 7 : 9;
  let start = {x: 0, y: size-1, dir: 0 as Direction};
  let target = {x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * Math.max(1, size/2))}; 
  if (target.x === start.x && target.y === start.y) target.x = size - 1;

  let numObstacles = diff === 'makkelijk' ? 4 : diff === 'gemiddeld' ? 10 : 20;
  
  for(let attempt = 0; attempt < 50; attempt++) {
      let obstacles: Point[] = [];
      for(let i=0; i<numObstacles; i++) {
          let ox = Math.floor(Math.random() * size);
          let oy = Math.floor(Math.random() * size);
          if ((ox === start.x && oy === start.y) || (ox === target.x && oy === target.y)) continue;
          obstacles.push({x: ox, y: oy});
      }

      let randomAliens: AlienState[] = [];
      if (Math.random() > 0.4 && diff !== 'makkelijk') {
          let ax = Math.floor(Math.random() * (size - 2)) + 1;
          let ay = Math.floor(Math.random() * (size - 2)) + 1;
          if (!obstacles.some(o => o.x === ax && o.y === ay) && !(target.x === ax && target.y === ay) && !(start.x === ax && start.y === ay)) {
              let isX = Math.random() > 0.5;
              randomAliens.push({ 
                  x: ax, y: ay, 
                  axis: isX ? 'x' : 'y', 
                  min: isX ? ax - 1 : ay - 1, 
                  max: isX ? ax + 1 : ay + 1, 
                  dir: 1 
              });
          }
      }

      if (isPathValid(size, start, target, obstacles)) {
          return { size, start, target, obstacles, aliens: randomAliens };
      }
  }
  return { size, start, target, obstacles: [], aliens: [] };
}

function areAllLettersReachable(size: number, start: Point, letters: LetterState[], obstacles: Point[]) {
  const queue = [{x: start.x, y: start.y}];
  const visited = new Set([`${start.x},${start.y}`]);
  const isObs = (x:number, y:number) => obstacles.some(o => o.x === x && o.y === y);

  while(queue.length > 0) {
      const {x, y} = queue.shift()!;
      const neighbors = [{x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1}];

      for (const n of neighbors) {
          if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size && !isObs(n.x, n.y)) {
              const key = `${n.x},${n.y}`;
              if (!visited.has(key)) {
                  visited.add(key);
                  queue.push(n);
              }
          }
      }
  }
  
  for (let l of letters) {
      if (!visited.has(`${l.x},${l.y}`)) return false;
  }
  return true;
}

export function generateWordMap(word: string, difficulty: Difficulty, level: number = 1): MapData {
  let size = difficulty === 'makkelijk' ? 5 : difficulty === 'gemiddeld' ? 7 : 9;
  let start = {x: 0, y: size-1, dir: 0 as Direction};
  
  let numObstacles = 0;
  let numAliens = 0;
  
  if (difficulty === 'makkelijk') {
      numObstacles = Math.min(2, level - 1); 
      numAliens = level >= 4 ? 1 : 0; 
  } else if (difficulty === 'gemiddeld') {
      numObstacles = Math.min(5, 1 + level);
      numAliens = level >= 2 ? (level >= 5 ? 2 : 1) : 0; 
  } else {
      numObstacles = Math.min(10, 3 + level * 2);
      numAliens = Math.min(3, 1 + Math.floor(level/2));
  }
  
  for(let attempt = 0; attempt < 50; attempt++) {
      let obstacles: Point[] = [];
      let letters: LetterState[] = [];
      
      let allSpaces: Point[] = [];
      for (let x=0; x<size; x++) {
          for (let y=0; y<size; y++) {
              if (x === start.x && y === start.y) continue;
              allSpaces.push({x, y});
          }
      }
      // Shuffle spacess
      allSpaces.sort(() => Math.random() - 0.5);
      
      // Try to place letters far apart for progression if possible by grabbing from distinct quadrants
      let corners = [
         {x: size-1, y: 0}, {x: size-1, y: size-1}, {x: 0, y: 0}, {x: Math.floor(size/2), y: Math.floor(size/2)}
      ];
      
      for(let i=0; i<word.length; i++) {
          if (allSpaces.length > 0) {
             let corner = corners[i % corners.length];
             // Find closest available space to this corner
             allSpaces.sort((a,b) => (Math.abs(a.x-corner.x)+Math.abs(a.y-corner.y)) - (Math.abs(b.x-corner.x)+Math.abs(b.y-corner.y)));
             let pos = allSpaces.shift()!;
             letters.push({ ...pos, char: word[i].toUpperCase(), collected: false });
          }
      }
      
      // Reshuffle for obstacles
      allSpaces.sort(() => Math.random() - 0.5);

      for(let i=0; i<numObstacles; i++) {
          if (allSpaces.length > 0) obstacles.push(allSpaces.pop()!);
      }

      let aliens: AlienState[] = [];
      for(let i=0; i<numAliens; i++) {
          let ax = Math.floor(Math.random() * (size - 2)) + 1;
          let ay = Math.floor(Math.random() * (size - 2)) + 1;
          if (!obstacles.some(o => o.x === ax && o.y === ay) && 
              !letters.some(l => l.x === ax && l.y === ay) &&
              !(start.x === ax && start.y === ay)) {
              let isX = Math.random() > 0.5;
              aliens.push({ x: ax, y: ay, axis: isX ? 'x' : 'y', min: isX ? ax - 1 : ay - 1, max: isX ? ax + 1 : ay + 1, dir: 1 });
          }
      }

      if (areAllLettersReachable(size, start, letters, obstacles)) {
          return { size, start, obstacles, aliens, letters };
      }
  }
  
  return { size, start, obstacles: [], aliens: [], letters: word.split('').map((c, i) => ({x: (i+1)%size, y: Math.floor((i+1)/size), char: c.toUpperCase(), collected: false})) };
}
