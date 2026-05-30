document.addEventListener('DOMContentLoaded', () => {
    // State
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    
    // Elements
    const screens = {
        setup: document.getElementById('setup-screen'),
        chat: document.getElementById('chat-screen'),
        result: document.getElementById('result-screen')
    };
    
    const startBtn = document.getElementById('start-btn');
    const questionCountInput = document.getElementById('question-count');
    
    const chatMessages = document.getElementById('chat-messages');
    const userAnswerInput = document.getElementById('user-answer');
    const sendBtn = document.getElementById('send-btn');
    const inputArea = document.getElementById('input-area');
    const evaluationArea = document.getElementById('evaluation-area');
    
    const currentQNumEl = document.getElementById('current-q-num');
    const totalQNumEl = document.getElementById('total-q-num');
    const currentScoreEl = document.getElementById('current-score');
    
    const evalYesBtn = document.getElementById('eval-yes');
    const evalNoBtn = document.getElementById('eval-no');
    
    const finalScoreDisplay = document.getElementById('final-score-display');
    const resultMessage = document.getElementById('result-message');
    const restartBtn = document.getElementById('restart-btn');

    // Navigation
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    // Chat Utilities
    function appendMessage(sender, text, theme = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        if (theme) {
            const themeDiv = document.createElement('div');
            themeDiv.className = 'theme-badge';
            themeDiv.textContent = theme;
            msgDiv.appendChild(themeDiv);
        }
        
        const textDiv = document.createElement('div');
        textDiv.textContent = text;
        msgDiv.appendChild(textDiv);
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Game Flow
    async function startGame() {
        let count = parseInt(questionCountInput.value) || 10;
        if (count < 1) count = 1;
        if (count > 100) count = 100;

        startBtn.textContent = "Chargement...";
        startBtn.disabled = true;

        try {
            const res = await fetch(`/api/questions?count=${count}`);
            if (!res.ok) throw new Error("Erreur réseau");
            questions = await res.json();
            
            currentQuestionIndex = 0;
            score = 0;
            chatMessages.innerHTML = '';
            
            totalQNumEl.textContent = questions.length;
            updateScoreDisplay();
            
            showScreen('chat');
            await askCurrentQuestion();
            
        } catch (error) {
            alert("Erreur lors du chargement des questions.");
            console.error(error);
        } finally {
            startBtn.textContent = "Commencer l'entraînement";
            startBtn.disabled = false;
        }
    }

    async function askCurrentQuestion() {
        currentQNumEl.textContent = currentQuestionIndex + 1;
        inputArea.classList.remove('hidden');
        evaluationArea.classList.add('hidden');
        userAnswerInput.value = '';
        userAnswerInput.focus();

        const q = questions[currentQuestionIndex];
        const themeText = `${q.theme} - ${q.category}`;
        
        await delay(500);
        appendMessage('bot', q.question, themeText);
    }

    function submitAnswer() {
        const text = userAnswerInput.value.trim();
        if (!text) return;

        // Display user message
        appendMessage('user', text);
        
        // Hide input, show evaluation
        inputArea.classList.add('hidden');
        
        setTimeout(() => {
            const q = questions[currentQuestionIndex];
            appendMessage('system', "Réponse officielle :");
            appendMessage('bot', q.answer);
            
            setTimeout(() => {
                evaluationArea.classList.remove('hidden');
            }, 800);
        }, 600);
    }

    async function handleEvaluation(isCorrect) {
        evaluationArea.classList.add('hidden');
        
        if (isCorrect) {
            score++;
            updateScoreDisplay();
            appendMessage('system', "✅ Point accordé !");
        } else {
            appendMessage('system', "❌ Pas de point.");
        }

        currentQuestionIndex++;
        
        await delay(1500);
        
        if (currentQuestionIndex < questions.length) {
            askCurrentQuestion();
        } else {
            endGame();
        }
    }

    function updateScoreDisplay() {
        currentScoreEl.textContent = score;
    }

    function endGame() {
        finalScoreDisplay.textContent = `${score}/${questions.length}`;
        
        const percentage = score / questions.length;
        if (percentage >= 0.8) {
            resultMessage.textContent = "Excellent travail ! Vous êtes prêt.";
            finalScoreDisplay.style.color = "var(--success)";
        } else if (percentage >= 0.5) {
            resultMessage.textContent = "Pas mal, mais il faut encore s'entraîner.";
            finalScoreDisplay.style.color = "#F59E0B"; // amber
        } else {
            resultMessage.textContent = "Il va falloir réviser le code !";
            finalScoreDisplay.style.color = "var(--danger)";
        }
        
        showScreen('result');
    }

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    
    sendBtn.addEventListener('click', submitAnswer);
    userAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitAnswer();
    });
    
    evalYesBtn.addEventListener('click', () => handleEvaluation(true));
    evalNoBtn.addEventListener('click', () => handleEvaluation(false));
    
    restartBtn.addEventListener('click', () => {
        showScreen('setup');
    });
});
