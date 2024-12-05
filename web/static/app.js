const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture');
const capturedImage = document.getElementById('capturedImage');
const resultDiv = document.getElementById('result');
const context = canvas.getContext('2d');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

async function getCameraStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
    } catch (error) {
        console.error("Error accessing the camera: ", error);
    }
}

captureButton.addEventListener('click', function() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    capturedImage.src = imageDataUrl;
    capturedImage.style.display = 'block';
    uploadImage(imageDataUrl);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('highlight');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('highlight');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('highlight');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            capturedImage.src = e.target.result;
            capturedImage.style.display = 'block';
            uploadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select an image file.');
    }
}

function uploadImage(imageDataUrl) {
    fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
            const formData = new FormData();
            formData.append('image', blob, 'image.jpg');

            fetch('/analyze-image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Full server response:', data);
                if (data.description) {
                    resultDiv.textContent = 'Analysis: ' + data.description;
                } else if (data.error) {
                    resultDiv.textContent = 'Error: ' + data.error;
                } else {
                    resultDiv.textContent = 'Unexpected response format';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.textContent = 'Error: ' + error.message;
            });
        });
}

getCameraStream();