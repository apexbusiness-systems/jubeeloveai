export const SkillCategory = {
  LITERACY: 'literacy',
  MATH: 'math',
  COGNITIVE: 'cognitive',
  MOTOR: 'motor'
} as const;

export type SkillCategoryId = typeof SkillCategory[keyof typeof SkillCategory];

export const Skills = {
  ALPHABET: { id: 'alphabet', category: SkillCategory.LITERACY, name: 'Alphabet Recognition' },
  PHONICS: { id: 'phonics', category: SkillCategory.LITERACY, name: 'Phonics' },
  READING: { id: 'reading', category: SkillCategory.LITERACY, name: 'Reading Practice' },
  STORY: { id: 'story', category: SkillCategory.LITERACY, name: 'Story Listening' },
  COUNTING: { id: 'counting', category: SkillCategory.MATH, name: 'Counting' },
  NUMBER_REC: { id: 'number_rec', category: SkillCategory.MATH, name: 'Number Recognition' },
  COLOR_ID: { id: 'color_id', category: SkillCategory.COGNITIVE, name: 'Color Identification' },
  SHAPE_REC: { id: 'shape_rec', category: SkillCategory.COGNITIVE, name: 'Shape Recognition' },
  MEMORY: { id: 'memory', category: SkillCategory.COGNITIVE, name: 'Memory' },
  PATTERNING: { id: 'patterning', category: SkillCategory.COGNITIVE, name: 'Patterning' },
  TRACING: { id: 'tracing', category: SkillCategory.MOTOR, name: 'Tracing & Writing' }
} as const;

export type SkillId = typeof Skills[keyof typeof Skills]['id'];
