"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cn_font_split_1 = require("cn-font-split");
require("dotenv/config");
var fs = require("node:fs");
var path = require("node:path");
var base_url = process.env.BASE_URL;
var input = process.argv[2] || 'fonts';
var output = process.argv[3] || 'dist';
var CssFileName = 'result';
var PreviewImageText = '';
var PreviewImageName = 'preview';
var ReporterName = 'reporter';
// Function to get all font files recursively
function getFontFiles(input, output) {
    var files = [];
    var items = fs.readdirSync(input);
    // Get existing output directories
    var existingOutputDirs = new Set(fs.existsSync(output)
        ? fs.readdirSync(output, { withFileTypes: true })
            .filter(function (dirent) { return dirent.isDirectory(); })
            .map(function (dirent) { return dirent.name; })
        : []);
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        var fullPath = path.format({ dir: '.', base: path.join(input, item) });
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push.apply(files, getFontFiles(fullPath, output));
        }
        else {
            var ext = path.extname(fullPath).toLowerCase();
            if (ext === '.ttf' || ext === '.otf') {
                // Check if output directory already exists for this font
                var fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
                if (!existingOutputDirs.has(fontBaseName)) {
                    files.push(fullPath);
                }
                else {
                    console.log("Skipping ".concat(fullPath, " as output already exists"));
                }
            }
        }
    }
    return files;
}
function getResultFiles(dir, reporterName, cssFileName, previewImageName) {
    if (reporterName === void 0) { reporterName = 'reporter'; }
    if (cssFileName === void 0) { cssFileName = 'result'; }
    if (previewImageName === void 0) { previewImageName = 'preview'; }
    var files = [];
    var items = fs.readdirSync(dir);
    var res = { path: "/".concat(dir.split('/').slice(2).join('/')), reporter: '', css: '', img: '' };
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        var fullPath = path.format({ dir: '.', base: path.join(dir, item) });
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push.apply(files, getResultFiles(fullPath, reporterName, cssFileName));
        }
        else {
            var ext = path.extname(fullPath).toLowerCase();
            if (ext === '.json') {
                var fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
                if (fontBaseName === reporterName) {
                    res.reporter = fullPath;
                }
            }
            else if (ext === '.css') {
                var fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
                if (fontBaseName === cssFileName) {
                    res.css = "".concat(base_url, "/").concat(fullPath.split('/').slice(2).join('/'));
                }
            }
            else if (ext === '.svg') {
                var fontBaseName = path.basename(fullPath, ext).replace(/\s+/g, '+');
                if (fontBaseName === previewImageName) {
                    res.img = "".concat(base_url, "/").concat(fullPath.split('/').slice(2).join('/'));
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
function createOutputDirName(fontPath) {
    var basename = path.basename(fontPath, path.extname(fontPath));
    return basename.replace(/\s+/g, '+');
}
// Process all font files
function processAllFonts() {
    return __awaiter(this, arguments, void 0, function (input, output) {
        var fontFiles, _i, fontFiles_1, fontFile, outDirName, outDir, error_1;
        if (input === void 0) { input = 'fonts'; }
        if (output === void 0) { output = 'dist'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fontFiles = getFontFiles(input, output);
                    _i = 0, fontFiles_1 = fontFiles;
                    _a.label = 1;
                case 1:
                    if (!(_i < fontFiles_1.length)) return [3 /*break*/, 6];
                    fontFile = fontFiles_1[_i];
                    outDirName = createOutputDirName(fontFile);
                    outDir = path.format({ dir: '.', base: path.join(output, outDirName) });
                    console.log("Processing: ".concat(fontFile));
                    console.log("Output directory: ".concat(outDir));
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, cn_font_split_1.fontSplit)({
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
                        })];
                case 3:
                    _a.sent();
                    console.log("Successfully processed: ".concat(fontFile));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error processing ".concat(fontFile, ":"), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// 遍历 dist 目录及子目录下面的 reporter.json result.css 文件，获取 json 里面的 .message
function getReportMessage(dir) {
    if (dir === void 0) { dir = 'dist'; }
    var fontFamilyArr = [];
    var displayObjArr = [];
    var results = { fontFamily: [], display: [] };
    var files = getResultFiles(dir, ReporterName, CssFileName, PreviewImageName);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var data = JSON.parse(fs.readFileSync(file.reporter, 'utf8'));
        var message = data.message.windows || data.message.macintosh;
        var fontFamily = message.fontFamily.zh || message.fontFamily.en;
        var fontFamilyObj = { name: fontFamily, value: message.fontFamily.en };
        var displayObj = { name: fontFamily, value: message.fontFamily.en, css: file.css, img: file.img, path: file.path };
        fontFamilyArr.push(fontFamilyObj);
        displayObjArr.push(displayObj);
    }
    results.fontFamily = fontFamilyArr;
    results.display = displayObjArr;
    console.log(results);
    var filePath = path.format({ dir: '.', base: path.join(dir, 'fonts.json') });
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return fontFamilyArr;
}
function copyTemplate() {
    var template = path.join(__dirname, 'template.html');
    var distPath = path.join(__dirname, 'dist');
    fs.copyFileSync(template, path.join(distPath, 'index.html'));
}
// Create dist directory if it doesn't exist
if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
}
// Run the processing
processAllFonts(input, output)
    .then(function () {
    getReportMessage(output);
    copyTemplate();
})
    .catch(console.error);
