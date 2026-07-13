document.addEventListener('DOMContentLoaded', async () => {
    const videoContainer = document.getElementById('video-container');
    const introVideo = document.getElementById('intro-video');
    const homePage = document.getElementById('home-page');

    let videoSources = [];
    let currentVideoIndex = 0;
    const cacheExpiryTime = 30 * 60 * 1000; // 30 minutes for content cache

    // Simplified caching - just cache URLs and use browser cache for actual files
    // This avoids CORS issues entirely
    function setCachedContent(videos) {
        try {
            localStorage.setItem('videoSources', JSON.stringify(videos));
            localStorage.setItem('contentTimestamp', Date.now().toString());
            console.log("💾 Video content cached successfully -", videos.length, "videos");
        } catch (error) {
            console.error("❌ Error setting content cache:", error);
        }
    }

    function getCachedContent() {
        try {
            const cachedVideos = localStorage.getItem('videoSources');
            const timestamp = localStorage.getItem('contentTimestamp');

            if (cachedVideos && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age < cacheExpiryTime) {
                    console.log("📋 Using cached video content");
                    return JSON.parse(cachedVideos);
                } else {
                    console.log("⏰ Cached content expired, will fetch fresh");
                    localStorage.removeItem('videoSources');
                    localStorage.removeItem('contentTimestamp');
                }
            }
        } catch (error) {
            console.error("❌ Error reading content cache:", error);
        }
        return null;
    }

    async function fetchVideos() {
        try {
            console.log("📡 Fetching videos from Firestore...");

            // First, try to get cached videos for immediate playback
            const cachedVideos = getCachedContent();
            if (cachedVideos && cachedVideos.length > 0) {
                videoSources = cachedVideos;
                console.log(`📋 Loaded from cache - ${videoSources.length} videos`);
                playNextVideo();
                console.log("🔄 Fetching fresh videos in background...");
            } else {
                console.log("🌐 No cache found, fetching fresh videos from Firestore");
            }

            // Enhanced error handling for Firestore queries
            const fetchWithRetry = async (collectionName, maxAttempts = 3) => {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    try {
                        console.log(`📡 Fetching ${collectionName} (attempt ${attempt + 1})`);
                        const snapshot = await db.collection(collectionName).get();
                        console.log(`✅ Successfully fetched ${collectionName}`);
                        return snapshot;
                    } catch (error) {
                        console.error(`❌ Error fetching ${collectionName} (attempt ${attempt + 1}):`, error);

                        if (attempt < maxAttempts - 1) {
                            const delay = Math.pow(2, attempt) * 1000;
                            console.log(`🔄 Retrying ${collectionName} in ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } else {
                            throw error;
                        }
                    }
                }
            };

            let freshVideoSources = [];

            try {
                const videosSnapshot = await fetchWithRetry('videos');
                freshVideoSources = videosSnapshot.docs.map(doc => doc.data().url);
                console.log(`📹 Loaded ${freshVideoSources.length} videos`);
            } catch (error) {
                console.error("❌ Failed to fetch videos after retries:", error);
                freshVideoSources = videoSources; // Keep cached if fetch fails
            }

            if (freshVideoSources.length > 0) {
                videoSources = freshVideoSources;
                setCachedContent(videoSources);
                console.log("✅ Updated cache with fresh videos");

                // Start playback if we weren't already playing from cache
                if (!cachedVideos) {
                    playNextVideo();
                }
            } else if (!cachedVideos) {
                console.error("❌ No videos available, retrying in 30 seconds...");
                setTimeout(fetchVideos, 30000);
            }

        } catch (error) {
            console.error("❌ Critical error in fetchVideos:", error);

            const cachedVideos = getCachedContent();
            if (cachedVideos) {
                console.log("🔄 Falling back to cached videos due to error");
                videoSources = cachedVideos;
                playNextVideo();
            } else {
                console.log("🔄 Retrying video fetch in 30 seconds...");
                setTimeout(fetchVideos, 30000);
            }
        }
    }

    function playNextVideo() {
        if (videoSources.length === 0) {
            console.log("📭 No videos available, retrying fetch...");
            setTimeout(fetchVideos, 10000);
            return;
        }

        const videoUrl = videoSources[currentVideoIndex];
        console.log(`🎬 Playing video ${currentVideoIndex + 1}/${videoSources.length}`);

        introVideo.src = videoUrl;

        // Enhanced video error handling
        introVideo.onerror = (e) => {
            console.error("❌ Video error:", e, "Source:", videoUrl);
            currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
            playNextVideo();
        };

        introVideo.onloadstart = () => {
            console.log("📹 Video loading started:", videoUrl);
        };

        introVideo.oncanplay = () => {
            console.log("✅ Video can start playing:", videoUrl);
        };

        introVideo.play().catch(error => {
            console.error("❌ Video play error:", error);
            currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
            playNextVideo();
        });

        videoContainer.style.display = 'flex';
        homePage.style.display = 'none';

        introVideo.onended = () => {
            console.log("✅ Video ended, moving to next video");
            currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
            playNextVideo();
        };
    }

    // Network status monitoring with recovery actions
    window.addEventListener('online', () => {
        console.log("🌐 Network connection restored");

        if (videoSources.length === 0) {
            console.log("🔄 No videos loaded, attempting to fetch...");
            fetchVideos();
        } else {
            console.log("🔄 Fetching fresh videos in background...");
            // Don't interrupt current playback, just update cache
            setTimeout(fetchVideos, 5000);
        }
    });

    window.addEventListener('offline', () => {
        console.log("📴 Network connection lost - using cached videos");
        // App should continue working with cached videos
    });

    // Initialize video loading
    fetchVideos();

    // Clean up old/unused cache entries from the previous image-cycling implementation
    localStorage.removeItem('imageDataCache');
    localStorage.removeItem('menuItems');
});
