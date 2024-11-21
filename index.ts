import { fontSplit } from 'cn-font-split';
import 'dotenv/config'
import * as fs from 'node:fs';
import * as path from 'node:path';

const base_url = process.env.BASE_URL;
const input = process.argv[2] || 'fonts';
const output = process.argv[3] || 'dist';

const CssFileName = 'result';
const PreviewImageText = '';
const PreviewImageName = 'preview';
const ReporterName = 'reporter';

// Function to get all font files recursively
function getFontFiles(input: string, output: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(input);
    
    // Get existing output directories
    const existingOutputDirs = new Set(
        fs.existsSync(output) 
            ? fs.readdirSync(output, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
            : []
    );
    
    for (const item of items) {
        const fullPath = path.format({ dir: '.', base: path.join(input, item) });
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...getFontFiles(fullPath, output));
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (ext === '.ttf' || ext === '.otf') {
                // Check if output directory already exists for this font
                const fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
                if (!existingOutputDirs.has(fontBaseName)) {
                    files.push(fullPath);
                } else {
                    console.log(`Skipping ${fullPath} as output already exists`);
                }
            }
        }
    }
    
    return files;
}
interface Result {
  path: string;
  reporter: string;
  css: string;
  img: string;
}
function getResultFiles(dir: string, reporterName: string = 'reporter', cssFileName: string = 'result', previewImageName: string = 'preview'): Result[] {
  const files: Result[] = [];
  const items = fs.readdirSync(dir);
  const res: Result = {path: `/${dir.split('/').slice(2).join('/')}`, reporter: '', css: '', img: ''};
  
  for (const item of items) {
      const fullPath = path.format({ dir: '.', base: path.join(dir, item) });
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
          files.push(...getResultFiles(fullPath, reporterName, cssFileName));
      } else {
          const ext = path.extname(fullPath).toLowerCase();
          if (ext === '.json') {
              const fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
              if (fontBaseName === reporterName) {
                res.reporter = fullPath;
              }
          }
          else if (ext === '.css') {
              const fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
              if (fontBaseName === cssFileName) {
                res.css = `${base_url}/${fullPath.split('/').slice(2).join('/')}`;
              }
          }
          else if (ext === '.svg') {
              const fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
              if (fontBaseName === previewImageName) {
                res.img = `${base_url}/${fullPath.split('/').slice(2).join('/')}`;
              }
          }
          if (res.reporter && res.css && res.img) {
            files.push(res);
            break;
          }
      }
  }

  return files;
}

// Function to create output directory name
function createOutputDirName(fontPath: string): string {
    const basename = path.basename(fontPath, path.extname(fontPath));
    return basename.replace(/\s+/g, '+');
}

// Process all font files
async function processAllFonts(input: string = 'fonts', output: string = 'dist') {
    const fontFiles = getFontFiles(input, output);
    
    for (const fontFile of fontFiles) {
        const outDirName = createOutputDirName(fontFile);
        const outDir = path.format({ dir: '.', base: path.join(output, outDirName) });
        
        console.log(`Processing: ${fontFile}`);
        console.log(`Output directory: ${outDir}`);
        
        try {
            await fontSplit({
                input: fontFile,
                outDir: outDir,
                chunkSize: 60 * 1024,
                testHTML: true,
                reporter: true,
                cssFileName: CssFileName,
                previewImage: {
                  text: PreviewImageText,
                  name: PreviewImageName
                },
                renameOutputFont: '[hash:10][ext]'
            });
            console.log(`Successfully processed: ${fontFile}`);
        } catch (error) {
            console.error(`Error processing ${fontFile}:`, error);
        }
    }
}

// 遍历 dist 目录及子目录下面的 reporter.json result.css 文件，获取 json 里面的 .message
function getReportMessage(dir: string = 'dist') {
    const fontFamilyArr: any[] = [];
    const displayObjArr: any[] = [];
    const results: { fontFamily: any[]; display: any[] } = {fontFamily: [], display: []};
    const files = getResultFiles(dir, ReporterName, CssFileName, PreviewImageName);
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(file.reporter, 'utf8'));
      const message = data.message.windows || data.message.macintosh;
      const fontFamily = message.fontFamily.zh || message.fontFamily.en;
      const fontFamilyObj = { name: fontFamily, value: message.fontFamily.en };
      const displayObj = { name: fontFamily, value: message.fontFamily.en, css: file.css, img: file.img, path: file.path };
      fontFamilyArr.push(fontFamilyObj);
      displayObjArr.push(displayObj);
    }
    results.fontFamily = fontFamilyArr;
    results.display = displayObjArr;
    console.log(results);
    const filePath = path.format({ dir: '.', base: path.join(dir, 'fonts.json') });
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return fontFamilyArr;
}

function copyTemplate() {
    const template = path.join(__dirname, 'template.html');
    const distPath = path.join(__dirname, 'dist');
    fs.copyFileSync(template, path.join(distPath, 'index.html'));
}

// Create dist directory if it doesn't exist
if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
}

// Run the processing
processAllFonts(input, output)
.then(() => {
  getReportMessage(output);
  copyTemplate();
})
.catch(console.error);
