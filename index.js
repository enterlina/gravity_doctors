#!/usr/bin/env node

import { Command } from 'commander';
import Parser from 'rss-parser';
import chalk from 'chalk';

// Initialize CLI commander
const program = new Command();
const parser = new Parser();

program
  .name('google-news')
  .description('Fetch and display the latest stories from Google News')
  .version('1.0.0')
  .option('-s, --search <query>', 'search for specific news topics')
  .option('-l, --limit <number>', 'limit the number of articles displayed', parseInt, 10)
  .option('--no-color', 'disable colored output')
  .parse(process.argv);

const options = program.opts();

// Construct target RSS URL
let rssUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
let headingText = 'Top Stories';

if (options.search) {
  const encodedQuery = encodeURIComponent(options.search);
  rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
  headingText = `Search Results for "${options.search}"`;
}

console.log(chalk.blue.bold('\n┌────────────────────────────────────────────────────────┐'));
console.log(chalk.blue.bold(`│ Fetching Google News: ${headingText.padEnd(31)} │`));
console.log(chalk.blue.bold('└────────────────────────────────────────────────────────┘\n'));

async function fetchNews() {
  try {
    const feed = await parser.parseURL(rssUrl);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(chalk.yellow('No articles found.'));
      return;
    }

    const itemsToDisplay = feed.items.slice(0, options.limit);

    itemsToDisplay.forEach((item, index) => {
      // Google News titles are typically in the format: "Story Title - Publisher"
      // Let's attempt to separate the title and the source for better aesthetics
      let title = item.title || 'No Title';
      let source = 'Google News';
      
      const lastDashIndex = title.lastIndexOf(' - ');
      if (lastDashIndex !== -1) {
        source = title.substring(lastDashIndex + 3).trim();
        title = title.substring(0, lastDashIndex).trim();
      }

      // Format date
      let formattedDate = '';
      if (item.pubDate) {
        try {
          const date = new Date(item.pubDate);
          formattedDate = date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          formattedDate = item.pubDate;
        }
      }

      // Display the story
      const indexNum = chalk.dim(`[${index + 1}]`);
      console.log(`${indexNum} ${chalk.white.bold(title)}`);
      console.log(`    ${chalk.green(source)} ${chalk.dim('•')} ${chalk.gray(formattedDate)}`);
      if (item.link) {
        console.log(`    ${chalk.cyan.underline(item.link)}`);
      }
      console.log(); // blank line between stories
    });

    console.log(chalk.dim(`Showing ${itemsToDisplay.length} of ${feed.items.length} stories.\n`));

  } catch (error) {
    console.error(chalk.red.bold('\nError fetching news from Google:'));
    console.error(chalk.red(error.message));
    console.log();
    process.exit(1);
  }
}

fetchNews();
