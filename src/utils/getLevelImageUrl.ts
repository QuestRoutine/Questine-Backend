export const getLevelImageUrl = (level: number): string => {
  if (level >= 1 && level <= 3) return '/assets/tree0.png';
  if (level >= 4 && level <= 10) return '/assets/tree1.png';
  if (level >= 11 && level <= 15) return '/assets/tree2.png';
  if (level >= 16 && level <= 20) return '/assets/tree3.png';
  if (level >= 21 && level <= 30) return '/assets/tree4.png';
  if (level >= 31 && level <= 40) return '/assets/tree5.png';
  if (level >= 41 && level <= 50) return '/assets/tree6.png';
  if (level >= 51) return '/assets/tree7.png';
  return '/assets/tree0.png'; // 기본값
};
