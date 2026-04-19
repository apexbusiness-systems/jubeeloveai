const fs = require('fs');

const file = 'src/components/achievements/AchievementList.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `    const cats: Record<string, Achievement[]> = {
      all: sortedAll,
      activity: [],
      streak: [],
      milestone: [],
      special: []
    }

    let earned = 0

    for (const achievement of sortedAll) {
      if (achievement.earned) earned++

      const category = achievement.category
      if (cats[category]) {
        cats[category].push(achievement)
      }
    }`;

const newCode = `    const cats: Record<string, Achievement[]> = {
      activity: [],
      streak: [],
      milestone: [],
      special: []
    }

    let earned = 0

    for (const achievement of sortedAll) {
      if (achievement.earned) earned++

      const category = achievement.category
      if (cats[category]) {
        cats[category].push(achievement)
      }
    }

    cats.all = sortedAll;`;

let modified = content.replace(oldCode, newCode);

const oldSort = `  // Return categories as-is since they are already sorted
  const sortAchievements = (achievementList: Achievement[]) => achievementList`;

const newSort = `  // Return categories as-is since they are already sorted
  // We use useCallback to keep the same reference across renders, matching the original behavior
  const sortAchievements = React.useCallback((achievementList: Achievement[]) => achievementList, [])`;

modified = modified.replace(oldSort, newSort);

modified = `import React, { useMemo, memo } from 'react'\n` + modified.replace(`import { useMemo, memo } from 'react'\n`, ``);

fs.writeFileSync(file, modified, 'utf8');
console.log("Patched 2");
