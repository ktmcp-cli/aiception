import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured, getAllConfig } from './config.js';
import {
  analyzeImage,
  classifyImage,
  detectObjects,
  detectNudity,
  getTask,
  listTasks
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }
  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });
  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));
  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });
  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('AIception credentials not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  aiception config set --username YOUR_USERNAME --password YOUR_PASSWORD'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('aiception')
  .description(chalk.bold('AIception CLI') + ' - AI image recognition from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--username <user>', 'AIception API username')
  .option('--password <pass>', 'AIception API password')
  .action((options) => {
    let changed = false;
    if (options.username) {
      setConfig('username', options.username);
      printSuccess('Username set');
      changed = true;
    }
    if (options.password) {
      setConfig('password', options.password);
      printSuccess('Password set');
      changed = true;
    }
    if (!changed) {
      printError('No options provided. Use --username and/or --password');
    }
  });

configCmd
  .command('get')
  .description('Get a configuration value')
  .argument('<key>', 'Config key to retrieve')
  .action((key) => {
    const value = getConfig(key);
    if (value === undefined || value === null || value === '') {
      console.log(chalk.yellow(`${key}: not set`));
    } else {
      const masked = key.toLowerCase().includes('pass') ? '*'.repeat(8) : value;
      console.log(`${key}: ${chalk.green(masked)}`);
    }
  });

configCmd
  .command('list')
  .description('List all configuration values')
  .action(() => {
    const all = getAllConfig();
    console.log(chalk.bold('\nAIception CLI Configuration\n'));
    console.log('Username:', all.username ? chalk.green(all.username) : chalk.red('not set'));
    console.log('Password:', all.password ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// IMAGES
// ============================================================

const imagesCmd = program.command('images').description('Image analysis and recognition');

imagesCmd
  .command('analyze <url>')
  .description('Analyze an image and get a description of its content')
  .option('--json', 'Output as JSON')
  .action(async (url, options) => {
    requireAuth();
    try {
      const result = await withSpinner('Analyzing image...', () => analyzeImage(url));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nImage Analysis\n'));
      console.log('Image URL:', chalk.cyan(url));
      if (result.task_id || result.id) {
        console.log('Task ID:  ', chalk.yellow(result.task_id || result.id));
        console.log('Status:   ', result.status || 'processing');
        console.log('\nNote: Use', chalk.cyan(`aiception tasks get ${result.task_id || result.id}`), 'to retrieve results');
      } else if (result.result || result.description) {
        console.log('Result:   ', result.result || result.description);
      } else {
        printJson(result);
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

imagesCmd
  .command('classify <url>')
  .description('Classify an image into categories')
  .option('--json', 'Output as JSON')
  .action(async (url, options) => {
    requireAuth();
    try {
      const result = await withSpinner('Classifying image...', () => classifyImage(url));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nImage Classification\n'));
      console.log('Image URL:', chalk.cyan(url));
      if (result.task_id || result.id) {
        console.log('Task ID:  ', chalk.yellow(result.task_id || result.id));
        console.log('Status:   ', result.status || 'processing');
        console.log('\nNote: Use', chalk.cyan(`aiception tasks get ${result.task_id || result.id}`), 'to retrieve results');
      } else if (result.predictions || result.classes) {
        const preds = result.predictions || result.classes || [];
        const rows = Array.isArray(preds) ? preds : Object.entries(preds).map(([k, v]) => ({ label: k, confidence: v }));
        printTable(rows, [
          { key: 'label', label: 'Class' },
          { key: 'confidence', label: 'Confidence', format: (v) => v !== undefined ? `${(parseFloat(v) * 100).toFixed(1)}%` : 'N/A' }
        ]);
      } else {
        printJson(result);
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

imagesCmd
  .command('detect-objects <url>')
  .description('Detect and locate objects within an image')
  .option('--json', 'Output as JSON')
  .action(async (url, options) => {
    requireAuth();
    try {
      const result = await withSpinner('Detecting objects...', () => detectObjects(url));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nObject Detection\n'));
      console.log('Image URL:', chalk.cyan(url));
      if (result.task_id || result.id) {
        console.log('Task ID:  ', chalk.yellow(result.task_id || result.id));
        console.log('Status:   ', result.status || 'processing');
        console.log('\nNote: Use', chalk.cyan(`aiception tasks get ${result.task_id || result.id}`), 'to retrieve results');
      } else if (result.objects || result.detections) {
        const objects = result.objects || result.detections || [];
        printTable(objects, [
          { key: 'label', label: 'Object' },
          { key: 'confidence', label: 'Confidence', format: (v) => v !== undefined ? `${(parseFloat(v) * 100).toFixed(1)}%` : 'N/A' },
          { key: 'bbox', label: 'Bounding Box', format: (v) => v ? JSON.stringify(v) : 'N/A' }
        ]);
      } else {
        printJson(result);
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// TASKS
// ============================================================

const tasksCmd = program.command('tasks').description('Manage async processing tasks');

tasksCmd
  .command('get <task-id>')
  .description('Get the result of an async processing task')
  .option('--json', 'Output as JSON')
  .action(async (taskId, options) => {
    requireAuth();
    try {
      const task = await withSpinner(`Fetching task ${taskId}...`, () => getTask(taskId));
      if (options.json) { printJson(task); return; }
      console.log(chalk.bold('\nTask Details\n'));
      console.log('Task ID:   ', chalk.cyan(taskId));
      console.log('Status:    ', task.status === 'completed' ? chalk.green(task.status) : chalk.yellow(task.status || 'unknown'));
      if (task.result) {
        console.log('Result:    ', JSON.stringify(task.result, null, 2));
      }
      if (task.created_at) console.log('Created:   ', task.created_at);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

tasksCmd
  .command('list')
  .description('List recent processing tasks')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const tasks = await withSpinner('Fetching tasks...', () => listTasks());
      if (options.json) { printJson(tasks); return; }
      const list = Array.isArray(tasks) ? tasks : (tasks?.tasks || tasks?.data || []);
      printTable(list, [
        { key: 'id', label: 'Task ID' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// NUDITY
// ============================================================

const nudityCmd = program.command('nudity').description('Nudity detection in images');

nudityCmd
  .command('detect <url>')
  .description('Detect nudity content in an image')
  .option('--json', 'Output as JSON')
  .action(async (url, options) => {
    requireAuth();
    try {
      const result = await withSpinner('Analyzing image for nudity...', () => detectNudity(url));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nNudity Detection Result\n'));
      console.log('Image URL:', chalk.cyan(url));
      if (result.task_id || result.id) {
        console.log('Task ID:  ', chalk.yellow(result.task_id || result.id));
        console.log('Status:   ', result.status || 'processing');
        console.log('\nNote: Use', chalk.cyan(`aiception tasks get ${result.task_id || result.id}`), 'to retrieve results');
      } else {
        const hasNudity = result.nude ?? result.has_nudity ?? false;
        const confidence = result.confidence ?? result.score ?? 'N/A';
        console.log('Contains Nudity:', hasNudity ? chalk.red('Yes') : chalk.green('No'));
        console.log('Confidence:     ', confidence !== 'N/A' ? `${(parseFloat(confidence) * 100).toFixed(1)}%` : 'N/A');
        if (result.raw) console.log('Raw Score:      ', result.raw);
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
