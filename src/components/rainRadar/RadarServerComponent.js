import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../LoadingSpinner';
import ErrorComponent from '../ErrorComponent';
import { generateRadarFrameTimestamps } from '@/lib/fmiQueryData';
import { sendTimestampsToAPI } from '@/lib/radarImageUtils/sendTimestampsToAPI';
import { sendTimestampsToBlobAPI } from '@/lib/radarImageUtils/sendTimestampsToBlobAPI';

const RadarClientComponent = dynamic(() => import('./RadarClientComponent'), {
    ssr: false,
});
const isDeploymentApi = process.env.NEXT_PUBLIC_USE_DEPLOY_API === 'true';

export default function RadarServerComponent() {
    const [imagePaths, setImagePaths] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchRadarImages = async () => {
            setError(false);
            const newTimestamps = generateRadarFrameTimestamps(12);

            try {
                setIsLoading(true);
                if (!isDeploymentApi) {
                    const paths = await sendTimestampsToAPI(newTimestamps);
                    setImagePaths(paths);
                    setIsLoading(false);
                } else {
                    const paths = await sendTimestampsToBlobAPI(newTimestamps);
                    setImagePaths(paths);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Error fetching radar images: ', err);
                setError(true);
                setIsLoading(false);
            }
        };

        fetchRadarImages();
        const intervalId = setInterval(fetchRadarImages, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Function to trigger blob deletion every hour
    const deleteOldBlobs = async () => {
        try {
            const response = await fetch('/api/deleteBlobs', {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error('Failed to delete old blobs.');
            } else {
                console.log('Old blobs deleted successfully.');
            }
        } catch (error) {
            console.error('Error deleting old blobs:', error);
        }
    };

    // Call the blob deletion function every hour
    useEffect(() => {
        deleteOldBlobs(); // Call it on initial load

        const deleteInterval = setInterval(
            () => {
                deleteOldBlobs();
            },
            60 * 60 * 1000
        ); // Run every hour

        return () => clearInterval(deleteInterval); // Clean up the interval on unmount
    }, []);

    if (!imagePaths || isLoading) {
        return <LoadingSpinner />; // Show loading spinner while fetching
    }

    if (error) {
        return <ErrorComponent message={error.message} />; // Show error component if there's an error
    }

    // Pass imagePaths to the RadarClientComponent
    return (
        <div>
            <RadarClientComponent data={imagePaths} />

            <div className="flex justify-between items-end text-xs">
                <p className="text-gray-400">Rain Radar</p>
                <p className="text-gray-400">
                    Rain radar Images from:{' '}
                    <a
                        href="https://en.ilmatieteenlaitos.fi/open-data"
                        className="text-blue-400"
                    >
                        FMIOpenData
                    </a>
                    ,{' '}
                    <a
                        href="https://creativecommons.org/licenses/by/4.0/"
                        className="text-blue-400"
                    >
                        CC BY 4.0
                    </a>
                </p>
            </div>
        </div>
    );
}
