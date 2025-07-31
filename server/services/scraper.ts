import { ScrapingConfig } from "@shared/schema";
import * as cheerio from "cheerio";

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  depth: number;
  category: string;
  links: string[];
  images: string[];
}


export class ScraperService {
  private readonly HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  };

  async scrapePage(url: string, depth: number, domain: string, category: string): Promise<ScrapedPage | null> {
    try {
      const response = await fetch(url, {
        headers: this.HEADERS,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, footer, nav, .advertisement, .ads').remove();

      // Extract main content
      const contentSelectors = [
        '#page-content',
        '.content',
        '.main-content',
        'main',
        'article',
        '.article-body',
        '.post-content'
      ];

      let contentElement = $('body');
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          contentElement = element;
          break;
        }
      }

      const title = $('title').text().trim() || url;
      const content = contentElement.text().replace(/\s+/g, ' ').trim();
      const wordCount = content.split(' ').length;

      // Extract links
      const links: string[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = new URL(href, url).href;
          if (fullUrl.includes(domain)) {
            links.push(fullUrl);
          }
        }
      });

      // Extract images
      const images: string[] = [];
      $('img[src]').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const fullUrl = new URL(src, url).href;
          images.push(fullUrl);
        }
      });

      return {
        url,
        title,
        content,
        wordCount,
        depth,
        category,
        links: [...new Set(links)],
        images: [...new Set(images)],
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  async extractCategories(baseUrl: string, domain: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(baseUrl, {
        headers: this.HEADERS,
        signal: AbortSignal.timeout(10000),
      });

      const html = await response.text();
      const $ = cheerio.load(html);

      const categories: Record<string, string> = {};
      const allLinks = new Set<[string, string]>();

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && text && !text.toLowerCase().startsWith('edit')) {
          const fullUrl = new URL(href, baseUrl).href;
          if (fullUrl.includes(domain)) {
            allLinks.add([text, fullUrl]);
          }
        }
      });

      Array.from(allLinks).forEach(([text, link]) => {
        const cleanText = this.sanitizeFilename(text) || 'misc';
        categories[cleanText] = link;
      });

      return categories;
    } catch (error) {
      console.error('Failed to extract categories:', error);
      return {};
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[\\/*?:"<>|]/g, '_');
  }

  getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  async *scrapeWebsite(config: ScrapingConfig, onProgress?: (progress: {
    url: string;
    status: 'success' | 'error';
    totalProcessed: number;
    message?: string;
  }) => void): AsyncGenerator<ScrapedPage> {
    const domain = this.getDomain(config.targetUrl);
    const seen = new Set<string>();
    const queue: Array<{ url: string; depth: number; category: string }> = [];
    
    // Extract categories first
    const categories = await this.extractCategories(config.targetUrl, domain);
    
    // Add initial URLs to queue
    Object.entries(categories).forEach(([category, url]) => {
      if (!seen.has(url)) {
        seen.add(url);
        queue.push({ url, depth: 0, category });
      }
    });

    let processed = 0;
    
    while (queue.length > 0) {
      const batch = queue.splice(0, config.maxWorkers);
      
      const promises = batch.map(async ({ url, depth, category }) => {
        try {
          // Add delay between requests
          if (config.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, config.delay));
          }

          const result = await this.scrapePage(url, depth, domain, category);
          
          if (result) {
            processed++;
            onProgress?.({
              url,
              status: 'success',
              totalProcessed: processed,
              message: `Found ${result.links.length} links, ${result.wordCount} words`,
            });

            // Add new links to queue if within depth limit
            if (depth < config.maxDepth) {
              result.links.forEach(link => {
                if (!seen.has(link)) {
                  seen.add(link);
                  queue.push({ url: link, depth: depth + 1, category });
                }
              });
            }

            return result;
          } else {
            processed++;
            onProgress?.({
              url,
              status: 'error',
              totalProcessed: processed,
              message: 'Failed to scrape page',
            });
            return null;
          }
        } catch (error) {
          processed++;
          onProgress?.({
            url,
            status: 'error',
            totalProcessed: processed,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          return null;
        }
      });

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result) {
          yield result;
        }
      }
    }
  }
}

export const scraperService = new ScraperService();
