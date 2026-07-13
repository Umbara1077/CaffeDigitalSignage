document.addEventListener('DOMContentLoaded', async () => {
    const storageRef = firebase.storage().ref();
    const db = firebase.firestore();

    const uploadVideoForm = document.getElementById('uploadVideoForm');
    const videoSelect = document.getElementById('videoSelect');
    const currentVideos = document.getElementById('currentVideos');
    const removeVideoButton = document.getElementById('removeVideoButton');

    // Upload a new video
    uploadVideoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('videoFile').files[0];
        const videoRef = storageRef.child('videos/' + file.name);
        try {
            const snapshot = await videoRef.put(file);
            const videoURL = await snapshot.ref.getDownloadURL();
            await db.collection('videos').add({ url: videoURL, fileName: file.name });
            alert('Video uploaded successfully');
            uploadVideoForm.reset();
            populateVideoSelect();
            displayCurrentVideos(); // Update display
        } catch (error) {
            console.error('Error uploading video:', error);
        }
    });

    // Populate video select options and display videos
    async function populateVideoSelect() {
        const snapshot = await db.collection('videos').get();
        videoSelect.innerHTML = '<option value="">Select a Video</option>';
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id + ',' + data.fileName;
            option.textContent = data.fileName;
            videoSelect.appendChild(option);
        });
    }

    // Display current videos
    async function displayCurrentVideos() {
        const snapshot = await db.collection('videos').get();
        currentVideos.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const video = document.createElement('video');
            video.src = data.url;
            video.controls = true;
            video.classList.add('menu-item-card');
            currentVideos.appendChild(video);
        });
    }

    // Remove selected video
    removeVideoButton.addEventListener('click', async () => {
        const selectedValue = videoSelect.value;
        if (!selectedValue) {
            alert('Please select a video to remove.');
            return;
        }

        const [id, fileName] = selectedValue.split(',');
        const videoRef = storageRef.child('videos/' + fileName);

        try {
            await videoRef.delete();
            await db.collection('videos').doc(id).delete();
            alert('Video removed successfully');
            populateVideoSelect();
            displayCurrentVideos(); // Update display
        } catch (error) {
            console.error('Error removing video:', error);
        }
    });

    // Initialize the dropdown and display on page load
    populateVideoSelect();
    displayCurrentVideos();
});
