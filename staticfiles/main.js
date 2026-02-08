// ==========================================
// 1. Initial Setup & Chat Logic
// ==========================================

// Helper to get CSRF token
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

const csrftoken = getCookie('csrftoken');

document.addEventListener("DOMContentLoaded", () => {
    // Reveal animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.widget').forEach(widget => {
        observer.observe(widget);
    });

    // Chat Logic
    initChat();
});

function initChat() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const fileInput = document.getElementById('chat-file');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const sendBtn = document.querySelector('.send-btn');

    if (!chatInput || !chatMessages) {
        console.error("Chat elements not found!");
        return;
    }

    window.previewImage = function () {
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                if (imagePreview) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                }
            }
            reader.readAsDataURL(file);
        }
    };

    window.clearImage = function () {
        if (fileInput) fileInput.value = '';
        if (imagePreview) imagePreview.src = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    };


    let lastDateString = null;
    let seenMessageIds = new Set();

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Check if user is near bottom
    function isUserNearBottom() {
        return chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 100;
    }

    function formatTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === now.toDateString()) {
            return 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString();
        }
    }

    function addDateHeader(isoString) {
        const dateStr = formatDate(isoString);
        if (dateStr !== lastDateString) {
            const div = document.createElement('div');
            div.className = 'chat-date-header';
            div.innerText = dateStr;
            chatMessages.appendChild(div);
            lastDateString = dateStr;
        }
    }

    function addMessage(msg, isUser, isOptimistic = false) {
        // Validation: If we already have this ID, skip it (unless it's optimistic update)
        if (msg.id && seenMessageIds.has(msg.id)) return;

        // If it's a real message, track it
        if (msg.id) seenMessageIds.add(msg.id);

        // Check for date header if timestamp exists
        if (msg.timestamp) {
            addDateHeader(msg.timestamp);
        }

        const div = document.createElement('div');
        div.className = `message ${isUser ? 'user' : 'bot'} ${isOptimistic ? 'optimistic' : ''}`;

        let content = '';
        if (msg.image_url) {
            content += `<img src="${msg.image_url}" class="chat-image" onclick="window.open(this.src, '_blank')">`;
        }
        if (msg.content || msg.text) {
            content += `<p>${msg.content || msg.text}</p>`;
        }

        // Timestamp
        const timeStr = msg.timestamp ? formatTime(msg.timestamp) : formatTime(new Date().toISOString());
        content += `<span class="message-time">${timeStr}</span>`;

        div.innerHTML = content;
        chatMessages.appendChild(div);
    }

    async function fetchMessages() {
        try {
            const res = await fetch('/chat/get/');
            const data = await res.json();

            // Filter only NEW messages
            const newMessages = data.messages.filter(msg => !seenMessageIds.has(msg.id));

            if (newMessages.length === 0) return; // Nothing to do, zero flicker.

            const wasNearBottom = isUserNearBottom();

            // If we have new messages, remove optimistic ones to prevent duplication
            // (Only if we assume the new messages cover the optimistic ones)
            if (newMessages.length > 0) {
                document.querySelectorAll('.message.optimistic').forEach(el => el.remove());
            }

            newMessages.forEach(msg => {
                addMessage(msg, msg.is_user);
            });

            // Scroll logic: If was near bottom OR first load (empty chat)
            if (wasNearBottom || chatMessages.childElementCount <= newMessages.length + 5) { // broad check for "start"
                scrollToBottom();
            }

        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        const file = fileInput ? fileInput.files[0] : null;

        if (!text && !file) return;

        const formData = new FormData();
        if (text) formData.append('content', text);
        if (file) formData.append('image', file);

        // Optimistic UI
        const nowIso = new Date().toISOString();
        if (text || file) {
            const tempMsg = {
                content: text,
                timestamp: nowIso,
                // No ID for optimistic
            };
            addMessage(tempMsg, true, true); // true for isOptimistic
            scrollToBottom();
        }

        chatInput.value = '';
        clearImage();

        try {
            await fetch('/chat/send/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrftoken },
                body: formData
            });
            // Fetch immediately to replace optimistic with real
            fetchMessages();
        } catch (err) {
            console.error("Error sending message:", err);
        }
    }

    // Expose to window for onclick attributes
    window.sendMessage = sendMessage;

    // Attach explicit event listeners
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission if inside a form
            sendMessage();
        });
    }

    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift+Enter for newline
            e.preventDefault(); // Prevent default newline
            sendMessage();
        }
    });

    // Initial load and polling
    fetchMessages();
    setInterval(fetchMessages, 3000); // Polling every 3s
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
    calm: { // calm
        bg1: '#4facfe', bg2: '#00f2fe',
        blob1: 'rgba(79, 172, 254, 0.8)', blob2: 'rgba(0, 242, 254, 0.8)', blob3: 'rgba(0, 198, 255, 0.6)'
    },
    tranqui: { // calm/tranqui
        bg1: '#4facfe', bg2: '#00f2fe',
        blob1: 'rgba(79, 172, 254, 0.8)', blob2: 'rgba(0, 242, 254, 0.8)', blob3: 'rgba(0, 198, 255, 0.6)'
    },
    cansado: { // tired
        bg1: '#8e9eab', bg2: '#eef2f3',
        blob1: 'rgba(142, 158, 171, 0.8)', blob2: 'rgba(200, 210, 220, 0.8)', blob3: 'rgba(100, 110, 120, 0.5)'
    },
    tired: { // tired
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
    if (!mood) return;
    const palette = moodPalettes[mood] || moodPalettes.feliz || moodPalettes.happy;
    const root = document.documentElement;

    root.style.setProperty('--bg-gradient-1', palette.bg1);
    root.style.setProperty('--bg-gradient-2', palette.bg2);
    root.style.setProperty('--blob-color-1', palette.blob1);
    root.style.setProperty('--blob-color-2', palette.blob2);
    root.style.setProperty('--blob-color-3', palette.blob3);
};

