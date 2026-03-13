// ==========================================
// SECURE PROCTORED ASSESSMENT PLATFORM
// Stage 0: Welcome Screen
// Stage 1: ID Verification
// Stage 2: Selfie with ID Card (5 sec countdown)
// Stage 3: Audio-based Q&A Assessment
// Features: Fullscreen Lock, Location Tracking, Keystroke Monitoring (Background)
// ==========================================

class SecureAssessmentPlatform {
    constructor() {
        // Security Layer Properties
        this.base64Image = null;
        this.userIdentity = null;
        this.isVerified = false;
        this.selfieBase64 = null;

        // Location Tracking Properties
        this.userLocation = {
            latitude: null,
            longitude: null,
            city: 'Unknown',
            state: 'Unknown',
            country: 'Unknown',
            fullAddress: 'Location not available'
        };
        this.locationCaptured = false;

        // Proctoring Properties (Background - No Display)
        this.hasMultipleMonitors = false;
        this.tabSwitchCount = 0;
        this.isFullscreenLocked = false;
        this.proctoringLogs = [];

        // Keystroke Monitoring Properties (Background - No Display)
        this.keystrokeCount = 0;
        this.keystrokeThreshold = 3;
        this.keystrokeExceeded = false;
        this.keystrokeDetails = [];

        // Assessment Properties
        this.questions = [
            {
                id: 1,
                question: "Explain what machine learning is and how it differs from traditional programming.",
                category: "AI"
            },
            {
                id: 2,
                question: "Describe how gradient descent works in optimizing a neural network.",
                category: "Optimization"
            },
            {
                id: 3,
                question: "What is overfitting and how can you prevent it?",
                category: "Model Evaluation"
            }
        ];

        this.currentQuestionIndex = 0;
        this.audioBlobs = {};
        this.transcriptions = {};
        this.audioRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.timeRemaining = 5 * 60; // 5 minutes per question
        this.timer = null;
        this.downloadPath = "TTSV1_1";

        // Video Recording Properties
        this.videoMediaRecorder = null;
        this.videoChunks = [];
        this.videoStream = null;
        this.audioStream = null;

        // Selfie Properties
        this.selfieStream = null;
        this.countdownInterval = null;

        this.initWelcomeStage();
    }

    // ========== STAGE 0: WELCOME SCREEN ==========
    initWelcomeStage() {
        const startBtn = document.getElementById('start-btn');
        const policyCheckbox = document.getElementById('policy-agreement-checkbox');

        // Enable/disable start button based on checkbox
        policyCheckbox.addEventListener('change', () => {
            startBtn.disabled = !policyCheckbox.checked;
        });

        startBtn.addEventListener('click', () => {
            if (policyCheckbox.checked) {
                this.logProctoringEvent('Policy Agreement Accepted');
                this.startAssessment();
            }
        });
    }

    startAssessment() {
        document.getElementById('welcome-stage').classList.add('hidden');
        document.getElementById('security-stage').classList.remove('hidden');
        document.getElementById('stage-indicator').textContent = 'Stage 1: ID Verification';
        this.initSecurityStage();
    }

