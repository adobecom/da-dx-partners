#!/usr/bin/env node

import { spawn } from 'child_process';
import playwrightConfig from '../../playwright.config.js';

function displayHelp() {
  console.log(`

\x1b[1m\x1b[37m## Nala command:\x1b[0m \x1b[1m\x1b[32mnpm run nala [env] [options]\x1b[0m

\x1b[1m1] Env:\x1b[0m [\x1b[32mlocal\x1b[0m | \x1b[32mlibs\x1b[0m | \x1b[32mstage\x1b[0m | \x1b[32metc\x1b[0m ] \x1b[3mdefault: local\x1b[0m

\x1b[1m2] Options:\x1b[0m

  \x1b[33m* browser=<chrome|firefox|webkit>\x1b[0m    Browser to use (default: chrome)
  \x1b[33m* device=<desktop|mobile>\x1b[0m            Device (default: desktop)
  \x1b[33m* test=<.test.js>\x1b[0m                    Test file to run (default: all tests)
  \x1b[33m* tag=<@tag>\x1b[0m                         Tags to filter tests by annotations ex: @test1 @accordion @marquee
  \x1b[33m* -g, --g=<@tag>\x1b[0m                     Tags to filter tests by annotations ex: @test1 @accordion @marquee
  \x1b[33m* mode=<headless|ui|debug|headed>\x1b[0m    Mode (default: headless)
  \x1b[33m* config=<config-file>\x1b[0m               Configuration file (default: Playwright default)
  \x1b[33m* project=<project-name>\x1b[0m             Project configuration (default: da-dx-partners-live-chromium)
  \x1b[33m* milolibs=<local|prod|code|feature>\x1b[0m Milo library environment (default: none)

\x1b[1mExamples:\x1b[0m
  | \x1b[36mCommand\x1b[0m                                                | \x1b[36mDescription\x1b[0m                                                                                   |
  |--------------------------------------------------------|-----------------------------------------------------------------------------------------------|
  | npm run nala local                                     | Runs all nala tests on local environment on chrome browser                                    |
  | npm run nala local accordion.test.js                   | Runs only accordion tests on local environment on chrome browser                              |
  | npm run nala local @accordion                          | Runs only accordion annotated/tagged tests on local environment on chrome browser             |
  | npm run nala local @accordion browser=firefox          | Runs only accordion annotated/tagged tests on local environment on firefox browser            |
  | npm run nala local mode=ui                             | Runs all nala tests on local environment in UI mode on chrome browser                         |
  | npm run nala local tags=@tag1,@tag2                    | Runs tests annotated with @tag1 and @tag2 on local environment on chrome browser              |         

\x1b[1mDebugging:\x1b[0m
-----------
  | \x1b[36mCommand\x1b[0m                                                | \x1b[36mDescription\x1b[0m                                                                                   |
  |--------------------------------------------------------|-----------------------------------------------------------------------------------------------|
  | npm run nala local @test1 mode=debug                   | Runs @test1 on local environment in debug mode                                 |

`);
}

function parseArgs(args) {
  const defaultParams = {
    env: 'local',
    browser: 'chromium',
    device: 'desktop',
    test: '',
    tag: '',
    mode: 'headless',
    config: '',
    project: 'all',
    milolibs: ''
  };

  const parsedParams = { ...defaultParams };

  args.forEach(arg => {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      parsedParams[key] = value;
    } else if (arg.startsWith('-g') || arg.startsWith('--g')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[args.indexOf(arg) + 1];
      parsedParams.tag = value;
    } else if (arg.startsWith('@')) {
      parsedParams.tag += parsedParams.tag ? ` ${arg.substring(1)}` : arg.substring(1);
    } else if (arg.endsWith('.test.js')) {
      parsedParams.test = arg;
    } else if (arg.endsWith('.config.js')) {
      parsedParams.config = arg;
    } else if (['ui', 'debug', 'headless', 'headed'].includes(arg)) {
      parsedParams.mode = arg;
    } else {
      parsedParams.env = arg;
    }
  });

  // Set the project if not provided
  if (!parsedParams.project) {
    parsedParams.project = 'all';
  }
  return parsedParams;
}

function getLocalTestLiveUrl(env, milolibs) {
  if (milolibs) {
    if (env === 'local') {
      return `http://127.0.0.1:3000/?milolibs=${milolibs}`;
    } else if (env === 'libs') {
      return `http://127.0.0.1:6456/?milolibs=${milolibs}`;
    } else {
      return `https://${env}--da-dx-partners--adobecom.aem.live/?milolibs=${milolibs}`;
    }
  } else {
    if (env === 'local') {
      return 'http://127.0.0.1:3000';
    } else if (env === 'libs') {
      return 'http://127.0.0.1:6456';
    } else if (env === 'partners.stage') {
      return 'https://partners.stage.adobe.com';
    } else if (env === 'partners') {
      return 'https://partners.adobe.com';
    } else {
      return `https://${env}--da-dx-partners--adobecom.aem.live`;
    }
  }
}

function buildPlaywrightCommand(parsedParams, localTestLiveUrl) {
  const { browser, device, test, tag, mode, config, project } = parsedParams;

  const envVariables = {
    ...process.env,
    BROWSER: browser,
    DEVICE: device,
    HEADLESS: mode === 'headless' || mode === 'headed' ? 'true' : 'false',
    LOCAL_TEST_LIVE_URL: localTestLiveUrl,
  };

  const command = 'npx playwright test';
  const options = [];

  if (test) {
    options.push(test);
  }

  if (project==='all') {
    const { projects } = playwrightConfig;
    projects.map(p => options.push(`--project=${p.name}`));
  } else {
    project.split(',').forEach((p) => {
      options.push(`--project=${p}`);
    });
  }
  options.push('--grep-invert nopr');

  if (tag) {
    options.push(`-g "${tag.replace(/,/g, ' ')}"`);
  }

  if (mode === 'ui' || mode === 'headed') {
    options.push('--headed');
  } else if (mode === 'debug') {
    options.push('--debug');
  }

  if (config) {
    options.push(`--config=${config}`);
  }

  return { finalCommand: `${command} ${options.join(' ')}`, envVariables };
}

function runNalaTest() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('help')) {
    displayHelp();
    process.exit(0);
  }

  const parsedParams = parseArgs(args);
  const localTestLiveUrl = getLocalTestLiveUrl(parsedParams.env, parsedParams.milolibs);
  const { finalCommand, envVariables } = buildPlaywrightCommand(parsedParams, localTestLiveUrl);

  console.log(`\n Executing nala run command: ${finalCommand}`);
  console.log(`\n Using URL: ${localTestLiveUrl}\n`);

  console.log(`\n\x1b[1m\x1b[33mExecuting nala run command:\x1b[0m \x1b[32m${finalCommand}\x1b[0m\n\x1b[1m\x1b[33mUsing URL:\x1b[0m \x1b[32m${localTestLiveUrl}\x1b[0m\n`);


  const testProcess = spawn(finalCommand, { stdio: 'inherit', shell: true, env: envVariables });

  testProcess.on('close', (code) => {
    console.log(`Playwright tests exited with code ${code}`);
    process.exit(code);
  });
}

if (import.meta.url === new URL(import.meta.url).href) {
  runNalaTest();
}

export {
  displayHelp,
  parseArgs,
  getLocalTestLiveUrl,
  buildPlaywrightCommand,
  runNalaTest
};
