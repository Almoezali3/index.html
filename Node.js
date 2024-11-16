const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// API Key for OCR.space
const OCR_API_KEY = 'K88508569788957';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to upload image
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileSizeInBytes = fs.statSync(filePath).size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

        // Check if image size is larger than 1MB
        if (fileSizeInMB > 1) {
            fs.unlinkSync(filePath); // Delete file
            return res.status(400).json({ error: 'The image size exceeds 1MB. Please upload a smaller image.' });
        }

        // Send image to OCR.space API
        const formData = {
            apikey: OCR_API_KEY,
            language: 'eng',
            isOverlayRequired: false,
            file: fs.createReadStream(filePath),
        };

        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Delete uploaded image after processing
        fs.unlinkSync(filePath);

        // Return OCR result
        res.json(response.data);
    } catch (error) {
        console.error('Error processing image:', error.message);
        res.status(500).json({ error: 'An error occurred while processing the image.' });
    }
});

// Serve upload form for testing
app.get('/', (req, res) => {
    res.send(`
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="image" accept="image/*" required />
            <button type="submit">Upload and Process</button>
        </form>
    `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
