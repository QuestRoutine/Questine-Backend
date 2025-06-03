export const getLevelImageUrl = (level: number): string => {
  if (level >= 1 && level <= 3) return '/assets/tree0.png';
  if (level >= 4 && level <= 6) return '/assets/tree1.png';
  if (level >= 7 && level <= 10) return '/assets/tree2.png';
  if (level >= 11 && level <= 15) return '/assets/tree3.png';
  if (level >= 16 && level <= 20) return '/assets/tree4.png';
  if (level >= 21 && level <= 24) return '/assets/tree5.png';
  if (level >= 26 && level <= 29) return '/assets/tree6.png';
  if (level >= 30 && level <= 35) return '/assets/tree7.png';
  if (level >= 36 && level <= 40) return '/assets/tree8.png';
  if (level >= 41 && level <= 45) return '/assets/tree9.png';
  if (level >= 46 && level <= 49) return '/assets/tree10.png';
  if (level >= 50) return '/assets/tree11.png';
  return '/assets/tree0.png'; // 기본값
};