    // ========== STAGE 1: SECURITY LAYER ==========
    initSecurityStage() {
        const fileInput = document.getElementById('file-input');
        const uploadSection = document.getElementById('upload-section');
        const fileName = document.getElementById('file-name');
        const extractBtn = document.getElementById('extract-btn');

        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#667eea';
            uploadSection.style.backgroundColor = '#f1f5ff';
        });

        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#cbd5e0';
            uploadSection.style.backgroundColor = '#f8fafc';
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#cbd5e0';
            uploadSection.style.backgroundColor = '#f8fafc';

            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                this.handleFileChange();
            }
        });

        uploadSection.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => this.handleFileChange());
        extractBtn.addEventListener('click', () => this.extractIDInfo());

        document.getElementById('change-id-btn')?.addEventListener('click', () => {
            fileInput.click();
        });

        document.getElementById('proceed-btn')?.addEventListener('click', () => this.proceedToSelfie());
    }

    handleFileChange() {
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];
        const fileName = document.getElementById('file-name');
        const extractBtn = document.getElementById('extract-btn');
        const resultSection = document.getElementById('result-section');
        const idPreviewSection = document.getElementById('id-preview-section');
        const idCardPreview = document.getElementById('id-card-preview');

        if (!file) {
            extractBtn.disabled = true;
            this.base64Image = null;
            fileName.textContent = '';
            idPreviewSection.classList.add('hidden');
            return;
        }

        fileName.textContent = `Selected: ${file.name}`;

        const reader = new FileReader();
        reader.onload = () => {
            this.base64Image = reader.result.split(',')[1];
            idCardPreview.src = reader.result;
            idPreviewSection.classList.remove('hidden');
            extractBtn.disabled = false;
            resultSection.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    async extractIDInfo() {
        if (!this.base64Image) return;

        const extractBtn = document.getElementById('extract-btn');
        const btnText = document.getElementById('btn-text');
        const resultSection = document.getElementById('result-section');

        extractBtn.disabled = true;
        extractBtn.classList.add('loading');
        btnText.textContent = 'Verifying...';
        resultSection.classList.add('hidden');

        const apiKey = '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';
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        const messages = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Analyze this identity card image carefully and extract the following:
1. Name (full name as shown)
2. Gender (Male/Female/Other)
3. DOB (date of birth in YYYY-MM-DD format)
4. ID (12-digit ID number)

Return in this exact JSON format:
{
    "Name": "...",
    "Gender": "...",
    "DOB": "...",
    "ID": "..."
}`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${this.base64Image}`
                        }
                    }
                ]
            }
        ];

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
                    messages,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                this.showError(`API Error: ${error}`);
                return;
            }

            const json = await response.json();
            const content = json.choices[0].message.content;
            this.userIdentity = JSON.parse(content);
            this.isVerified = true;

            await this.extractPhotoFromID();
            this.displayResults(this.userIdentity);

        } catch (error) {
            this.showError(`Request failed: ${error.message}`);
        } finally {
            extractBtn.disabled = false;
            extractBtn.classList.remove('loading');
            btnText.textContent = 'Verify Identity';
        }
    }

    async extractPhotoFromID() {
        try {
            const photoPreviewSection = document.getElementById('photo-preview-section');
            const extractedPhoto = document.getElementById('extracted-photo');

            extractedPhoto.src = `data:image/jpeg;base64,${this.base64Image}`;
            extractedPhoto.style.width = '200px';
            extractedPhoto.style.height = 'auto';
            photoPreviewSection.classList.remove('hidden');

            this.userIdentity.PhotoBase64 = this.base64Image;
        } catch (error) {
            console.error('Photo extraction failed:', error);
        }
    }

    displayResults(data) {
        const outputCards = document.getElementById('output-cards');
        const resultSection = document.getElementById('result-section');

        outputCards.innerHTML = '';

        const fields = [
            { label: 'Name', value: data.Name || 'N/A' },
            { label: 'Gender', value: data.Gender || 'N/A' },
            { label: 'Date of Birth', value: data.DOB || 'N/A' },
            { label: 'ID Number', value: data.ID || 'N/A' }
        ];

        fields.forEach(field => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `
                <label>${field.label}</label>
                <div class="value">${field.value}</div>
            `;
            outputCards.appendChild(card);
        });

        resultSection.classList.remove('hidden');
    }

    showError(message) {
        const errorSection = document.getElementById('error-section');
        errorSection.innerHTML = `<div class="error">${message}</div>`;
        setTimeout(() => errorSection.innerHTML = '', 5000);
    }

    proceedToSelfie() {
        if (!this.isVerified) {
            this.showError('Please verify your identity first.');
            return;
        }

        document.getElementById('security-stage').classList.add('hidden');
        document.getElementById('selfie-stage').classList.remove('hidden');
        document.getElementById('stage-indicator').textContent = 'Stage 2: Selfie Verification';
        this.initSelfieStage();
    }

    // ========== STAGE 2: SELFIE WITH ID CARD ==========
    async initSelfieStage() {
        const video = document.getElementById('selfie-preview');
        const startSelfieBtn = document.getElementById('start-selfie-btn');
        const retakeSelfieBtn = document.getElementById('retake-selfie-btn');
        const proceedBtn = document.getElementById('proceed-to-assessment-btn');

        try {
            this.selfieStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            video.srcObject = this.selfieStream;
        } catch (error) {
            this.showError('Camera access denied. Please allow camera access.');
            return;
        }

        startSelfieBtn.addEventListener('click', () => this.startSelfieCountdown());
        retakeSelfieBtn.addEventListener('click', () => this.retakeSelfie());
        proceedBtn.addEventListener('click', () => this.proceedToAssessment());
    }

    startSelfieCountdown() {
        const countdownOverlay = document.getElementById('countdown-overlay');
        const countdownNumber = document.getElementById('countdown-number');
        const startBtn = document.getElementById('start-selfie-btn');

        startBtn.disabled = true;
        countdownOverlay.classList.remove('hidden');

        let count = 5;
        countdownNumber.textContent = count;

        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
            } else {
                clearInterval(this.countdownInterval);
                this.captureSelfie();
            }
        }, 1000);
    }

    captureSelfie() {
        const video = document.getElementById('selfie-preview');
        const canvas = document.getElementById('selfie-canvas');
        const ctx = canvas.getContext('2d');
        const countdownOverlay = document.getElementById('countdown-overlay');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw mirrored image
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.selfieBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

        // Stop camera stream
        this.selfieStream.getTracks().forEach(track => track.stop());

        // Display captured selfie
        document.getElementById('selfie-camera-section').classList.add('hidden');
        document.getElementById('selfie-result-section').classList.remove('hidden');
        document.getElementById('captured-selfie-img').src = `data:image/jpeg;base64,${this.selfieBase64}`;
        countdownOverlay.classList.add('hidden');
    }

    retakeSelfie() {
        document.getElementById('selfie-result-section').classList.add('hidden');
        document.getElementById('selfie-camera-section').classList.remove('hidden');
        document.getElementById('start-selfie-btn').disabled = false;
        this.initSelfieStage();
    }

    async proceedToAssessment() {
        if (!this.selfieBase64) {
            this.showError('Please capture your selfie first.');
            return;
        }

        document.getElementById('selfie-stage').classList.add('hidden');
        document.getElementById('assessment-stage').classList.remove('hidden');
        document.getElementById('stage-indicator').textContent = 'Stage 3: Technical Assessment';

        await this.captureLocation();
        await this.initAssessmentStage();
    }

    // ========== LOCATION CAPTURE ==========
    async captureLocation() {
        if (!navigator.geolocation) {
            this.logProctoringEvent('Geolocation not supported');
            return;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.userLocation.latitude = position.coords.latitude;
                    this.userLocation.longitude = position.coords.longitude;

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.userLocation.latitude}&lon=${this.userLocation.longitude}`
                        );
                        const data = await response.json();

                        this.userLocation.city = data.address.city || data.address.town || 'Unknown';
                        this.userLocation.state = data.address.state || 'Unknown';
                        this.userLocation.country = data.address.country || 'Unknown';
                        this.userLocation.fullAddress = data.display_name || 'Location not available';

                        this.locationCaptured = true;
                        this.logProctoringEvent(`Location captured: ${this.userLocation.fullAddress}`);
                    } catch (error) {
                        this.logProctoringEvent('Location reverse geocoding failed');
                    }

                    resolve();
                },
                (error) => {
                    this.logProctoringEvent(`Location access denied: ${error.message}`);
                    resolve();
                }
            );
        });
    }

    // ========== STAGE 3: ASSESSMENT ==========
    async initAssessmentStage() {
        await this.setupMediaStreams();
        await this.requestFullscreen();
        this.setupProctoringMonitors();
        this.setupKeystrokeMonitoring();
        this.displayQuestion();
        this.startTimer();

        document.getElementById('record-btn').addEventListener('click', () => this.startRecording());
        document.getElementById('stop-recording-btn').addEventListener('click', () => this.stopRecording());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('finish-btn').addEventListener('click', () => this.finishAssessment());
    }

    async setupMediaStreams() {
        const video = document.getElementById('video-preview');

        try {
            // Get video stream for display
            this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
            });
            video.srcObject = this.videoStream;

            // Get separate audio stream for question recording
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                video: false, 
                audio: true 
            });

            // Combine video and audio streams for full recording
            const combinedStream = new MediaStream([
                ...this.videoStream.getVideoTracks(),
                ...this.audioStream.getAudioTracks()
            ]);

            // Start video recording with both video and audio
            this.videoMediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            this.videoChunks = [];

            this.videoMediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.videoChunks.push(e.data);
                }
            };

            this.videoMediaRecorder.start();
            this.logProctoringEvent('Video recording started with audio');
            console.log('✅ Video recording started successfully');

        } catch (error) {
            this.showError('Camera/microphone access required for assessment.');
            this.logProctoringEvent(`Media setup error: ${error.message}`);
            console.error('❌ Media setup failed:', error);
        }
    }

    async requestFullscreen() {
        try {
            await document.documentElement.requestFullscreen();
            this.isFullscreenLocked = true;
            this.logProctoringEvent('Fullscreen mode activated');
        } catch (error) {
            this.logProctoringEvent('Fullscreen request failed');
        }

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && this.isFullscreenLocked) {
                this.logProctoringEvent('Fullscreen exit attempt detected');
                document.documentElement.requestFullscreen();
            }
        });
    }

    setupProctoringMonitors() {
        // Monitor multiple screens (background)
        if (window.screen.isExtended) {
            this.hasMultipleMonitors = true;
            this.logProctoringEvent('Multiple monitors detected');
        }

        // Monitor tab switching (background)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.tabSwitchCount++;
                this.logProctoringEvent(`Tab switch detected. Count: ${this.tabSwitchCount}`);
            }
        });

        // Monitor window blur (background)
        window.addEventListener('blur', () => {
            this.logProctoringEvent('Window lost focus');
        });
    }

    setupKeystrokeMonitoring() {
        // Keystroke monitoring runs in background - no UI display
        document.addEventListener('keydown', (e) => {
            this.keystrokeCount++;
            this.keystrokeDetails.push({
                key: e.key,
                timestamp: new Date().toISOString(),
                questionId: this.questions[this.currentQuestionIndex].id
            });

            if (this.keystrokeCount > this.keystrokeThreshold) {
                this.keystrokeExceeded = true;
                this.logProctoringEvent(`Keystroke threshold exceeded. Count: ${this.keystrokeCount}`);
            }
        });
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];

        document.getElementById('question-number').textContent = `Question ${question.id}`;
        document.getElementById('question-category').textContent = question.category;
        document.getElementById('question-text').textContent = question.question;
        document.getElementById('question-info').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;

        // Update progress bar
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.currentQuestionIndex === 0;
        document.getElementById('next-btn').disabled = 
            this.currentQuestionIndex === this.questions.length - 1;

        // Show finish button on last question
        if (this.currentQuestionIndex === this.questions.length - 1) {
            document.getElementById('finish-btn').classList.remove('hidden');
        } else {
            document.getElementById('finish-btn').classList.add('hidden');
        }

        // Update recording indicator
        const recorded = this.audioBlobs[question.id];
        document.getElementById('recorded-indicator').textContent = 
            recorded ? '✅ Answer recorded' : '';
        document.getElementById('recorded-indicator').classList.toggle('hidden', !recorded);

        // Reset UI state for the current question
        this.updateRecordingUI();

        // Reset timer for new question
        this.timeRemaining = 5 * 60; // 5 minutes
        this.updateTimerDisplay();

        // Read question aloud using Text-to-Speech
        this.speakQuestion(question.question);
    }

    // ========== TEXT-TO-SPEECH ==========
    speakQuestion(text) {
        // Stop any ongoing speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        // Create utterance and speak
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
        this.logProctoringEvent(`Question ${this.questions[this.currentQuestionIndex].id} read aloud`);
    }

    updateRecordingUI() {
        // Update button visibility based on recording state
        if (this.isRecording) {
            document.getElementById('record-btn').classList.add('hidden');
            document.getElementById('stop-recording-btn').classList.remove('hidden');
            document.getElementById('recording-status').classList.remove('hidden');
        } else {
            document.getElementById('record-btn').classList.remove('hidden');
            document.getElementById('stop-recording-btn').classList.add('hidden');
            document.getElementById('recording-status').classList.add('hidden');
        }
    }

    startRecording() {
        if (!this.audioStream || this.isRecording) return;

        this.recordedChunks = [];
        this.audioRecorder = new MediaRecorder(this.audioStream);

        this.audioRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.audioRecorder.onstop = async () => {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const questionId = this.questions[this.currentQuestionIndex].id;
            this.audioBlobs[questionId] = blob;
            this.recordedChunks = [];

            // Transcribe audio immediately after recording stops
            await this.transcribeAudio(questionId, blob);

            document.getElementById('recorded-indicator').textContent = '✅ Answer recorded';
            document.getElementById('recorded-indicator').classList.remove('hidden');

            this.logProctoringEvent(`Answer saved for question ${questionId}`);
        };

        this.audioRecorder.start();
        this.isRecording = true;

        this.updateRecordingUI();

        this.logProctoringEvent(`Started recording answer for question ${this.questions[this.currentQuestionIndex].id}`);
    }

    stopRecording() {
        if (!this.audioRecorder || !this.isRecording) return;

        this.audioRecorder.stop();
        this.isRecording = false;

        this.updateRecordingUI();

        this.logProctoringEvent(`Stopped recording answer for question ${this.questions[this.currentQuestionIndex].id}`);
    }

    // ========== AUDIO TRANSCRIPTION ==========
    async transcribeAudio(questionId, audioBlob) {
        try {
            const apiKey = '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';
            const url = 'https://api.groq.com/openai/v1/audio/transcriptions';

            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('response_format', 'json');
            formData.append('language', 'en');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Transcription failed: ${response.statusText}`);
            }

            const result = await response.json();
            const transcription = result.text;

            // Store transcription
            this.transcriptions[questionId] = transcription;
            console.log(`✅ Transcription saved for question ${questionId}: ${transcription}`);
            this.logProctoringEvent(`Transcription completed for question ${questionId}`);

        } catch (error) {
            console.error(`❌ Failed to transcribe question ${questionId}:`, error);
            this.transcriptions[questionId] = '[Transcription failed]';
            this.logProctoringEvent(`Transcription error for question ${questionId}: ${error.message}`);
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                this.finishAssessment();
                return;
            }

            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            // Auto-stop recording if currently recording
            if (this.isRecording) {
                this.stopRecording();
            }
            
            this.currentQuestionIndex--;
            this.displayQuestion();
            // Reset timer for previous question
            this.timeRemaining = 5 * 60;
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            // Auto-stop recording if currently recording
            if (this.isRecording) {
                this.stopRecording();
            }
            
            this.currentQuestionIndex++;
            this.displayQuestion();
            // Reset timer for next question
            this.timeRemaining = 5 * 60;
        }
    }

    async finishAssessment() {
        clearInterval(this.timer);

        // Stop any ongoing speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        if (this.isRecording) {
            this.stopRecording();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        document.getElementById('assessment-stage').classList.add('hidden');
        document.getElementById('completion-stage').classList.remove('hidden');
        document.getElementById('stage-indicator').textContent = 'Processing...';

        // Stop video recording
        if (this.videoMediaRecorder && this.videoMediaRecorder.state !== 'inactive') {
            this.videoMediaRecorder.stop();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Stop all media streams
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }

        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }

        this.logProctoringEvent('Assessment completed');

        await this.generateReport();
    }

    async generateReport() {
        // Compile all Q&A data into single JSON with real transcriptions
        const qaData = this.questions.map(q => ({
            questionId: q.id,
            question: q.question,
            category: q.category,
            answer: this.transcriptions[q.id] || 'No answer recorded',
            hasAudioRecording: !!this.audioBlobs[q.id]
        }));

        const reportData = {
            candidateInfo: this.userIdentity,
            location: this.userLocation,
            questionsAndAnswers: qaData,
            proctoringData: {
                multipleMonitorsDetected: this.hasMultipleMonitors,
                tabSwitchCount: this.tabSwitchCount,
                keystrokeCount: this.keystrokeCount,
                keystrokeThresholdExceeded: this.keystrokeExceeded,
                keystrokeDetails: this.keystrokeDetails,
                proctoringLogs: this.proctoringLogs
            },
            timestamp: new Date().toISOString()
        };

        // Download JSON report
        const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { 
            type: 'application/json' 
        });
        this.downloadFile(jsonBlob, `${this.downloadPath}_assessment_report.json`);

        // Download ID card image
        if (this.base64Image) {
            const idBlob = this.base64ToBlob(this.base64Image, 'image/jpeg');
            this.downloadFile(idBlob, `${this.downloadPath}_id_card.jpg`);
        }

        // Download selfie
        if (this.selfieBase64) {
            const selfieBlob = this.base64ToBlob(this.selfieBase64, 'image/jpeg');
            this.downloadFile(selfieBlob, `${this.downloadPath}_selfie.jpg`);
        }

        // Download audio recordings
        for (const [questionId, blob] of Object.entries(this.audioBlobs)) {
            this.downloadFile(blob, `${this.downloadPath}_question_${questionId}_audio.webm`);
        }

        // Download video recording
        if (this.videoChunks.length > 0) {
            const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' });
            this.downloadFile(videoBlob, `${this.downloadPath}_video_recording.webm`);
            console.log('✅ Video downloaded successfully');
        } else {
            console.warn('⚠️ No video chunks recorded');
        }

        setTimeout(() => {
            document.querySelector('.loading').classList.add('hidden');
            document.getElementById('success-container').classList.remove('hidden');
        }, 2000);
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);

            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: mimeType });
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    logProctoringEvent(event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event
        };
        this.proctoringLogs.push(logEntry);
        console.log(`[PROCTORING] ${event}`);
    }
}

// Initialize the platform
const platform = new SecureAssessmentPlatform();
