import 'dotenv/config'
import { prisma } from '~/prisma/index'

const BACKFILL_SQL = `
UPDATE "patch" p
SET
  favorite_count = COALESCE(f.c, 0),
  resource_count = COALESCE(r.c, 0),
  comment_count  = COALESCE(c.c, 0)
FROM (SELECT id FROM "patch") base
LEFT JOIN (
  SELECT patch_id, COUNT(*)::int AS c
  FROM "user_patch_favorite_folder_relation"
  GROUP BY patch_id
) f ON f.patch_id = base.id
LEFT JOIN (
  SELECT patch_id, COUNT(*)::int AS c
  FROM "patch_resource"
  GROUP BY patch_id
) r ON r.patch_id = base.id
LEFT JOIN (
  SELECT patch_id, COUNT(*)::int AS c
  FROM "patch_comment"
  GROUP BY patch_id
) c ON c.patch_id = base.id
WHERE p.id = base.id;
`

const buildCounterTriggerStatements = (
  name: string,
  column: string,
  table: string
): string[] => [
  `
CREATE OR REPLACE FUNCTION ${name}() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "patch" SET ${column} = ${column} + 1 WHERE id = NEW.patch_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "patch" SET ${column} = GREATEST(${column} - 1, 0) WHERE id = OLD.patch_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND NEW.patch_id IS DISTINCT FROM OLD.patch_id THEN
    UPDATE "patch" SET ${column} = GREATEST(${column} - 1, 0) WHERE id = OLD.patch_id;
    UPDATE "patch" SET ${column} = ${column} + 1 WHERE id = NEW.patch_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
`,
  `DROP TRIGGER IF EXISTS ${name} ON "${table}"`,
  `
CREATE TRIGGER ${name}
AFTER INSERT OR DELETE OR UPDATE OF patch_id
ON "${table}"
FOR EACH ROW EXECUTE FUNCTION ${name}()
`
]

const TRIGGER_STATEMENTS: string[] = [
  ...buildCounterTriggerStatements(
    'patch_favorite_count_trg',
    'favorite_count',
    'user_patch_favorite_folder_relation'
  ),
  ...buildCounterTriggerStatements(
    'patch_resource_count_trg',
    'resource_count',
    'patch_resource'
  ),
  ...buildCounterTriggerStatements(
    'patch_comment_count_trg',
    'comment_count',
    'patch_comment'
  )
]

const main = async () => {
  try {
    console.log('Installing patch counter triggers...')
    for (const stmt of TRIGGER_STATEMENTS) {
      await prisma.$executeRawUnsafe(stmt)
    }
    console.log('Triggers installed.')

    console.log('Backfilling patch counters...')
    await prisma.$executeRawUnsafe(BACKFILL_SQL)
    console.log('Backfill complete.')
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
