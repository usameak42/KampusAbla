const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting build with full error capture...\n');

const build = spawn('npm', ['run', 'build'], {
    shell: true,
    cwd: __dirname
});

let stdout = '';
let stderr = '';

build.stdout.on('data', (data) => {
    const text = data.toString();
    stdout += text;
    process.stdout.write(text);
});

build.stderr.on('data', (data) => {
    const text = data.toString();
    stderr += text;
    process.stderr.write(text);
});

build.on('close', (code) => {
    console.log(`\n\n=== BUILD PROCESS EXITED WITH CODE: ${code} ===\n`);

    const fullOutput = `=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}\n\n=== EXIT CODE ===\n${code}`;

    fs.writeFileSync('build-debug.log', fullOutput, 'utf8');
    console.log('Full output saved to build-debug.log');

    process.exit(code);
});
