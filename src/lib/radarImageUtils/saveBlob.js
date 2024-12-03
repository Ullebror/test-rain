import { list, put } from '@vercel/blob';

export const saveImageToBlob = async (url, timestamp) => {
    console.log('Timestamp from input: ', timestamp);
    console.log('URL from input: ', url);
    const formattedTimestamp = timestamp.replace(/[:?&/\\]/g, '-');
    const fileName = `radar-image-${formattedTimestamp}.png`;
    console.log('fileName: ', fileName);

    const blobExistsUrl = await doesBlobExist(fileName);
    if (blobExistsUrl) {
        console.log('Image already exists at:', blobExistsUrl);
        return blobExistsUrl;
    }

    try {
        console.log(`Fetching image from: ${url}`);
        const res = await fetch(encodeURI(url), {
            method: 'GET',
            headers: {
                Accept: 'image/png',
            },
        });

        if (!res.ok) {
            throw new Error(
                `Failed to fetch image from ${url}: ${res.statusText} (Status: ${res.status})`
            );
        }

        console.log('Response Content-Type:', res.headers.get('Content-Type'));

        const arrayBuffer = await res.arrayBuffer();
        console.log('ArrayBuffer length:', arrayBuffer.byteLength);

        const buffer = Buffer.from(arrayBuffer);
        const blob = new Blob([buffer], { type: 'image/png' });
        console.log('blob:', blob);

        const blobResult = await put(fileName, blob, {
            access: 'public',
            contentType: 'image/png',
        });
        console.log('Blob result from put: ', blobResult);

        console.log(`Image saved to: ${blobResult.url}`);
        return blobResult.url;
    } catch (error) {
        throw new Error(`Error saving image to blob: ${error.message}`);
    }
};

async function doesBlobExist(fileName) {
    try {
        let cursor = null;
        do {
            const response = await list({ cursor });
            const blobs = response.blobs || [];
            const foundBlob = blobs.find(
                (blob) => blob.pathname === `/${fileName}`
            );
            if (foundBlob) {
                return foundBlob.url; // Return the full URL
            }
            cursor = response.cursor;
        } while (cursor); // Continue until no more pages

        return null; // Return null if the blob does not exist
    } catch (error) {
        console.error('Error checking blob existence:', error);
        return null; // Return null in case of an error
    }
}
