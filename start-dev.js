#!/usr/bin/env node
// Development startup script to bypass cross-env/tsx dependency issues
process.env.NODE_ENV = 'development';

import('./server/index.js').catch(async () => {
  // If .js fails, try compiling TypeScript first
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    console.log('Compiling TypeScript...');
    await execAsync('npx tsc server/index.ts --target es2022 --module es2022 --moduleResolution node --outDir temp_build');
    await import('./temp_build/server/index.js');
  } catch (compileError) {
    console.log('TypeScript compilation failed, trying direct Node.js execution...');
    await execAsync(`node --loader=${process.cwd()}/node_modules/ts-node/esm.mjs server/index.ts`);
  }
});