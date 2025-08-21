document.addEventListener('DOMContentLoaded', async () => {
    const videoContainer = document.getElementById('video-container');
    const introVideo = document.getElementById('intro-video');
    const homePage = document.getElementById('home-page');
    const menuGrid = document.querySelector('.menu-grid');
    const displayDuration = 45000; // 45 seconds

    let menuItems = [];
    let videoSources = [];
    let contentQueue = [];
    let currentContentIndex = 0;
    let retryAttempts = 0;
    const maxRetries = 3;
    const cacheExpiryTime = 30 * 60 * 1000; // 30 minutes for content cache

    // Simplified caching - just cache URLs and use browser cache for actual files
    // This avoids CORS issues entirely
    function setCachedContent(videos, images) {
        try {
            localStorage.setItem('videoSources', JSON.stringify(videos));
            localStorage.setItem('menuItems', JSON.stringify(images));
            localStorage.setItem('contentTimestamp', Date.now().toString());
            console.log("💾 Content cached successfully - videos:", videos.length, "images:", images.length);
        } catch (error) {
            console.error("❌ Error setting content cache:", error);
        }
    }

    // Function to preload videos and images for browser caching (CORS-friendly)
    async function preloadAllContent() {
        console.log("📥 Preloading content for browser cache...");
        
        // Preload images
        const imagePromises = menuItems.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    console.log("✅ Preloaded image:", item.imageURL.substring(0, 50) + "...");
                    resolve();
                };
                img.onerror = () => {
                    console.log("⚠️ Failed to preload image:", item.imageURL.substring(0, 50) + "...");
                    resolve(); // Don't block on errors
                };
                img.src = item.imageURL;
            });
        });
        
        // Preload videos
        const videoPromises = videoSources.map(videoUrl => {
            return new Promise((resolve) => {
                const video = document.createElement('video');
                video.preload = 'metadata'; // Just load metadata, not full video
                video.onloadedmetadata = () => {
                    console.log("✅ Preloaded video metadata:", videoUrl.substring(0, 50) + "...");
                    resolve();
                };
                video.onerror = () => {
                    console.log("⚠️ Failed to preload video:", videoUrl.substring(0, 50) + "...");
                    resolve(); // Don't block on errors
                };
                video.src = videoUrl;
            });
        });
        
        // Wait for all content to preload
        await Promise.all([...imagePromises, ...videoPromises]);
        console.log("✅ All content preloaded into browser cache");
    }

    // Enhanced caching functions for images and videos
    function getCachedContent() {
        try {
            const cachedVideos = localStorage.getItem('videoSources');
            const cachedImages = localStorage.getItem('menuItems');
            const timestamp = localStorage.getItem('contentTimestamp');
            
            if (cachedVideos && cachedImages && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age < cacheExpiryTime) {
                    console.log("📋 Using cached content (videos & images)");
                    return {
                        videos: JSON.parse(cachedVideos),
                        images: JSON.parse(cachedImages)
                    };
                } else {
                    console.log("⏰ Cached content expired, will fetch fresh");
                    // Clear expired cache
                    localStorage.removeItem('videoSources');
                    localStorage.removeItem('menuItems');
                    localStorage.removeItem('contentTimestamp');
                }
            }
        } catch (error) {
            console.error("❌ Error reading content cache:", error);
        }
        return null;
    }



    // Caching functions for business hours
    function getCachedBusinessHours() {
        try {
            const cached = localStorage.getItem('businessHours');
            const timestamp = localStorage.getItem('businessHoursTimestamp');
            
            if (cached && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age < cacheExpiryTime) {
                    console.log("📋 Using cached business hours");
                    return JSON.parse(cached);
                } else {
                    console.log("⏰ Cached business hours expired");
                    localStorage.removeItem('businessHours');
                    localStorage.removeItem('businessHoursTimestamp');
                }
            }
        } catch (error) {
            console.error("❌ Error reading business hours cache:", error);
        }
        return null;
    }

    function setCachedBusinessHours(businessHours) {
        try {
            localStorage.setItem('businessHours', JSON.stringify(businessHours));
            localStorage.setItem('businessHoursTimestamp', Date.now().toString());
            console.log("💾 Business hours cached successfully");
        } catch (error) {
            console.error("❌ Error setting business hours cache:", error);
        }
    }

    // Enhanced business hours fetching with better error recovery
    function fetchBusinessHours(callback) {
        // First try cached data for immediate response
        const cachedHours = getCachedBusinessHours();
        if (cachedHours) {
            callback(cachedHours);
            // Continue to try fresh data in background
        }

        const attemptFetch = (attempt = 0) => {
            console.log(`📡 Attempting to fetch business hours (attempt ${attempt + 1}/${maxRetries})`);
            
            hoursDB.collection("business_hours").doc("hours").get()
                .then((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        console.log("📢 Fetched Business Hours:", data);

                        if (!data.openTime || !data.closeTime) {
                            console.error("❌ Missing openTime or closeTime in Firestore!");
                            if (!cachedHours) {
                                callback(handleFetchFailure());
                            }
                            return;
                        }

                        const openTime = parseInt(data.openTime, 10);
                        const closeTime = parseInt(data.closeTime, 10);
                        const openHour = Math.floor(openTime / 100);
                        const openMinute = openTime % 100;
                        const closeHour = Math.floor(closeTime / 100);
                        const closeMinute = closeTime % 100;

                        console.log(`✅ Open Time: ${openHour}:${openMinute}`);
                        console.log(`✅ Close Time: ${closeHour}:${closeMinute}`);

                        const businessHours = { openHour, openMinute, closeHour, closeMinute };
                        
                        // Cache the fresh data
                        setCachedBusinessHours(businessHours);
                        
                        // Only call callback if we don't have cached data already
                        if (!cachedHours) {
                            callback(businessHours);
                        }
                        retryAttempts = 0; // Reset on success
                    } else {
                        console.error("❌ Business hours document not found!");
                        if (!cachedHours) {
                            callback(handleFetchFailure());
                        }
                    }
                })
                .catch((error) => {
                    console.error(`❌ Firestore fetch error (attempt ${attempt + 1}):`, error);
                    
                    if (attempt < maxRetries - 1) {
                        // Retry with exponential backoff
                        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                        console.log(`🔄 Retrying in ${delay}ms...`);
                        setTimeout(() => attemptFetch(attempt + 1), delay);
                    } else {
                        console.error("❌ Max retries reached for business hours fetch");
                        if (!cachedHours) {
                            callback(handleFetchFailure());
                        }
                    }
                });
        };
        
        // Only start fetching if no cache available
        if (!cachedHours) {
            attemptFetch();
        } else {
            // Still try to fetch fresh data in background
            setTimeout(() => attemptFetch(), 1000);
        }
    }

    function handleFetchFailure() {
        console.log("🔄 Using fallback business hours logic");
        const fallbackHours = {
            openHour: 7,
            openMinute: 0,
            closeHour: 20,
            closeMinute: 0
        };
        return fallbackHours;
    }

    function checkTime(businessHours) {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const isBusinessDay = (day === 0 || (day >= 3 && day <= 7));
        const { openHour, openMinute, closeHour, closeMinute } = businessHours;

        const isOpenHours = isBusinessDay &&
                            (hours > openHour || (hours === openHour && minutes >= openMinute)) &&
                            (hours < closeHour || (hours === closeHour && minutes < closeMinute));

        console.log(`🕒 NOW: ${hours}:${minutes} | OPEN: ${openHour}:${openMinute} - ${closeHour}:${closeMinute} | isOpenHours: ${isOpenHours}`);
        console.log(`✅ Is Today a Business Day? ${isBusinessDay}`);
        
        if (!isOpenHours) {
            console.log("🔴 Store is CLOSED - Redirecting to early.html");
            setTimeout(() => { window.location.href = "early.html"; }, 500);
        }
    }

    function updateMenuGrid(menuItem) {
        menuGrid.innerHTML = '';
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card';
        
        // Add error handling for image loading
        const img = document.createElement('img');
        img.src = menuItem.imageURL;
        img.alt = "Menu Image";
        
        img.onerror = () => {
            console.error("❌ Failed to load image:", menuItem.imageURL);
            // Try to show a simple placeholder div instead of broken image
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                width: 100%;
                height: 300px;
                background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), 
                           linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%);
                background-size: 20px 20px;
                background-position: 0 0, 10px 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-family: Arial, sans-serif;
                border: 2px dashed #ccc;
            `;
            placeholder.textContent = 'Menu Image Unavailable';
            
            img.replaceWith(placeholder);
        };
        
        img.onload = () => {
            console.log("✅ Image loaded successfully:", menuItem.imageURL);
        };
        
        menuCard.appendChild(img);
        menuGrid.appendChild(menuCard);
    }

    async function prepareContentQueue() {
        try {
            contentQueue = [];
            console.log("📡 Fetching content from Firestore...");

            // First, try to get cached content for immediate display
            const cachedContent = getCachedContent();
            if (cachedContent) {
                videoSources = cachedContent.videos;
                menuItems = cachedContent.images;
                console.log(`📋 Loaded from cache - ${videoSources.length} videos, ${menuItems.length} images`);
                
                // Start playing content immediately from cache
                buildContentQueue();
                
                // Continue to fetch fresh content in background
                console.log("🔄 Fetching fresh content in background...");
            }

            // No cache available or fetching fresh data in background
            if (!cachedContent) {
                console.log("🌐 No cache found, fetching fresh content from Firestore");
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
            let freshMenuItems = [];

            // Fetch videos with retry logic
            try {
                const videosSnapshot = await fetchWithRetry('videos');
                freshVideoSources = videosSnapshot.docs.map(doc => doc.data().url);
                console.log(`📹 Loaded ${freshVideoSources.length} videos`);
            } catch (error) {
                console.error("❌ Failed to fetch videos after retries:", error);
                freshVideoSources = videoSources; // Keep cached if fetch fails
            }

            // Fetch images with retry logic
            try {
                const imagesSnapshot = await fetchWithRetry('menuImages');
                freshMenuItems = imagesSnapshot.docs.map(doc => ({ imageURL: doc.data().imageURL }));
                console.log(`🖼️ Loaded ${freshMenuItems.length} images`);
            } catch (error) {
                console.error("❌ Failed to fetch images after retries:", error);
                freshMenuItems = menuItems; // Keep cached if fetch fails
            }

            // Update with fresh content if we got any
            if (freshVideoSources.length > 0 || freshMenuItems.length > 0) {
                videoSources = freshVideoSources;
                menuItems = freshMenuItems;
                
                // Cache the fresh content
                setCachedContent(videoSources, menuItems);
                console.log("✅ Updated cache with fresh content");
                
                // Rebuild queue with fresh content only if not already playing
                if (!cachedContent) {
                    buildContentQueue();
                }
            } else if (!cachedContent) {
                // No cache and no fresh content - this is bad
                console.error("❌ No content available, retrying in 30 seconds...");
                setTimeout(prepareContentQueue, 30000);
                return;
            }

        } catch (error) {
            console.error("❌ Critical error in prepareContentQueue:", error);
            
            // If we have cached content, use it
            const cachedContent = getCachedContent();
            if (cachedContent) {
                console.log("🔄 Falling back to cached content due to error");
                videoSources = cachedContent.videos;
                menuItems = cachedContent.images;
                buildContentQueue();
            } else {
                // Retry after delay
                console.log("🔄 Retrying content fetch in 30 seconds...");
                setTimeout(prepareContentQueue, 30000);
            }
        }
    }

    function buildContentQueue() {
        // Build content queue
        const maxLength = Math.max(menuItems.length, videoSources.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < menuItems.length) contentQueue.push({ type: 'image', data: menuItems[i] });
            if (i < videoSources.length) contentQueue.push({ type: 'video', data: videoSources[i] });
        }

        currentContentIndex = 0;
        console.log(`🎯 Content queue prepared with ${contentQueue.length} items`);
        playNextContent();
    }

    function playNextContent() {
        if (contentQueue.length === 0) {
            console.log("📭 No content in queue, retrying preparation...");
            setTimeout(prepareContentQueue, 10000);
            return;
        }

        const content = contentQueue[currentContentIndex];
        console.log(`🎬 Playing content ${currentContentIndex + 1}/${contentQueue.length} (${content.type})`);

        if (content.type === 'video') {
            introVideo.src = content.data;
            
            // Enhanced video error handling
            introVideo.onerror = (e) => {
                console.error("❌ Video error:", e, "Source:", content.data);
                // Skip to next content on error
                currentContentIndex = (currentContentIndex + 1) % contentQueue.length;
                playNextContent();
            };

            introVideo.onloadstart = () => {
                console.log("📹 Video loading started:", content.data);
            };

            introVideo.oncanplay = () => {
                console.log("✅ Video can start playing:", content.data);
            };

            introVideo.play().catch(error => {
                console.error("❌ Video play error:", error);
                currentContentIndex = (currentContentIndex + 1) % contentQueue.length;
                playNextContent();
            });

            videoContainer.style.display = 'flex';
            homePage.style.display = 'none';

            introVideo.onended = () => {
                console.log("✅ Video ended, moving to next content");
                currentContentIndex = (currentContentIndex + 1) % contentQueue.length;
                playNextContent();
            };

        } else if (content.type === 'image') {
            updateMenuGrid(content.data);
            videoContainer.style.display = 'none';
            homePage.style.display = 'flex';

            setTimeout(() => {
                currentContentIndex = (currentContentIndex + 1) % contentQueue.length;
                playNextContent();
            }, displayDuration);
        }
    }

    // Network status monitoring with recovery actions
    window.addEventListener('online', () => {
        console.log("🌐 Network connection restored");
        retryAttempts = 0; // Reset retry attempts when back online
        
        // Immediately try to fetch fresh content when back online
        if (contentQueue.length === 0) {
            console.log("🔄 No content queue, attempting to fetch...");
            prepareContentQueue();
        } else {
            console.log("🔄 Fetching fresh content in background...");
            // Don't interrupt current playback, just update cache
            setTimeout(prepareContentQueue, 5000);
        }
    });

    window.addEventListener('offline', () => {
        console.log("📴 Network connection lost - using cached data");
        // App should continue working with cached content
    });

    // Initialize business hours check with enhanced error handling
    fetchBusinessHours(checkTime);
    setInterval(() => fetchBusinessHours(checkTime), 60000);

    // Initialize content loading
    prepareContentQueue();
    
    // Clean up old cache entries
    localStorage.removeItem('imageDataCache');
});