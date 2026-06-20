import { chromium } from '/tmp/node_modules/playwright-core/index.mjs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'mobile-game-investment-report.html');
const pdfPath = resolve(__dirname, 'mobile-game-investment-report.pdf');

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
});

const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', bottom: '22mm', left: '25mm', right: '25mm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="width:100%; font-size:9pt; font-family:Segoe UI, sans-serif; color:#94A3B8; 
                padding:0 25mm; display:flex; justify-content:space-between;">
      <span>MOBİL OYUN YATIRIM RAPORU 2025</span>
      <span style="text-transform:lowercase;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `,
  preferCSSPageSize: true,
});

await browser.close();
console.log(`PDF generated: ${pdfPath}`);
