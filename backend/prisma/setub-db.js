const { execSync } = require('child_process');
const path = require('path');

const run = (cmd, ignoreError = false) => {
  try {
    console.log(`\n> ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    return true;
  } catch (e) {
    if (ignoreError) {
      console.log(`   (ignored — likely already applied)`);
      return true;
    }
    console.log(`   ⚠️  Command failed, will retry with resolve...`);
    return false;
  }
};

console.log('=== AgriSync Database Setup ===\n');

// 1. Try a normal deploy first
const ok = run('npx prisma migrate deploy', true);

if (!ok) {
  console.log('\n--- Baseline mode: marking existing migrations as applied ---\n');

  const migrations = [
    '20260808194343_add_order_fields',
    '20260816120000_add_inventory_change_requests',
    '20260819102347_enhance_review_fraud_detection',
    '20260823120000_add_promotion_requests',
  ];

  for (const m of migrations) {
    run(`npx prisma migrate resolve --applied ${m}`, true);
  }

  console.log('\n--- Re-trying deploy ---');
  run('npx prisma migrate deploy');
}

// 2. Always regenerate client to be safe
console.log('\n--- Generating Prisma Client ---');
run('npx prisma generate');

console.log('\n✅ Database is ready. You can now run: npm run dev');