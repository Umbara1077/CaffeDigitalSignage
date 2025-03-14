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

    function updateMenuGrid(menuItem) {
        menuGrid.innerHTML = ''; // Clear the grid
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card';
        menuCard.innerHTML = `<img src="${menuItem.imageURL}" alt="Menu Image">`;
        menuGrid.appendChild(menuCard);
    }

    async function prepareContentQueue() {
        contentQueue = [];

        // Fetch videos
        const videosSnapshot = await db.collection('videos').get();
        videoSources = videosSnapshot.docs.map(doc => doc.data().url);

        // Fetch images
        const imagesSnapshot = await db.collection('menuImages').get();
        menuItems = imagesSnapshot.docs.map(doc => ({ imageURL: doc.data().imageURL }));

        const maxLength = Math.max(menuItems.length, videoSources.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < menuItems.length) contentQueue.push({ type: 'image', data: menuItems[i] });
            if (i < videoSources.length) contentQueue.push({ type: 'video', data: videoSources[i] });
        }

        currentContentIndex = 0; // Start at the beginning of the queue
        playNextContent();
    }

    function playNextContent() {
        if (contentQueue.length === 0) return;

        const content = contentQueue[currentContentIndex];

        if (content.type === 'video') {
            introVideo.src = content.data;
            introVideo.play();
            videoContainer.style.display = 'flex'; 
            homePage.style.display = 'none';
            introVideo.onended = () => {
                currentContentIndex = (currentContentIndex + 1) % contentQueue.length;
                playNextContent(); // Move to next content after video ends
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

    prepareContentQueue();
});
