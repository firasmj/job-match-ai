import express from "express";
import multer from "multer";
import apiRoutes from './api/routes';

const app = express();

app.use(express.json());

// Allow origin
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Error handling middleware for multer
app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ error: `File upload error: ${error.message}` });
    }

    if (error.message === 'Invalid file type. Only docx and pdf are allowed.') {
        return res.status(400).json({ error: error.message });
    }

    next(error);
});

app.use('/api', apiRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});