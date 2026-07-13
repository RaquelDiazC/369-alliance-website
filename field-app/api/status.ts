import { LIBRARY } from "./_lib";

export default function handler(_req: any, res: any) {
  res.status(200).json({
    ai: !!process.env.ANTHROPIC_API_KEY,
    codeRequired: !!process.env.FIELD_ACCESS_CODE,
    items: Object.keys(LIBRARY).length,
    active: Object.values(LIBRARY).filter(e => e.st === "active").length,
  });
}
