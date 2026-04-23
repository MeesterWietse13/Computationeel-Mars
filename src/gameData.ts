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

export function getMapForLevel(lvl: number, diff: Difficulty, size: number, customConfig?: {obs: number, aliens: number} | null): MapData {
  let startX = Math.floor(Math.random() * size);
  let targetX = Math.floor(Math.random() * size);
  let start = {x: startX, y: size-1, dir: 0 as Direction};
  let target = {x: targetX, y: 0};
  
  let obCount = 0; let alCount = 0;
  
  if (customConfig) {
      obCount = customConfig.obs;
      alCount = customConfig.aliens;
  } else {
      // Linear scaling multiplier: 1 for 5x5, 1.4 for 7x7, 1.8 for 9x9 -> prevents overcrowded boards
      const sizeMult = size / 5; 
      
      if (diff === 'makkelijk') {
          obCount = lvl <= 2 ? 0 : Math.floor((lvl - 2) * sizeMult); 
          alCount = lvl >= 5 ? Math.floor(1 * sizeMult) : 0; 
      } else if (diff === 'gemiddeld') {
          obCount = Math.floor((1 + lvl * 0.7) * sizeMult);
          alCount = lvl >= 3 ? Math.floor(1 * sizeMult) : 0; 
      } else {
          obCount = Math.floor((3 + lvl * 1.5) * sizeMult);
          alCount = Math.floor((1 + Math.floor(lvl / 2)) * sizeMult);
      }
  }

  // Veiligheidslimiet: maximaal ~40% van het bord vullen om onoplosbare levels te voorkomen
  const maxSafelyFree = Math.floor(size * size * 0.4);
  obCount = Math.min(obCount, maxSafelyFree);
  
  const minX = Math.min(start.x, target.x);
  const maxX = Math.max(start.x, target.x);
  const minY = 0;
  const maxY = size - 1;

  for(let attempt = 0; attempt < 50; attempt++) {
      let obstacles: Point[] = [];
      let boundingBoxSpaces: Point[] = [];
      let otherSpaces: Point[] = [];

      for (let x=0; x<size; x++) {
          for (let y=0; y<size; y++) {
              if ((x === start.x && y === start.y) || (x === target.x && y === target.y)) continue;
              
              if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                  boundingBoxSpaces.push({x, y});
              } else {
                  otherSpaces.push({x, y});
              }
          }
      }
      
      boundingBoxSpaces.sort(() => Math.random() - 0.5);
      
      if (obCount > 0) {
          if (boundingBoxSpaces.length > 0) {
              // Zorg dat er minstens 1 hindernis de kortste of logische route in de weg staat
              obstacles.push(boundingBoxSpaces.pop()!);
          }
          
          let allSpaces = [...boundingBoxSpaces, ...otherSpaces].sort(() => Math.random() - 0.5);
          for(let i=1; i<obCount; i++) {
              if (allSpaces.length > 0) obstacles.push(allSpaces.pop()!);
          }
      }

      let randomAliens: AlienState[] = [];
      for(let i=0; i<alCount; i++) {
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

export function generateWordMap(word: string, difficulty: Difficulty, level: number = 1, size: number, customConfig?: {obs: number, aliens: number} | null): MapData {
  let startX = Math.floor(Math.random() * size);
  let start = {x: startX, y: size-1, dir: 0 as Direction};
  
  let numObstacles = 0; let numAliens = 0;
  
  if (customConfig) {
      numObstacles = customConfig.obs;
      numAliens = customConfig.aliens;
  } else {
      const sizeMult = size / 5;
      
      if (difficulty === 'makkelijk') {
          numObstacles = level <= 2 ? 0 : Math.floor((level - 2) * sizeMult); 
          numAliens = level >= 5 ? Math.floor(1 * sizeMult) : 0; 
      } else if (difficulty === 'gemiddeld') {
          numObstacles = Math.floor((1 + level * 0.7) * sizeMult);
          numAliens = level >= 3 ? Math.floor(1 * sizeMult) : 0; 
      } else {
          numObstacles = Math.floor((3 + level * 1.5) * sizeMult);
          numAliens = Math.floor((1 + Math.floor(level / 2)) * sizeMult);
      }
  }

  const maxSafelyFree = Math.floor(size * size * 0.4);
  numObstacles = Math.min(numObstacles, maxSafelyFree);
  
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
