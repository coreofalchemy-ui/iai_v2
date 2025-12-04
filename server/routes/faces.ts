import express, { Request, Response } from 'express';
import { listFiles, getPublicUrl } from '../gcsClient.js';

const router = express.Router();

interface FaceImage {
    filename: string;
    publicUrl: string;
    gender: 'm' | 'w';
}

/**
 * GET /api/faces?gender=m|w
 * Returns list of all face images for specified gender
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const gender = req.query.gender as string;

        // Validate gender parameter
        if (!gender || (gender !== 'm' && gender !== 'w')) {
            return res.status(400).json({
                error: 'Invalid gender parameter. Must be "m" or "w"',
            });
        }

        // Determine folder prefix
        const folderPrefix = gender === 'm' ? 'facesm/' : 'facesw/';

        // List all files in the folder
        const files = await listFiles(folderPrefix);

        // Map to FaceImage format
        const faceImages: FaceImage[] = files.map(filename => ({
            filename: filename.replace(folderPrefix, ''),
            publicUrl: getPublicUrl(filename),
            gender: gender as 'm' | 'w',
        }));

        res.json(faceImages);
    } catch (error) {
        console.error('Error fetching faces:', error);
        res.status(500).json({
            error: 'Failed to fetch face images',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/faces/random?gender=m|w&wanted=5
 * Returns random selection of face images
 */
router.get('/random', async (req: Request, res: Response) => {
    try {
        const gender = req.query.gender as string;
        const wanted = parseInt(req.query.wanted as string) || 5;

        // Validate parameters
        if (!gender || (gender !== 'm' && gender !== 'w')) {
            return res.status(400).json({
                error: 'Invalid gender parameter. Must be "m" or "w"',
            });
        }

        if (wanted < 1 || wanted > 50) {
            return res.status(400).json({
                error: 'Invalid wanted parameter. Must be between 1 and 50',
            });
        }

        // Determine folder prefix
        const folderPrefix = gender === 'm' ? 'facesm/' : 'facesw/';

        // List all files in the folder
        const files = await listFiles(folderPrefix);

        // Randomly select files
        const shuffled = files.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(wanted, files.length));

        // Map to FaceImage format
        const faceImages: FaceImage[] = selected.map(filename => ({
            filename: filename.replace(folderPrefix, ''),
            publicUrl: getPublicUrl(filename),
            gender: gender as 'm' | 'w',
        }));

        res.json(faceImages);
    } catch (error) {
        console.error('Error fetching random faces:', error);
        res.status(500).json({
            error: 'Failed to fetch random face images',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
