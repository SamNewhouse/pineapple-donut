export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateWord = (min: number, max: number): string => {
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const vowels = "aeiou";
  const length = Math.floor(Math.random() * (max - min + 1)) + min;
  let word = "";
  for (let i = 0; i < length; i++) {
    const pool = i % 2 === 0 ? consonants : vowels;
    word += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return word;
};

export const shortUUID = (): string => {
  const uuid = crypto.randomUUID();
  return uuid.slice(0, 8);
};
