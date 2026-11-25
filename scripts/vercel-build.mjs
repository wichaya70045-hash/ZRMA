import { execSync } from 'child_process';

function run(cmd, extraEnv = {}) {
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
}

const resolvedDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_POSTGRES_PRISMA_URL ||
  '';

const isVercel = Boolean(process.env.VERCEL);
const isLocalhost = /(?:localhost|127\.0\.0\.1|::1)/i.test(resolvedDbUrl);

console.log('🔧 [ZRMA Build] Generating Prisma Client...');
run('npx prisma generate');

if (isVercel) {
  if (!resolvedDbUrl || isLocalhost) {
    console.warn(
      '⚠️ [ZRMA Vercel Build] DATABASE_URL is missing or points to localhost. Skipping prisma db push. Please configure Cloud PostgreSQL (Neon / Supabase / Vercel Postgres) in Vercel Environment Variables.'
    );
  } else {
    try {
      console.log('🗄️ [ZRMA Vercel Build] Syncing PostgreSQL schema with Prisma...');
      run('npx prisma db push --skip-generate', { DATABASE_URL: resolvedDbUrl });
      console.log('🌱 [ZRMA Vercel Build] Running idempotent seed...');
      run('node prisma/seed.mjs', { DATABASE_URL: resolvedDbUrl });
    } catch (err) {
      console.warn(
        '⚠️ [ZRMA Vercel Build] Schema push/seed encountered an error (continuing build):',
        err instanceof Error ? err.message : err
      );
    }
  }
}

console.log('▲ [ZRMA Build] Running Next.js build...');
run('npx next build');
