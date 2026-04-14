import { execSync } from 'child_process';
import { renameSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const appDir = join(root, 'app');
const backupDir = join(root, '_build_temp_backup');

const foldersToHide = ['api', 'auth'];

// Helper to move folders reliably on Windows
function moveFolder(src, dest) {
  try {
    renameSync(src, dest);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EBUSY') {
      console.warn(`⚠️  Warning: Could not move ${src}. File might be locked.`);
      console.warn(`👉 Please ensure you have stopped 'npm run dev' and closed any open files in that folder.`);
      
      // Fallback to Shell Move (sometimes works where Node fails)
      try {
        const cmd = process.platform === 'win32' 
          ? `powershell -Command "Move-Item -Path '${src}' -Destination '${dest}' -Force"`
          : `mv "${src}" "${dest}"`;
        execSync(cmd, { stdio: 'inherit' });
      } catch (shellErr) {
        throw new Error(`CRITICAL FAIL: Could not move ${src}. File lock detected. Stop 'npm run dev' and try again.`);
      }
    } else {
      throw err;
    }
  }
}

async function build() {
  console.log('🚀 Starting Native App Build Process...');

  try {
    // 1. Prepare Backup
    if (existsSync(backupDir)) {
      rmSync(backupDir, { recursive: true, force: true });
    }
    mkdirSync(backupDir);

    // 2. Move sensitive folders out of 'app' to avoid static export errors
    console.log('📦 Temporarily hiding dynamic routes...');
    for (const folder of foldersToHide) {
      const src = join(appDir, folder);
      if (existsSync(src)) {
        moveFolder(src, join(backupDir, folder));
      }
    }

    // 3. Run Next.js Build with Capacitor Flag
    console.log('🏗️ Building static export...');
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, IS_CAPACITOR_BUILD: 'true' }
    });

    console.log('✅ Build successful!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1); // Exit with error to stop the chain
  } finally {
    // 4. Always restore folders
    console.log('♻️ Restoring project structure...');
    for (const folder of foldersToHide) {
      const src = join(backupDir, folder);
      const dest = join(appDir, folder);
      if (existsSync(src)) {
        try {
          moveFolder(src, dest);
        } catch (e) {
          console.error(`🚨 CRITICAL: Failed to restore ${folder}! Find it in ${backupDir}`);
        }
      }
    }
    
    // 5. Cleanup backup dir
    if (existsSync(backupDir)) {
      try {
        rmSync(backupDir, { recursive: true, force: true });
      } catch (e) {}
    }

    // 6. Sync Capacitor
    console.log('🔄 Syncing with Android...');
    try {
      execSync('npx.cmd cap sync android', { stdio: 'inherit' });
    } catch (e) {}
    
    console.log('🏁 Process complete. You can now build the APK in Android Studio.');
  }
}

build();
