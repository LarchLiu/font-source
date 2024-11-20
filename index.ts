import { fontSplit } from 'cn-font-split';
import * as fs from 'node:fs';
import * as path from 'node:path';

const input = process.argv[2] || 'fonts';
const output = process.argv[3] || 'dist';

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
                const fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '_');
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

// Function to create output directory name
function createOutputDirName(fontPath: string): string {
    const basename = path.basename(fontPath, path.extname(fontPath));
    return basename.replace(/\s+/g, '_');
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
                previewImage: {},
                renameOutputFont: '[hash:10][ext]'
            });
            console.log(`Successfully processed: ${fontFile}`);
        } catch (error) {
            console.error(`Error processing ${fontFile}:`, error);
        }
    }
}

// 遍历 dist 目录及子目录下面的 reporter.json 文件，获取 json 里面的 .message
function getReportMessage(dir: string = 'dist') {
    const result: any[] = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.format({ dir: '.', base: path.join(dir, file.name) });
        if (file.isDirectory()) {
            const reporterFiles = (fs.readdirSync(filePath, { withFileTypes: true })).filter(f => f.isFile() && /\.json$/.test(f.name));
            for (const reporterFile of reporterFiles) {
                const reporterFilePath = path.format({ dir: '.', base: path.join(dir, file.name, reporterFile.name) });
                const data = JSON.parse(fs.readFileSync(reporterFilePath, 'utf8'));
                const message = data.message.windows || data.message.macintosh;
                const fontFamily = message.fontFamily.zh || message.fontFamily.en;
                const obj = { name: fontFamily, value: message.fontFamily.en };
                result.push(obj);
            }
        }
    }
    console.log(result);
    const filePath = path.format({ dir: '.', base: path.join(dir, 'fonts.json') });
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    return result;
}

// Create dist directory if it doesn't exist
if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
}
// else {
//     console.log('Deleting existing dist directory');
//     fs.rmSync(output, { recursive: true });
// }

// Run the processing
processAllFonts(input, output)
.then(() => {
  getReportMessage(output);
})
.catch(console.error);
// getReportMessage();
