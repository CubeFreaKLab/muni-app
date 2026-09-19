// Reuse Muni's existing server instead of silently moving the phone to 8082.
const { spawn } = require('node:child_process');
const path = require('node:path');

async function main() {
  let server;
  try {
    server = await fetch('http://127.0.0.1:8081/', {
      signal: AbortSignal.timeout(3000),
      headers: { 'expo-platform': 'ios', Accept: 'application/expo+json' },
    });
  } catch (error) {
    if (error.cause?.code !== 'ECONNREFUSED') throw error;
    const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli');
    const child = spawn(process.execPath, [cli, 'start', '--go', '--port', '8081'], {
      stdio: 'inherit',
      windowsHide: true,
    });
    child.on('exit', (code) => { process.exitCode = code ?? 1; });
    return;
  }
  if (!server.ok) throw new Error('El puerto 8081 está ocupado. Cierra su servidor antes de abrir Muni.');
  const manifest = await server.json();
  const config = manifest.extra?.expoClient;
  if (config?.ios?.bundleIdentifier !== 'bo.muni.app' || !manifest.launchAsset?.url) {
    throw new Error('El puerto 8081 pertenece a otro proyecto. Cierra ese servidor antes de abrir Muni.');
  }
  const link = await fetch('http://127.0.0.1:8081/_expo/link?platform=ios', {
    redirect: 'manual', signal: AbortSignal.timeout(3000),
  });
  const url = link.headers.get('location');
  if (!url?.startsWith('exp://') || ['localhost', '127.0.0.1'].includes(new URL(url).hostname)) {
    throw new Error('Expo no anunció una dirección de red local. Reinicia con npm run phone.');
  }
  console.log('\nMuni ya está ejecutándose. Escanea este QR con Cámara en el iPhone:\n');
  require('qrcode-terminal').generate(url, { small: true });
  console.log('\n' + url + '\nMantén abierto el servidor original y usa la misma Wi-Fi.\n');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
