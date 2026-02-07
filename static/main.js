// Main JS

// ==========================================
// 1. Global Utilities (Modals & Forms)
// ==========================================

window.openModal = function (url) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-img');
    if (modal && img) {
        modal.style.display = 'block';
        img.src = url;
    }
}

window.closeModal = function () {
    const modal = document.getElementById('image-modal');
    if (modal) modal.style.display = 'none';
}

window.toggleWatchForm = function () {
    const f = document.getElementById('watch-form');
    if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

window.toggleNoteForm = function () {
    const f = document.getElementById('note-form');
    if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

// ==========================================
// 2. Chat Logic
// ==========================================

const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatFile = document.getElementById('chat-file');

if (chatInput && chatMessages && chatFile) {

    async function fetchMessages() {
        try {
            const response = await fetch('/chat/get/');
            const data = await response.json();

            // Simple check if we should scroll
            const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 100;

            chatMessages.innerHTML = '';
            data.messages.forEach(msg => {
                const currentUser = document.body.dataset.user;
                const isMine = msg.user === currentUser;
                const msgDiv = document.createElement('div');
                msgDiv.classList.add('chat-bubble', isMine ? 'bubble-mine' : 'bubble-theirs');

                let contentHtml = '';
                if (msg.image) {
                    contentHtml += `<img src="${msg.image}" style="max-width:200px; border-radius:8px; display:block; margin-bottom:5px;">`;
                }
                if (msg.content) {
                    contentHtml += `<span>${msg.content}</span>`;
                }

                msgDiv.innerHTML = `<strong style="display:block; font-size:0.8em; margin-bottom:2px;">${msg.user}</strong>
                                     ${contentHtml} 
                                     <span style="font-size:0.7em; opacity:0.7; float:right; margin-top:5px; margin-left:10px;">${msg.timestamp}</span>`;
                chatMessages.appendChild(msgDiv);
            });

            if (isScrolledToBottom) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    }

    async function sendMessage() {
        const content = chatInput.value;
        const file = chatFile.files[0];

        if (!content && !file) return;

        const formData = new FormData();
        formData.append('content', content);
        if (file) {
            formData.append('image', file);
        }

        try {
            const response = await fetch('/chat/send/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            });
            const data = await response.json();
            if (data.status === 'ok') {
                chatInput.value = '';
                clearImage();
                fetchMessages();
                setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 100);
            }
        } catch (e) {
            console.error("Error sending message:", e);
        }
    }

    function previewImage() {
        const file = chatFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('image-preview');
                if (preview) {
                    preview.src = e.target.result;
                    const container = document.getElementById('image-preview-container');
                    if (container) container.style.display = 'block';
                }
            }
            reader.readAsDataURL(file);
        }
    }

    function clearImage() {
        chatFile.value = '';
        const preview = document.getElementById('image-preview');
        if (preview) preview.src = '';
        const container = document.getElementById('image-preview-container');
        if (container) container.style.display = 'none';
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Expose to window
    window.sendMessage = sendMessage;
    window.previewImage = previewImage;
    window.clearImage = clearImage;

    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    setInterval(fetchMessages, 2000);
    fetchMessages();
}

// ==========================================
// 3. Mood Background Logic
// ==========================================

const moodPalettes = {
    happy: { // Fallback
        bg1: '#ffb347', bg2: '#ffcc33',
        blob1: 'rgba(255, 179, 71, 0.8)', blob2: 'rgba(255, 204, 51, 0.8)', blob3: 'rgba(255, 223, 0, 0.6)'
    },
    feliz: { // happy
        bg1: '#ffb347', bg2: '#ffcc33',
        blob1: 'rgba(255, 179, 71, 0.8)', blob2: 'rgba(255, 204, 51, 0.8)', blob3: 'rgba(255, 223, 0, 0.6)'
    },
    calmado: { // calm
        bg1: '#4facfe', bg2: '#00f2fe',
        blob1: 'rgba(79, 172, 254, 0.8)', blob2: 'rgba(0, 242, 254, 0.8)', blob3: 'rgba(0, 198, 255, 0.6)'
    },
    cansado: { // tired
        bg1: '#8e9eab', bg2: '#eef2f3',
        blob1: 'rgba(142, 158, 171, 0.8)', blob2: 'rgba(200, 210, 220, 0.8)', blob3: 'rgba(100, 110, 120, 0.5)'
    },
    triste: { // sad
        bg1: '#141E30', bg2: '#243B55',
        blob1: 'rgba(20, 30, 48, 0.9)', blob2: 'rgba(36, 59, 85, 0.9)', blob3: 'rgba(10, 20, 40, 0.5)'
    },
    enojado: { // angry
        bg1: '#cb2d3e', bg2: '#ef473a',
        blob1: 'rgba(203, 45, 62, 0.9)', blob2: 'rgba(239, 71, 58, 0.9)', blob3: 'rgba(180, 20, 20, 0.5)'
    },
    amoroso: { // love
        bg1: '#ec008c', bg2: '#fc6767',
        blob1: 'rgba(236, 0, 140, 0.8)', blob2: 'rgba(252, 103, 103, 0.8)', blob3: 'rgba(255, 20, 147, 0.6)'
    }
};

window.setMoodBackground = function (mood) {
    const palette = moodPalettes[mood] || moodPalettes.feliz || moodPalettes.happy;
    const root = document.documentElement;

    root.style.setProperty('--bg-gradient-1', palette.bg1);
    root.style.setProperty('--bg-gradient-2', palette.bg2);
    root.style.setProperty('--blob-color-1', palette.blob1);
    root.style.setProperty('--blob-color-2', palette.blob2);
    root.style.setProperty('--blob-color-3', palette.blob3);
};

// Helper to set thumb emoji
function setThumbEmoji(emoji) {
    const moodSlider = document.getElementById('mood-range');
    if (!moodSlider) return;

    // SVG Data URI with the emoji text centered
    // Using simple styling/encoding to ensure compatibility
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <style>text { font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }</style>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="36">${emoji}</text>
    </svg>
    `;
    const encoded = encodeURIComponent(svg);
    moodSlider.style.setProperty('--thumb-bg', `url("data:image/svg+xml;charset=UTF-8,${encoded}")`);
}

// Mood Slider Logic
const moodSlider = document.getElementById('mood-range');
const moodLabel = document.getElementById('mood-label');
const moodForm = document.getElementById('mood-form');
const moodInput = document.getElementById('id_mood');

const moodMap = {
    0: 'enojado',
    1: 'triste',
    2: 'cansado',
    3: 'calmado',
    4: 'feliz',
    5: 'amoroso'
};

const moodEmojis = {
    0: '😡',
    1: '😢',
    2: '😴',
    3: '😊',
    4: '😄',
    5: '❤️'
};

const moodNames = {
    0: 'Enojado',
    1: 'Triste',
    2: 'Cansado',
    3: 'Calmado',
    4: 'Feliz',
    5: 'Amoroso'
};

// Reverse map for initialization
const moodReverseMap = {
    'enojado': 0,
    'triste': 1,
    'cansado': 2,
    'calmado': 3,
    'feliz': 4,
    'amoroso': 5,
    // Add english fallbacks just in case
    'angry': 0, 'sad': 1, 'tired': 2, 'calm': 3, 'happy': 4, 'love': 5
};

if (moodSlider) {
    // Init logic
    const savedMood = moodSlider.dataset.currentMood;
    let initialVal = 3; // Default

    // Try to match saved mood (case insensitive just in case)
    if (savedMood) {
        const key = savedMood.toLowerCase();
        if (moodReverseMap.hasOwnProperty(key)) {
            initialVal = moodReverseMap[key];
        }
    }

    moodSlider.value = initialVal;

    const initialEmoji = moodEmojis[initialVal];

    // Set initial label and thumb
    if (moodLabel) {
        moodLabel.innerText = `${initialEmoji} ${moodNames[initialVal]}`;
    }
    setThumbEmoji(initialEmoji);

    moodSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const mood = moodMap[val];
        const emoji = moodEmojis[val];

        if (moodLabel) {
            moodLabel.innerText = `${moodNames[val]}`;
        }

        // Update background preview immediately
        setMoodBackground(mood);

        // Update Thumb Emoji
        setThumbEmoji(emoji);

        // Update hidden input for manual submit
        if (moodInput) {
            moodInput.value = mood;
        }
    });
}

// ==========================================
// 4. Initial Mood Setup
// ==========================================

// Initialize with Partner's Mood
const otherMood = document.body.dataset.otherMood;
if (otherMood) {
    window.setMoodBackground(otherMood);
}