// ==========================================
// Mood Slider "Reactions" Logic
// ==========================================

const moodSlider = document.getElementById('mood-range');
const moodLabel = document.getElementById('mood-label');
const moodForm = document.getElementById('mood-form');
const moodInput = document.getElementById('id_mood');

const moodMap = {
    0: 'enojado',
    1: 'triste',
    2: 'cansado',   // Corrected from 'tranqui'
    3: 'tranqui',
    4: 'feliz',
    5: 'amoroso'
};

const moodNames = {
    0: 'Enojado',
    1: 'Triste',
    2: 'Cansado',
    3: 'Tranqui',
    4: 'Feliz',
    5: 'Amoroso'
};

const moodReverseMap = {
    'enojado': 0,
    'triste': 1,
    'cansado': 2,
    'tranqui': 3,
    'feliz': 4,
    'amoroso': 5,
    // Add english fallbacks just in case
    'angry': 0, 'sad': 1, 'tired': 2, 'calm': 3, 'happy': 4, 'love': 5
};

const moodSvgs = {
    0: `<svg viewBox="0 0 36 36" fill="url(#grad_angry)"><defs><linearGradient id="grad_angry" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF5E62;stop-opacity:1" /><stop offset="100%" style="stop-color:#FF9966;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="#FFF" d="M11 23c0-2.5 7-2.5 14 0M10 14l5 2M26 14l-5 2" stroke="#FFF" stroke-width="2" stroke-linecap="round"/></svg>`, // Angry
    1: `<svg viewBox="0 0 36 36" fill="url(#grad_sad)"><defs><linearGradient id="grad_sad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#5B86E5;stop-opacity:1" /><stop offset="100%" style="stop-color:#36D1DC;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><circle fill="#FFF" cx="12" cy="14" r="2"/><circle fill="#FFF" cx="24" cy="14" r="2"/><path fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" d="M12 25s3-2 6-2 6 2 6 2"/><path fill="#FFF" d="M25 15c.5 2 1 4 0 5" opacity="0.5"/></svg>`, // Sad
    2: `<svg viewBox="0 0 36 36" fill="url(#grad_tired)"><defs><linearGradient id="grad_tired" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#bdc3c7;stop-opacity:1" /><stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="none" stroke="#FFF" stroke-width="2" d="M10 16h6M20 16h6"/><circle fill="#FFF" cx="28" cy="12" r="3" opacity="0.5"/><circle fill="#FFF" cx="32" cy="8" r="1.5" opacity="0.5"/><path fill="none" stroke="#FFF" stroke-width="2" d="M14 24s2 2 4 2 4-2 4-2"/></svg>`, // Tired
    3: `<svg viewBox="0 0 36 36" fill="url(#grad_calm)"><defs><linearGradient id="grad_calm" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#89f7fe;stop-opacity:1" /><stop offset="100%" style="stop-color:#66a6ff;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><circle fill="#FFF" cx="12" cy="15" r="2"/><circle fill="#FFF" cx="24" cy="15" r="2"/><path fill="none" stroke="#FFF" stroke-width="2" d="M13 22s2.5 2 5 2 5-2 5-2"/></svg>`, // Calm
    4: `<svg viewBox="0 0 36 36" fill="url(#grad_happy)"><defs><linearGradient id="grad_happy" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F2994A;stop-opacity:1" /><stop offset="100%" style="stop-color:#F2C94C;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" d="M12 22s2.5 3 6 3 6-3 6-3"/><circle fill="#FFF" cx="12" cy="14" r="2"/><circle fill="#FFF" cx="24" cy="14" r="2"/></svg>`, // Happy
    5: `<svg viewBox="0 0 36 36" fill="url(#grad_love)"><defs><linearGradient id="grad_love" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff9a9e;stop-opacity:1" /><stop offset="100%" style="stop-color:#fecfef;stop-opacity:1" /></linearGradient></defs><circle cx="18" cy="18" r="18"/><path fill="#FFF" d="M18 25s-7-4-9-9c-2-5 3-8 6-5 1 1 3 4 3 4s2-3 3-4c3-3 8 0 6 5-2 5-9 9-9 9z"/></svg>` // Love
};

