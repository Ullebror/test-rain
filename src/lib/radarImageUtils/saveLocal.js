import sharp from 'sharp';
import path from 'path';
import { promises as fsPromises } from 'fs';

const storageDir = path.join(process.cwd(), 'storage', 'radarImages');

const localUrl = '/api/getRadarImage?filename=';
/*const baseUrl =
    process.env.VERCEL_ENV === 'production'
        ? 'https://redstone-infoscreen.vercel.app'
        : `https://${process.env.VERCEL_URL}`;
// Adjust this to match your uploadBlob.js path
const uploadBlobUrl = `${baseUrl}/api/uploadBlob`; */

export const fetchAndSaveImage = async (url, timestamp) => {
    // Format timestamp to exclude unallowed characters
    const formattedTimestamp = timestamp.replace(/:/g, '-');
    const fileName = `radar-image-${formattedTimestamp}.png`;
    const savePath = path.join(storageDir, fileName);

    // Check if the image already exists
    const fileExists = await fsPromises
        .access(savePath)
        .then(() => true)
        .catch(() => false);
    if (fileExists) {
        return `${localUrl}${fileName}`;
    }

    try {
        // Fetch the image
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(
                `Failed to fetch image from ${url}: ${res.statusText} Status: ${res.status}`
            );
        }

        // Buffer the image data
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        //Saving locally

        //Process the image with Sharp
        const processedBuffer = await processImage(buffer);
        await fsPromises.writeFile(savePath, processedBuffer);
        return `${localUrl}${fileName}`;
    } catch (error) {
        throw new Error(error);
    }
};

//Image processing logic
const processImage = async (buffer) => {
    const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const outputData = Buffer.alloc(data.length);

    for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Change background color to transparent
        if (r === 204 && g === 204 && b === 204 && a < 255) {
            outputData[i] = r;
            outputData[i + 1] = g;
            outputData[i + 2] = b;
            outputData[i + 3] = 0;
        } else {
            outputData[i] = r;
            outputData[i + 1] = g;
            outputData[i + 2] = b;
            outputData[i + 3] = a;
        }
    }

    return sharp(outputData, { raw: { width, height, channels } })
        .png()
        .toBuffer();
};
