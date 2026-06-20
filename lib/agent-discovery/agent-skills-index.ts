import { createHash } from "crypto";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

const SKILLS_DIR = path.join(process.cwd(), "public", "agent-skills");
const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

export const AGENT_SKILLS_INDEX_PATH = "/.well-known/agent-skills/index.json";

type SkillEntry = {
  name: string;
  type: "skill-md";
  description: string;
  url: string;
  digest: string;
};

function sha256Digest(content: string): string {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

/** Agent Skills Discovery RFC v0.2.0 index from public/agent-skills SKILL.md files */
export function buildAgentSkillsIndex(siteUrl: string) {
  const skills: SkillEntry[] = [];

  if (existsSync(SKILLS_DIR)) {
    for (const dir of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const skillPath = path.join(SKILLS_DIR, dir.name, "SKILL.md");
      if (!existsSync(skillPath)) continue;

      const content = readFileSync(skillPath, "utf8");
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*(.+)$/m);

      skills.push({
        name: dir.name,
        type: "skill-md",
        description:
          descMatch?.[1]?.trim() ??
          nameMatch?.[1]?.trim() ??
          `HomeUP agent skill: ${dir.name}`,
        url: `${siteUrl}/agent-skills/${dir.name}/SKILL.md`,
        digest: sha256Digest(content),
      });
    }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  return {
    $schema: SCHEMA,
    skills,
  };
}