if (moodSlider) {
    const track = document.getElementById('mood-icons-track');

    // 1. Inject Icons
    if (track) {
        track.innerHTML = ''; // Clear
        for (let i = 0; i <= 5; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mood-icon-wrapper';
            wrapper.innerHTML = moodSvgs[i];
            track.appendChild(wrapper);
        }
    }

    const iconWrappers = document.querySelectorAll('.mood-icon-wrapper');

    function updateReactions(val) {
        iconWrappers.forEach((wrapper, index) => {
            wrapper.classList.remove('active', 'neighbor');
            wrapper.style.transform = '';
            wrapper.style.opacity = '';
            wrapper.style.filter = '';

            const dist = Math.abs(val - index);

            if (dist === 0) {
                wrapper.classList.add('active');
            } else if (dist === 1) {
                wrapper.classList.add('neighbor');
            } else {
                wrapper.style.transform = 'scale(0.85)';
                wrapper.style.opacity = '0.5';
                wrapper.style.filter = 'grayscale(50%)';
            }
        });
    }

    // Init logic
    const savedMood = moodSlider.dataset.currentMood;
    let initialVal = 3; // Default ('Tranqui')

    // Try to match saved mood
    if (savedMood) {
        const key = savedMood.toLowerCase();
        if (moodReverseMap.hasOwnProperty(key)) {
            initialVal = moodReverseMap[key];
        }
    }

    // Set Slider Value
    moodSlider.value = initialVal;

    // Set Hidden Input Value (CRITICAL for form submission)
    if (moodInput) {
        moodInput.value = moodMap[initialVal];
    }

    // Set initial label
    if (moodLabel) {
        moodLabel.innerText = `${moodNames[initialVal]}`;
    }

    // Initial Animation & Background
    updateReactions(initialVal);
    setMoodBackground(moodMap[initialVal]);

    moodSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const mood = moodMap[val];

        if (moodLabel) {
            moodLabel.innerText = `${moodNames[val]}`;
        }

        // Update background
        setMoodBackground(mood);

        // Update Animations
        updateReactions(val);

        // Update hidden input for manual submit
        if (moodInput) {
            moodInput.value = mood;
        }

        if (navigator.vibrate) {
            try { navigator.vibrate(5); } catch (e) { }
        }
    });
}
