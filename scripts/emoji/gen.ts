import fs from 'fs';
import { resolve } from 'path';

function main() {
  const genUrl = (unicode: string) => {
    return `https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/${unicode}@2x.png`;
  };

  const emojiData = fs.readFileSync(resolve(import.meta.dirname, './emoji.json'), 'utf8');
  const result = {};

  for (const emoji of JSON.parse(emojiData)) {
    const { name, unicode, skinVariations, obsoletes } = emoji;

    result[name] = genUrl(unicode);

    if (!skinVariations) {
      continue;
    }

    if (!!obsoletes) {
      result[obsoletes] = genUrl(unicode.split('-')[0]);
    }

    for (const skinData of Object.values(skinVariations)) {
      const { name: skinName, unicode: skinUnicode } = skinData as {
        name: string;
        unicode: string;
      };
      result[skinName] = genUrl(skinUnicode);
    }
  }

  const output = JSON.stringify(result, null, 2);
  fs.writeFileSync(resolve(process.cwd(), 'db', 'emoji_standard.json'), output, 'utf8');
}

main();
