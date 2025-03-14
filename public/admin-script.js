document.addEventListener('DOMContentLoaded', async () => {
    const storageRef = firebase.storage().ref();
    const db = firebase.firestore();

    const uploadImageForm = document.getElementById('uploadImageForm');
    const uploadVideoForm = document.getElementById('uploadVideoForm');
    const imageSelect = document.getElementById('imageSelect');
    const videoSelect = document.getElementById('videoSelect');
    const currentImages = document.getElementById('currentImages');
    const currentVideos = document.getElementById('currentVideos');
    const removeImageButton = document.getElementById('removeImageButton');
    const removeVideoButton = document.getElementById('removeVideoButton');

    // Upload a new menu image
    uploadImageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('menuImageFile').files[0];
        const imageRef = storageRef.child('menuImages/' + file.name);
        try {
            const snapshot = await imageRef.put(file);
            const imageURL = await snapshot.ref.getDownloadURL();
            await db.collection('menuImages').add({ imageURL, fileName: file.name });
            alert('Image uploaded successfully');
            uploadImageForm.reset();
            populateImageSelect();
            displayCurrentImages(); // Update display
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    });

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

    // Populate image select options and display images
    async function populateImageSelect() {
        const snapshot = await db.collection('menuImages').get();
        imageSelect.innerHTML = '<option value="">Select an Image</option>';
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id + ',' + data.fileName;
            option.textContent = data.fileName;
            imageSelect.appendChild(option);
        });
    }

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

    // Display current images
    async function displayCurrentImages() {
        const snapshot = await db.collection('menuImages').get();
        currentImages.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const img = document.createElement('img');
            img.src = data.imageURL;
            img.classList.add('menu-item-card');
            currentImages.appendChild(img);
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

    // Remove selected image
    removeImageButton.addEventListener('click', async () => {
        const selectedValue = imageSelect.value;
        if (!selectedValue) {
            alert('Please select an image to remove.');
            return;
        }

        const [id, fileName] = selectedValue.split(',');
        const imageRef = storageRef.child('menuImages/' + fileName);

        try {
            await imageRef.delete();
            await db.collection('menuImages').doc(id).delete();
            alert('Image removed successfully');
            populateImageSelect();
            displayCurrentImages(); // Update display
        } catch (error) {
            console.error('Error removing image:', error);
        }
    });

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

    // Initialize the dropdowns and displays on page load
    populateImageSelect();
    populateVideoSelect();
    displayCurrentImages();
    displayCurrentVideos();
});