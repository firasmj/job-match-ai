const fs = require("fs");
const mammoth = require('mammoth');

const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const extractTextFromDOCX = async (fileUri: string): Promise<string | null> => {
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