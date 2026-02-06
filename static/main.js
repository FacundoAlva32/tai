document.addEventListener('DOMContentLoaded', () => {

    // Modal Logic
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

    // Toggle Forms
    window.toggleWatchForm = function () {
        const f = document.getElementById('watch-form');
        if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
    }
    window.toggleNoteForm = function () {
        const f = document.getElementById('note-form');
        if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
    }

    // Chat Logic
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
                        'X-CSRFToken': getCookie('csrftoken') // Ensure CSRF is handled if not in template
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

        // Helper to get CSRF token from cookie if needed, though template usually handles it.
        // But for safety let's define a simple one or rely on what's in DOM headers if any.
        // Actually, we passed it in headers in previous code using template tag {{ csrf_token }}. 
        // Logic inside .js file doesn't parse django template tags unless served inline. 
        // IMPORTANT: The previous file was served as static, so {{ csrf_token }} WON'T WORK.
        // We need to get it from cookie or input.
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
});
