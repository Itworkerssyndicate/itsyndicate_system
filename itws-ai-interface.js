// assets/js/itws-ai-interface.js
// ITWS AI - واجهة المستخدم للمساعد الذكي

import ITWSAICore from './itws-ai-core.js';

class ITWSAIInterface {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.core = new ITWSAICore(currentUser);
        this.isOpen = false;
        this.currentConversation = null;
        this.init();
    }

    async init() {
        const result = await this.core.initialize();
        if (result.success) {
            this.userInfo = result.userInfo;
            this.capabilities = result.capabilities;
            this.createChatButton();
            this.createChatWindow();
            console.log('✅ ITWS AI جاهز', result);
        }
    }

    createChatButton() {
        const button = document.createElement('div');
        button.className = 'itws-ai-button';
        button.innerHTML = `
            <i class="fas fa-robot"></i>
            <span class="itws-ai-tooltip">ITWS AI - المساعد الذكي</span>
        `;
        button.onclick = () => this.toggleChat();
        document.body.appendChild(button);

        // إضافة التنسيقات
        const style = document.createElement('style');
        style.textContent = `
            .itws-ai-button {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 55px;
                height: 55px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102,126,234,0.4);
                z-index: 9999;
                transition: all 0.3s;
                border: 2px solid white;
            }

            .itws-ai-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(102,126,234,0.6);
            }

            .itws-ai-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s;
                margin-bottom: 10px;
                font-family: 'Cairo', sans-serif;
            }

            .itws-ai-button:hover .itws-ai-tooltip {
                opacity: 1;
                visibility: visible;
            }

            .itws-ai-chat {
                position: fixed;
                bottom: 90px;
                left: 20px;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 10000;
                display: none;
                flex-direction: column;
                overflow: hidden;
                direction: rtl;
                font-family: 'Cairo', sans-serif;
                border: 2px solid #667eea;
            }

            .itws-ai-chat.open {
                display: flex;
                animation: slideUp 0.3s ease;
            }

            .itws-ai-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .itws-ai-header h4 {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                font-size: 14px;
            }

            .itws-ai-header h4 i {
                font-size: 18px;
            }

            .itws-ai-user-badge {
                background: rgba(255,255,255,0.2);
                padding: 3px 8px;
                border-radius: 15px;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .itws-ai-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0 5px;
            }

            .itws-ai-close:hover {
                opacity: 0.8;
            }

            .itws-ai-body {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                background: #f8f9fa;
            }

            .itws-ai-message {
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }

            .itws-ai-message.user {
                flex-direction: row-reverse;
            }

            .itws-ai-avatar {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                flex-shrink: 0;
                font-size: 14px;
            }

            .itws-ai-message.ai .itws-ai-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .itws-ai-message.user .itws-ai-avatar {
                background: #ff6b6b;
            }

            .itws-ai-content {
                padding: 8px 12px;
                border-radius: 12px;
                max-width: 85%;
                word-wrap: break-word;
                font-size: 13px;
                line-height: 1.5;
            }

            .itws-ai-message.ai .itws-ai-content {
                background: white;
                border: 1px solid #e0e0e0;
                border-top-right-radius: 0;
            }

            .itws-ai-message.user .itws-ai-content {
                background: #667eea;
                color: white;
                border-top-left-radius: 0;
            }

            .itws-ai-footer {
                padding: 12px;
                border-top: 1px solid #eee;
                background: white;
                display: flex;
                gap: 8px;
            }

            .itws-ai-footer input {
                flex: 1;
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 20px;
                outline: none;
                font-family: 'Cairo', sans-serif;
                font-size: 13px;
            }

            .itws-ai-footer input:focus {
                border-color: #667eea;
            }

            .itws-ai-footer button {
                width: 38px;
                height: 38px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .itws-ai-footer button:hover {
                transform: scale(1.05);
            }

            .itws-ai-typing {
                display: flex;
                gap: 4px;
                padding: 10px;
                background: white;
                border-radius: 15px;
                width: fit-content;
            }

            .itws-ai-typing span {
                width: 6px;
                height: 6px;
                background: #667eea;
                border-radius: 50%;
                animation: typing 1s infinite ease-in-out;
            }

            .itws-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
            .itws-ai-typing span:nth-child(3) { animation-delay: 0.4s; }

            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-6px); }
            }

            .itws-ai-suggestions {
                padding: 8px;
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                border-top: 1px solid #eee;
                background: #f8f9fa;
            }

            .itws-ai-suggestion {
                padding: 4px 10px;
                background: white;
                border: 1px solid #667eea;
                border-radius: 15px;
                font-size: 11px;
                cursor: pointer;
                color: #667eea;
                transition: all 0.2s;
            }

            .itws-ai-suggestion:hover {
                background: #667eea;
                color: white;
            }

            .itws-ai-capabilities {
                font-size: 11px;
                color: #666;
                margin-top: 5px;
                padding: 5px;
                background: rgba(102,126,234,0.1);
                border-radius: 8px;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    createChatWindow() {
        const chat = document.createElement('div');
        chat.className = 'itws-ai-chat';
        chat.id = 'itwsAIChat';
        
        chat.innerHTML = `
            <div class="itws-ai-header">
                <h4>
                    <i class="fas fa-robot"></i>
                    ITWS AI
                </h4>
                <div class="itws-ai-user-badge">
                    <i class="fas ${this.userInfo.icon}"></i>
                    ${this.userInfo.name}
                </div>
                <button class="itws-ai-close" onclick="document.getElementById('itwsAIChat').classList.remove('open')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="itws-ai-body" id="aiChatBody">
                <div class="itws-ai-message ai">
                    <div class="itws-ai-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="itws-ai-content">
                        ${this.userInfo.description}
                        <div class="itws-ai-capabilities">
                            <small>✨ يمكنني مساعدتك في:</small><br>
                            ${this.capabilities.map(c => `• ${c}`).join('<br>')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="itws-ai-suggestions" id="aiSuggestions"></div>
            <div class="itws-ai-footer">
                <input type="text" id="aiMessageInput" placeholder="اكتب سؤالك..." onkeypress="if(event.key === 'Enter') aiInterface.sendMessage()">
                <button onclick="aiInterface.sendMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(chat);
        this.updateSuggestions();
    }

    updateSuggestions() {
        const suggestions = this.core.getSuggestionsForUser(this.core.getUserInfo());
        const container = document.getElementById('aiSuggestions');
        if (container) {
            container.innerHTML = suggestions.map(s => 
                `<span class="itws-ai-suggestion" onclick="aiInterface.sendSuggestion('${s}')">${s}</span>`
            ).join('');
        }
    }

    toggleChat() {
        const chat = document.getElementById('itwsAIChat');
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            chat.classList.add('open');
            setTimeout(() => document.getElementById('aiMessageInput')?.focus(), 300);
        } else {
            chat.classList.remove('open');
        }
    }

    async sendMessage() {
        const input = document.getElementById('aiMessageInput');
        const message = input.value.trim();
        
        if (!message) return;

        const chatBody = document.getElementById('aiChatBody');
        
        // إضافة رسالة المستخدم
        chatBody.innerHTML += `
            <div class="itws-ai-message user">
                <div class="itws-ai-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="itws-ai-content">
                    ${this.escapeHtml(message)}
                </div>
            </div>
        `;
        
        input.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // إضافة مؤشر الكتابة
        const typingId = 'typing_' + Date.now();
        chatBody.innerHTML += `
            <div class="itws-ai-message ai" id="${typingId}">
                <div class="itws-ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="itws-ai-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const response = await this.core.processMessage(message, this.currentConversation);
            
            document.getElementById(typingId)?.remove();
            
            if (response.success) {
                this.currentConversation = response.conversationId;
                
                chatBody.innerHTML += `
                    <div class="itws-ai-message ai">
                        <div class="itws-ai-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="itws-ai-content">
                            ${this.formatResponse(response.message)}
                        </div>
                    </div>
                `;

                if (response.suggestions) {
                    this.updateSuggestions();
                }
            } else {
                chatBody.innerHTML += `
                    <div class="itws-ai-message ai">
                        <div class="itws-ai-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="itws-ai-content" style="color: #dc3545;">
                            ⚠️ ${this.escapeHtml(response.error)}
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById(typingId)?.remove();
            chatBody.innerHTML += `
                <div class="itws-ai-message ai">
                    <div class="itws-ai-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="itws-ai-content" style="color: #dc3545;">
                        ⚠️ حدث خطأ. يرجى المحاولة مرة أخرى.
                    </div>
                </div>
            `;
        }

        chatBody.scrollTop = chatBody.scrollHeight;
    }

    sendSuggestion(text) {
        document.getElementById('aiMessageInput').value = text;
        this.sendMessage();
    }

    formatResponse(text) {
        let formatted = this.escapeHtml(text);
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/- (.*?)(?:\n|$)/g, '• $1<br>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default ITWSAIInterface;
