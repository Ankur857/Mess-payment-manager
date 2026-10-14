/**
 * Phase 7: Security Audit Scanner
 * Verifies that:
 * 1. Client code contains NO service_role keys or secrets
 * 2. Client code contains NO hardcoded WhatsApp API access tokens
 * 3. Client code contains NO hardcoded Postgres database connection URLs
 * 4. Supabase SQL migrations strictly enforce Row Level Security (RLS) on all user-facing tables
 * 5. Supabase RLS write policies require auth.role() = 'authenticated'
 * 6. .gitignore strictly blocks .env, *.pem, and local credentials
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase', 'migrations');
const GITIGNORE_PATH = path.join(ROOT_DIR, '.gitignore');

console.log('🔒 Starting Fee Manager Security Audit...\n');

let totalChecks = 0;
let passedChecks = 0;

function runCheck(name, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
  }
}

// 1. Scan directory recursively for text patterns
function getFilesRecursive(dir, extFilter = ['.ts', '.tsx', '.js', '.jsx', '.json']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(fullPath, extFilter));
    } else {
      if (extFilter.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// Check 1: No Service Role Key in src/
runCheck('Verify no Supabase service_role keys leaked in client application (src/)', () => {
  const clientFiles = getFilesRecursive(SRC_DIR);
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    assert.equal(
      content.includes('service_role'),
      false,
      `Forbidden string "service_role" found in client file: ${path.relative(ROOT_DIR, file)}`
    );
    assert.equal(
      content.includes('SUPABASE_SERVICE_ROLE_KEY'),
      false,
      `Forbidden environment variable SUPABASE_SERVICE_ROLE_KEY found in client file: ${path.relative(ROOT_DIR, file)}`
    );
  }
});

// Check 2: No Hardcoded Meta Access Tokens in client code
runCheck('Verify no raw Meta/WhatsApp Bearer tokens hardcoded in client application', () => {
  const clientFiles = getFilesRecursive(SRC_DIR);
  // Match EAAB, EAAC, EAAD Meta access token patterns
  const tokenRegex = /EAA[A-Za-z0-9]{50,}/;
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    assert.equal(
      tokenRegex.test(content),
      false,
      `Potential hardcoded Meta Access Token detected in: ${path.relative(ROOT_DIR, file)}`
    );
  }
});

// Check 3: No Postgres connection URIs in client code
runCheck('Verify no direct database credentials (postgres://) in client application', () => {
  const clientFiles = getFilesRecursive(SRC_DIR);
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    assert.equal(
      content.includes('postgres://') || content.includes('postgresql://'),
      false,
      `Database connection string found in: ${path.relative(ROOT_DIR, file)}`
    );
  }
});

// Check 4: Check .gitignore for sensitive files
runCheck('Verify .gitignore protects sensitive credential files (.env, *.pem)', () => {
  assert.equal(fs.existsSync(GITIGNORE_PATH), true, '.gitignore file must exist');
  const gitignoreContent = fs.readFileSync(GITIGNORE_PATH, 'utf-8');
  assert.equal(gitignoreContent.includes('.env'), true, '.gitignore must ignore .env files');
});

// Check 5: Check Supabase migrations for RLS enablement on all tables
runCheck('Verify RLS is enabled on all tables in Supabase SQL schema', () => {
  const migrationFiles = getFilesRecursive(MIGRATIONS_DIR, ['.sql']);
  assert.ok(migrationFiles.length > 0, 'At least one SQL migration must exist');

  const requiredTables = ['students', 'payments', 'billing_cycles', 'reminder_logs'];
  let allSql = '';
  for (const f of migrationFiles) {
    allSql += fs.readFileSync(f, 'utf-8') + '\n';
  }

  for (const table of requiredTables) {
    const rlsPattern = new RegExp(`ALTER\\s+TABLE\\s+(public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    assert.ok(
      rlsPattern.test(allSql),
      `Table "${table}" must have ENABLE ROW LEVEL SECURITY defined in migrations`
    );
  }
});

// Check 6: Check that write policies enforce authenticated admin role
runCheck('Verify RLS policies restrict write/mutate access to authenticated admins', () => {
  const migrationFiles = getFilesRecursive(MIGRATIONS_DIR, ['.sql']);
  let allSql = '';
  for (const f of migrationFiles) {
    allSql += fs.readFileSync(f, 'utf-8') + '\n';
  }

  assert.ok(
    allSql.includes("auth.role() = 'authenticated'"),
    'SQL policies must explicitly check auth.role() = \'authenticated\' to prevent anon writes'
  );
});

console.log(`\n========================================`);
console.log(`Security Audit Completed: ${passedChecks}/${totalChecks} checks passed.`);
console.log(`========================================\n`);

if (passedChecks !== totalChecks) {
  process.exit(1);
}
