const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mammoth = require('mammoth');

const app = express();

const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const extractTextFromDOCX = async (fileUri: string): Promise<string | null> => {
    try {
        // Read the file as a base64 encoded string
        const base64Content = await fs.readAsStringAsync(fileUri, {
            encoding: fs.EncodingType.Base64,
        });

        // Convert base64 to Uint8Array
        const uint8Array = base64ToUint8Array(base64Content);
        // console.log('Uint8Array: ', uint8Array);

        // Pass Uint8Array to mammoth
        const result = await mammoth.extractRawText({ arrayBuffer: uint8Array.buffer });
        return result.value;
    } catch (error) {
        console.error('Error extracting DOCX content:', error);
        return null;
    }
};

const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 2,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only docx and pdf are allowed.'));
        }
    }
})

app.post('/upload', upload.single("document"), (req, res) => {
    try {

    } catch (error) {
        console.log(error);
    }
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("server listening on port: ", port);
});