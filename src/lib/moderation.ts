export type ModerationCategory =
  | "racism_ethnicity"
  | "religion"
  | "gender_sexism"
  | "sexuality_homophobia"
  | "disability"
  | "nationality"
  | "abuse_profanity";

export type ModerationAction = "mask" | "block";

const CATEGORY_TERMS: Record<ModerationCategory, readonly string[]> = {
  racism_ethnicity: [
    "nigger",
    "niggers",
    "nigga",
    "niggas",
  ],
  religion: [
    "kruisvaarder",
    "heiden",
  ],
  gender_sexism: [
    "bitch",
    "hoer",
    "slet",
  ],
  sexuality_homophobia: [
    "homo",
    "flikker",
  ],
  disability: [
    "mongool",
    "retard",
  ],
  nationality: [
    "kankerturk",
    "kankermarokkaan",
  ],
  abuse_profanity: [
    "fuck",
    "fucking",
    "shit",
    "asshole",
    "cunt",
    "dick",
    "motherfucker",
    "kanker",
    "tering",
    "tyfus",
    "klootzak",
    "kloot",
    "kut",
    "lul",
    "leijer",
    "lijer",
  ],
};

const CATEGORY_ACTIONS: Record<ModerationCategory, ModerationAction> = {
  racism_ethnicity: "block",
  religion: "block",
  gender_sexism: "block",
  sexuality_homophobia: "block",
  disability: "block",
  nationality: "block",
  abuse_profanity: "block",
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CATEGORY_REGEX: Record<ModerationCategory, RegExp[]> = (
  Object.entries(CATEGORY_TERMS) as Array<[ModerationCategory, readonly string[]]>
).reduce(
  (acc, [category, terms]) => {
    acc[category] = terms.map((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "gi"));
    return acc;
  },
  {
    racism_ethnicity: [],
    religion: [],
    gender_sexism: [],
    sexuality_homophobia: [],
    disability: [],
    nationality: [],
    abuse_profanity: [],
  } as Record<ModerationCategory, RegExp[]>,
);

export function moderateTextByCategory(
  input: string,
  maskChar = "X",
): {
  text: string;
  categoriesTriggered: ModerationCategory[];
  blocked: boolean;
} {
  if (!input.trim()) {
    return { text: input, categoriesTriggered: [], blocked: false };
  }

  let output = input;
  const triggered = new Set<ModerationCategory>();

  for (const category of Object.keys(CATEGORY_REGEX) as ModerationCategory[]) {
    for (const regex of CATEGORY_REGEX[category]) {
      output = output.replace(regex, (match) => {
        triggered.add(category);
        return maskChar.repeat(match.length);
      });
    }
  }

  const categoriesTriggered = [...triggered];
  const blocked = categoriesTriggered.some(
    (category) => CATEGORY_ACTIONS[category] === "block",
  );

  return { text: output, categoriesTriggered, blocked };
}
