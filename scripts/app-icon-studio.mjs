import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { access, cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.NPL_ICON_STUDIO_PORT || 4179);
const host = '127.0.0.1';
const maxRequestBytes = 24 * 1024 * 1024;
const jobLogsLimit = 24000;
const densityFolders = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const assetPaths = [
  'android/app/src/main/res/drawable-nodpi/npl_crest_source.png',
  'public/npl-favicon.png',
  ...densityFolders.flatMap((density) => [
    `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
    `android/app/src/main/res/mipmap-${density}/ic_launcher_round_foreground.png`,
    `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
    `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`
  ])
];
const jobs = new Map();
const studioHtml = await readFile(new URL('./app-icon-studio.html', import.meta.url));

function jsonResponse(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(value));
}

function appendJobLog(job, message) {
  job.logs = `${job.logs}${message}`;
  if (job.logs.length > jobLogsLimit) {
    job.logs = job.logs.slice(-jobLogsLimit);
  }
}

function safeProjectPath(relativePath) {
  const absolutePath = path.resolve(projectRoot, relativePath);
  if (!absolutePath.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error('An icon asset path was outside the project.');
  }
  return absolutePath;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxRequestBytes) {
        reject(new Error('The icon image pack is too large. Try a smaller photo.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

async function applyIconAssets(payload) {
  if (!payload || !/^#[0-9a-f]{6}$/i.test(payload.background || '')) {
    throw new Error('Choose a valid six-digit icon background color.');
  }
  if (!payload.assets || typeof payload.assets !== 'object' || Array.isArray(payload.assets)) {
    throw new Error('The icon image pack is missing.');
  }
  const suppliedPaths = Object.keys(payload.assets).sort();
  const requiredPaths = [...assetPaths].sort();
  if (JSON.stringify(suppliedPaths) !== JSON.stringify(requiredPaths)) {
    throw new Error('The generated icon pack is incomplete. Preview the photo again and retry.');
  }

  const stagedFiles = [];
  try {
    for (const relativePath of assetPaths) {
      const dataUrl = payload.assets[relativePath];
      if (typeof dataUrl !== 'string' || !/^data:image\/png;base64,[a-z0-9+/]+=*$/i.test(dataUrl)) {
        throw new Error(`The generated image "${path.basename(relativePath)}" is not a valid PNG.`);
      }
      const data = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
      if (data.length < 8 || data.length > 4 * 1024 * 1024 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        throw new Error(`The generated image "${path.basename(relativePath)}" is empty or invalid.`);
      }
      const target = safeProjectPath(relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      const temporaryPath = `${target}.icon-studio-${process.pid}.tmp`;
      await writeFile(temporaryPath, data);
      stagedFiles.push({ temporaryPath, target });
    }

    const backgroundPath = safeProjectPath('android/app/src/main/res/values/ic_launcher_background.xml');
    const backgroundXml = await readFile(backgroundPath, 'utf8');
    if (!backgroundXml.includes('<color name="ic_launcher_background">')) {
      throw new Error('Could not find the Android launcher background color resource.');
    }
    const updatedBackgroundXml = backgroundXml.replace(
      /<color name="ic_launcher_background">#[0-9a-f]{6}<\/color>/i,
      `<color name="ic_launcher_background">${payload.background.toUpperCase()}</color>`
    );
    if (updatedBackgroundXml === backgroundXml && !backgroundXml.includes(payload.background.toUpperCase())) {
      throw new Error('Could not update the Android launcher background color.');
    }
    const stagedBackground = `${backgroundPath}.icon-studio-${process.pid}.tmp`;
    await writeFile(stagedBackground, updatedBackgroundXml);
    stagedFiles.push({ temporaryPath: stagedBackground, target: backgroundPath });

    for (const staged of stagedFiles) {
      await rename(staged.temporaryPath, staged.target);
    }
  } catch (error) {
    await Promise.all(stagedFiles.map(({ temporaryPath }) => rm(temporaryPath, { force: true })));
    throw error;
  }
}

function appendProcessOutput(job, chunk) {
  const output = chunk.toString();
  appendJobLog(job, output);
  process.stdout.write(output);
}

function runCommand(job, command, args, options) {
  appendJobLog(job, `\n> ${command} ${args.join(' ')}\n`);
  const child = spawn(command, args, {
    ...options,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', (chunk) => appendProcessOutput(job, chunk));
  child.stderr.on('data', (chunk) => appendProcessOutput(job, chunk));
  return new Promise((resolve, reject) => {
    child.on('error', (error) => reject(new Error(`Could not start ${command}: ${error.message}`)));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with code ${code}. Review the build log.`));
    });
  });
}

function getBuildEnvironment() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error('This Android build helper requires Windows with LOCALAPPDATA set.');
  }
  const androidBuildHome = path.join(localAppData, 'AndroidBuild');
  const jdkHome = process.env.NPL_ICON_STUDIO_JAVA_HOME
    || path.join(androidBuildHome, 'jdk-21.0.13+9');
  const sdkHome = path.join(localAppData, 'Android', 'Sdk');
  const javaExecutable = path.join(jdkHome, 'bin', 'java.exe');
  const gradleExecutable = path.join(androidBuildHome, 'NPLIconStudio', 'android', 'gradlew.bat');
  return { androidBuildHome, javaHome: jdkHome, sdkHome, gradleExecutable, javaExecutable };
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function prepareAndroidBuild(job, environment) {
  const studioRoot = path.join(environment.androidBuildHome, 'NPLIconStudio');
  const tempAndroid = path.join(studioRoot, 'android');
  const expectedAndroid = path.resolve(studioRoot, 'android');
  if (path.resolve(tempAndroid) !== expectedAndroid) {
    throw new Error('Refusing to prepare a build outside the icon studio folder.');
  }
  await rm(tempAndroid, { recursive: true, force: true });
  await mkdir(studioRoot, { recursive: true });

  const excludeGeneratedOutput = (source) => {
    const name = path.basename(source);
    return name !== 'build' && name !== '.gradle';
  };
  await cp(path.join(projectRoot, 'android'), tempAndroid, {
    recursive: true,
    filter: excludeGeneratedOutput
  });

  const capacitorAndroidSource = path.join(projectRoot, 'node_modules', '@capacitor', 'android');
  const capacitorAndroidTarget = path.join(studioRoot, 'node_modules', '@capacitor', 'android');
  if (!(await pathExists(capacitorAndroidSource))) {
    throw new Error('Capacitor Android files are missing. Run npm install and retry.');
  }
  await rm(capacitorAndroidTarget, { recursive: true, force: true });
  await mkdir(path.dirname(capacitorAndroidTarget), { recursive: true });
  await cp(capacitorAndroidSource, capacitorAndroidTarget, {
    recursive: true,
    filter: excludeGeneratedOutput
  });

  const tempGradleExecutable = path.join(tempAndroid, 'gradlew.bat');
  if (!(await pathExists(tempGradleExecutable))) {
    throw new Error('The Android Gradle wrapper is missing from the project.');
  }
  if (!(await pathExists(environment.javaExecutable || path.join(environment.javaHome, 'bin', 'java.exe')))) {
    const systemJavaHome = process.env.JAVA_HOME;
    if (systemJavaHome && await pathExists(path.join(systemJavaHome, 'bin', 'java.exe'))) {
      environment.javaHome = systemJavaHome;
    } else {
      throw new Error('JDK 21 was not found. Install JDK 21 or set NPL_ICON_STUDIO_JAVA_HOME, then restart the icon studio.');
    }
  }
  if (!(await pathExists(path.join(environment.sdkHome, 'platform-tools', 'adb.exe')))) {
    throw new Error('The Android SDK was not found. Check that it is installed at %LOCALAPPDATA%\\Android\\Sdk.');
  }
  return { studioRoot, tempAndroid, tempGradleExecutable };
}

async function buildAndDeploy(job) {
  job.status = 'running';
  try {
    appendJobLog(job, 'Applying the approved icon to the Android project and website favicon…\n');
    const environment = getBuildEnvironment();
    const build = await prepareAndroidBuild(job, environment);
    appendJobLog(job, '\nBuilding the Android APK…\n');

    const gradleEnvironment = {
      ...process.env,
      JAVA_HOME: environment.javaHome,
      ANDROID_HOME: environment.sdkHome,
      ANDROID_SDK_ROOT: environment.sdkHome,
      PATH: `${path.join(environment.javaHome, 'bin')};${path.join(environment.sdkHome, 'platform-tools')};${process.env.PATH || ''}`
    };
    const comSpec = process.env.ComSpec || 'cmd.exe';
    await runCommand(
      job,
      comSpec,
      ['/d', '/s', '/c', `"${build.tempGradleExecutable}" assembleDebug --no-daemon --no-build-cache`],
      { cwd: build.tempAndroid, env: gradleEnvironment }
    );

    const builtApk = path.join(build.tempAndroid, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    const publishedApk = safeProjectPath('public/downloads/npl-android.apk');
    if (!(await pathExists(builtApk))) {
      throw new Error('The Android build completed without producing the expected APK.');
    }
    await mkdir(path.dirname(publishedApk), { recursive: true });
    await writeFile(publishedApk, await readFile(builtApk));
    appendJobLog(job, '\nAPK built. Deploying the website, favicon, and APK to Cloudflare Pages…\n');

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await runCommand(
      job,
      process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npmCommand,
      process.platform === 'win32'
        ? ['/d', '/s', '/c', '"npm.cmd" run deploy:cloudflare']
        : ['run', 'deploy:cloudflare'],
      { cwd: projectRoot, env: process.env }
    );
    job.status = 'succeeded';
    appendJobLog(job, '\nSuccess. Download the updated app from https://narua-premier-league.pages.dev/downloads/npl-android.apk\n');
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    appendJobLog(job, `\nERROR: ${error.message}\n`);
    console.error('NPL app icon build and deploy failed:', error);
  }
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${host}:${port}`);
    if (request.method === 'GET' && requestUrl.pathname === '/') {
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer'
      });
      response.end(studioHtml);
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/status') {
      const capacitorConfig = JSON.parse(await readFile(safeProjectPath('capacitor.config.json'), 'utf8'));
      jsonResponse(response, 200, {
        appName: capacitorConfig.appName,
        publishingOrigin: capacitorConfig.server?.url || null
      });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname.startsWith('/api/jobs/')) {
      const jobId = requestUrl.pathname.slice('/api/jobs/'.length);
      const job = jobs.get(jobId);
      if (!job) {
        jsonResponse(response, 404, { error: 'This build job was not found. Restart the app icon studio and try again.' });
        return;
      }
      jsonResponse(response, 200, {
        status: job.status,
        logs: job.logs,
        error: job.error || null
      });
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/publish') {
      if (request.headers.origin !== `http://${host}:${port}`) {
        jsonResponse(response, 403, { error: 'Requests must come from this local icon studio page.' });
        return;
      }
      if ([...jobs.values()].some((job) => job.status === 'running')) {
        jsonResponse(response, 409, { error: 'An icon build is already running. Wait for it to finish first.' });
        return;
      }

      let payload;
      try {
        payload = JSON.parse(await readRequestBody(request));
      } catch (error) {
        jsonResponse(response, 400, { error: error.message === 'Unexpected end of JSON input' ? 'The icon upload was incomplete. Try again.' : error.message });
        return;
      }
      await applyIconAssets(payload);
      const jobId = crypto.randomUUID();
      const job = { status: 'queued', logs: '', error: null };
      jobs.set(jobId, job);
      void buildAndDeploy(job);
      jsonResponse(response, 202, { jobId });
      return;
    }

    jsonResponse(response, 404, { error: 'Not found.' });
  } catch (error) {
    console.error('NPL app icon studio request failed:', error);
    jsonResponse(response, 500, { error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`NPL App Icon Studio is ready at http://${host}:${port}`);
  console.log('Choose and preview logo photos in your browser. The production deployment happens only after you approve it.');
  console.log('Keep this terminal open while the APK builds and deploys. Press Ctrl+C to stop.');
});
