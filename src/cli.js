#!/usr/bin/env node

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const program = require('caporal');
const spawn = require('react-dev-utils/crossSpawn');

const path = require('path');
const { readFileOrEmpty, parseOrFalse } = require('./lib/util');

const pkgFile = path.join(__dirname, '../package.json');
const pkgJson = parseOrFalse(readFileOrEmpty(pkgFile));

// ref: https://www.sitepoint.com/scaffolding-tool-caporal-js/
// bar.tick();};

const actionCreate = require('./scripts/create/');

const CMD_LIST = ['install', 'build', 'dev', 'test'];

const spawnCommand = scriptName => {
  // 获取参数
  const args = process.argv.slice(2);
  const scriptIndex = args.findIndex(x => !!~CMD_LIST.indexOf(x));
  const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

  if (scriptIndex === -1) {
    console.log('Unknown script "' + scriptName + '".');
    console.log('Perhaps you need to update ide-cli?');
    console.log(
      'See: https://facebook.github.io/create-react-app/docs/updating-to-new-releases'
    );
    return;
  }

  // 调用指定的脚本
  const result = spawn.sync(
    'node',
    nodeArgs
      .concat(require.resolve(`./scripts/${scriptName}/`))
      .concat(args.slice(scriptIndex + 1)),
    { stdio: 'inherit' }
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.'
      );
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.'
      );
    }
    process.exit(1);
  }
  process.exit(result.status);
};

program
  .version(pkgJson.version || 'unknown')
  .description(pkgJson.description || 'ide 命令行工具')
  .command('create', 'Create new compoent - 创建新的 ide 模块')
  .argument('<jsonfile>', 'config json file - json 格式的配置文件')
  .option(
    '-l, --local',
    'not git clone repository - 不从远程拉取仓库（方便本地调试）'
  )
  .action(actionCreate)
  .command('install', 'Install dependencies & devDependencies - 安装依赖')
  .action(() => {
    spawnCommand('install');
  })
  .command('dev', 'Start developing - 本地调试开发')
  .option('-p, --port', 'custom port - 指定调试服务器的端口（默认是 9000）')
  .action(() => {
    spawnCommand('dev');
  })
  .command('build', 'Build  - 打包构建')
  .action(() => {
    spawnCommand('build');
  });

program.parse(process.argv);
