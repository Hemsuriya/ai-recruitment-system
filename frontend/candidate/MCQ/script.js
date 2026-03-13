// Enhanced Two-Stage Assessment Platform: Survey Validation → Technical Assessment
class AssessmentPlatform {
    constructor() {
        // Technical assessment data
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = {};
        
        // Survey assessment data
        this.surveyQuestions = [];
        this.currentSurveyIndex = 0;
        this.surveyAnswers = {};
        this.surveyValidationStatus = 'pending'; // pending, passed, failed
        
        // Timing and flow control
        this.startTime = null;
        this.timeLimit = 30 * 60; // 30 minutes for technical assessment only
        this.timeRemaining = this.timeLimit;
        this.timer = null;
        this.screeningId = null;
        this.assessmentStage = 'instructions'; // instructions, verification, survey, technical, completed
        
        // Candidate and assessment info
        this.candidateInfo = {
            name: 'Unknown Candidate',
            email: 'unknown@example.com',
            company: 'Unknown Company',
            phone: 'Not provided',
            location: 'Unknown Location',
            matchScore: 0
        };
        
        this.assessmentConfig = {};
        this.jobInfo = {};
        this.violations = [];
        
        // Aadhaar verification properties
        this.aadhaarVerification = {
            verified: false,
            attempts: 0,
            maxAttempts: 3,
            extractedData: null,
            verificationResult: null
        };
        
        this.init();
    }

    init() {
        this.getScreeningId();
        this.setupEventListeners();
        this.initializeCamera();
        this.loadPreVerificationData();
        this.updateStageIndicator('Loading Assessment...');
    }

    getScreeningId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.screeningId = urlParams.get('id');
        
        if (!this.screeningId) {
            this.screeningId = 'screening_data_test123';
            console.log('No screening ID provided, using test ID:', this.screeningId);
        }
        
        console.log('Using screening ID:', this.screeningId);
    }

    setupEventListeners() {
        // Instructions and verification listeners
        document.getElementById('start-verification-btn').addEventListener('click', () => this.startVerification());
        
        // Technical assessment listeners
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        
        // Survey navigation listeners
        document.getElementById('survey-prev-btn').addEventListener('click', () => this.previousSurveyQuestion());
        document.getElementById('survey-next-btn').addEventListener('click', () => this.nextSurveyQuestion());
        
        // Submission listeners
        document.getElementById('back-to-review').addEventListener('click', () => this.backToReview());
        document.getElementById('final-submit').addEventListener('click', () => this.submitAssessment());

        // Aadhaar verification listeners
        document.getElementById('start-camera-btn').addEventListener('click', () => this.startAadhaarCamera());
        document.getElementById('capture-aadhaar-btn').addEventListener('click', () => this.captureAadhaar());
        document.getElementById('stop-camera-btn').addEventListener('click', () => this.stopAadhaarCamera());
        document.getElementById('retake-btn').addEventListener('click', () => this.retakePhoto());
        document.getElementById('verify-btn').addEventListener('click', () => this.verifyAadhaar());
        document.getElementById('proceed-to-survey-btn').addEventListener('click', () => this.proceedToSurveyStage());
        document.getElementById('retry-verification-btn').addEventListener('click', () => this.retryVerification());

        // File upload listeners
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('aadhaar-file');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Anti-cheating measures (only active during technical assessment)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('blur', () => this.handleWindowBlur());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 200, height: 150 } 
            });
            document.getElementById('video').srcObject = stream;
        } catch (error) {
            this.showError('Camera access is required for this assessment. Please enable camera permissions and refresh.');
        }
    }

    updateStageIndicator(text) {
        document.getElementById('current-stage-text').textContent = text;
    }

    // ===== STAGE 1: LOAD PRE-VERIFICATION DATA =====
    async loadPreVerificationData() {
        try {
            console.log('=== STAGE 1: Loading pre-verification data (Survey Questions) ===');
            this.updateStageIndicator('Loading Assessment Information...');
            
            const infoUrl = `http://localhost:5678/webhook/get-assessment-info?id=${this.screeningId}`;
            console.log('Fetching pre-verification data from:', infoUrl);
            
            const response = await fetch(infoUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
                                        
            console.log('Pre-verification response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Pre-verification API Response:', result);
            
            if (!result.success || !result.data) {
                throw new Error('Invalid assessment data received from API');
            }
            
            const assessmentData = result.data;
            
            // Store candidate info and job details
            if (assessmentData.session) {
                this.candidateInfo = {
                    name: assessmentData.session.candidateName || 'Unknown Candidate',
                    email: assessmentData.session.candidateEmail || 'unknown@example.com',
                    company: assessmentData.session.candidateCompany || 'Unknown Company',
                    phone: assessmentData.session.candidatePhone || 'Not provided',
                    location: assessmentData.session.candidateLocation || 'Unknown Location',
                    matchScore: assessmentData.session.matchScore || 0
                };
                
                console.log('✅ LOADED CANDIDATE INFO:', this.candidateInfo);
            }
            
            // Store assessment configuration and survey questions
            this.assessmentConfig = assessmentData.assessment || {};
            this.jobInfo = assessmentData.jobInfo || {};
            
            // ✅ CRITICAL: Load SURVEY questions during pre-verification
            this.surveyQuestions = assessmentData.surveyQuestions || [];
            console.log(`✅ Loaded ${this.surveyQuestions.length} survey questions for Stage 1`);
            
            // ✅ IMPORTANT: Technical questions are NOT loaded yet!
            this.questions = []; // Will be loaded after survey validation
            
            // Update UI
            this.displayCandidateInfo();
            this.updateAssessmentInfo();
            
            // Update survey info display
            document.getElementById('survey-total-count').textContent = this.surveyQuestions.length;
            document.getElementById('qualifying-count').textContent = 
                this.surveyQuestions.filter(q => q.isQualifying).length;
            
            console.log('✅ Pre-verification data loaded successfully');
            console.log(`- Survey Questions: ${this.surveyQuestions.length}`);
            console.log(`- Qualifying Questions: ${this.surveyQuestions.filter(q => q.isQualifying).length}`);
            
            this.assessmentStage = 'instructions';
            this.updateStageIndicator('Ready to Begin Two-Stage Assessment');
            this.hideElement('loading-state');
            this.showElement('instructions-state');
            
        } catch (error) {
            console.error('Error loading pre-verification data:', error);
            this.showError(`Failed to load assessment: ${error.message}`);
        }
    }

    displayCandidateInfo() {
        document.getElementById('candidate-name').textContent = this.candidateInfo.name;
        document.getElementById('candidate-email').textContent = this.candidateInfo.email;
        document.getElementById('candidate-company').textContent = this.candidateInfo.company;
        this.showElement('candidate-info');
    }

    updateAssessmentInfo() {
        document.getElementById('assessment-title').textContent = 
            `${this.jobInfo.title || 'Software Engineer'} Assessment`;
        
        // Update time limit display for technical assessment only
        const timeText = this.surveyQuestions.length > 0 ? 
            'No time limit for preferences, 30 minutes for technical questions' :
            '30 minutes for technical questions';
        document.getElementById('time-limit').textContent = timeText;
        
        this.timeLimit = (this.assessmentConfig.timeLimit || 30) * 60;
        this.timeRemaining = this.timeLimit;
    }

    // ===== AADHAAR VERIFICATION METHODS =====
    startVerification() {
        this.assessmentStage = 'verification';
        this.updateStageIndicator('Identity Verification in Progress');
        this.hideElement('instructions-state');
        this.showElement('aadhaar-verification-state');
    }

    async startAadhaarCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            const video = document.getElementById('aadhaar-video');
            video.srcObject = stream;
            video.style.display = 'block';
            
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('capture-aadhaar-btn').style.display = 'inline-block';
            document.getElementById('stop-camera-btn').style.display = 'inline-block';
            
        } catch (error) {
            this.showVerificationError('Camera access required for photo capture. Please enable camera permissions.');
        }
    }

    captureAadhaar() {
        const video = document.getElementById('aadhaar-video');
        const canvas = document.getElementById('aadhaar-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            this.showImagePreview(blob);
        }, 'image/jpeg', 0.8);
        
        this.stopAadhaarCamera();
    }

    stopAadhaarCamera() {
        const video = document.getElementById('aadhaar-video');
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        video.style.display = 'none';
        
        document.getElementById('start-camera-btn').style.display = 'inline-block';
        document.getElementById('capture-aadhaar-btn').style.display = 'none';
        document.getElementById('stop-camera-btn').style.display = 'none';
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('file-upload-area').classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        document.getElementById('file-upload-area').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processSelectedFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processSelectedFile(file);
        }
    }

    processSelectedFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showVerificationError('Please select a valid image file.');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            this.showVerificationError('Image file too large. Please select an image under 10MB.');
            return;
        }
        
        this.showImagePreview(file);
    }

    showImagePreview(imageData) {
        const previewImg = document.getElementById('preview-image');
        
        if (imageData instanceof Blob || imageData instanceof File) {
            previewImg.src = URL.createObjectURL(imageData);
        }
        
        this.currentImageData = imageData;
        this.hideElement('capture-step');
        this.showElement('preview-step');
    }

    retakePhoto() {
        this.hideElement('preview-step');
        this.showElement('capture-step');
        this.currentImageData = null;
        document.getElementById('aadhaar-file').value = '';
    }

    async verifyAadhaar() {
        if (!this.currentImageData) {
            this.showVerificationError('No image selected for verification.');
            return;
        }

        this.aadhaarVerification.attempts++;
        this.updateAttemptsCounter();

        this.hideElement('preview-step');
        this.showElement('processing-step');
        
        try {
            this.updateProcessingStatus('Analyzing image quality...');
            this.updateProcessingStatus('Extracting text from Aadhaar card...');
            const extractedData = await this.performOCR(this.currentImageData);
            
            this.updateProcessingStatus('Validating extracted information...');
            const validationResult = this.validateExtractedData(extractedData);
            
            this.updateProcessingStatus('Completing verification...');
            
            this.aadhaarVerification.extractedData = extractedData;
            this.aadhaarVerification.verificationResult = validationResult;
            
            setTimeout(() => {
                this.showVerificationResult(validationResult);
            }, 1000);
            
        } catch (error) {
            console.error('Verification error:', error);
            this.showVerificationResult({
                success: false,
                error: error.message || 'Failed to process Aadhaar card. Please ensure the image is clear and try again.'
            });
        }
    }

    async performOCR(imageData) {
        console.log('Mock OCR: Processing image...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            aadhaarNumber: '123456789012',
            extractedName: this.candidateInfo.name,
            rawText: `Government of India\n${this.candidateInfo.name}\n1234 5678 9012\nDOB: 01/01/1990`,
            confidence: 85,
            lines: [
                'Government of India',
                this.candidateInfo.name,
                '1234 5678 9012',
                'DOB: 01/01/1990'
            ]
        };
    }

    validateExtractedData(extractedData) {
        const { aadhaarNumber, extractedName, confidence } = extractedData;
        
        if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
            return {
                success: false,
                error: 'Could not detect a valid 12-digit Aadhaar number. Please ensure the card is clearly visible.'
            };
        }
        
        if (confidence < 60) {
            return {
                success: false,
                error: 'Image quality too low. Please capture a clearer image of your Aadhaar card.'
            };
        }
        
        const nameMatch = this.calculateNameSimilarity(extractedName, this.candidateInfo.name);
        
        if (nameMatch < 0.5) {
            return {
                success: false,
                error: `Name mismatch detected. Please ensure this is your Aadhaar card.`,
                nameMatch: nameMatch,
                extractedName: extractedName
            };
        }
        
        return {
            success: true,
            aadhaarNumber: aadhaarNumber,
            extractedName: extractedName,
            nameMatch: nameMatch,
            maskedAadhaar: this.maskAadhaar(aadhaarNumber),
            verified: true,
            verifiedAt: new Date().toISOString()
        };
    }

    calculateNameSimilarity(name1, name2) {
        if (!name1 || !name2) return 0;
        
        const normalize = (str) => str.toLowerCase().replace(/[^a-z]/g, '');
        const n1 = normalize(name1);
        const n2 = normalize(name2);
        
        if (n1 === n2) return 1.0;
        if (n1.includes(n2) || n2.includes(n1)) return 0.8;
        
        const common = [...n1].filter(char => n2.includes(char)).length;
        const total = Math.max(n1.length, n2.length);
        
        return common / total;
    }

    maskAadhaar(aadhaar) {
        return `XXXX-XXXX-${aadhaar.slice(-4)}`;
    }

    updateProcessingStatus(status) {
        document.getElementById('processing-status').textContent = status;
    }

    updateAttemptsCounter() {
        const remaining = this.aadhaarVerification.maxAttempts - this.aadhaarVerification.attempts;
        document.getElementById('attempts-remaining').textContent = remaining;
    }

    showVerificationResult(result) {
        this.hideElement('processing-step');
        
        const resultDiv = document.getElementById('verification-result');
        const titleElement = document.getElementById('result-title');
        const messageElement = document.getElementById('result-message');
        const extractedInfoDiv = document.getElementById('extracted-info');
        
        if (result.success) {
            resultDiv.className = 'verification-result success';
            titleElement.textContent = '✅ Verification Successful';
            messageElement.textContent = 'Your identity has been verified successfully. You can now proceed to the preference screening.';
            
            document.getElementById('extracted-aadhaar').textContent = result.maskedAadhaar;
            document.getElementById('extracted-name').textContent = result.extractedName;
            
            this.showElement('extracted-info');
            this.showElement('proceed-to-survey-btn');
            this.aadhaarVerification.verified = true;
            
        } else {
            resultDiv.className = 'verification-result error';
            titleElement.textContent = '❌ Verification Failed';
            messageElement.textContent = result.error;
            
            this.hideElement('extracted-info');
            
            const attemptsLeft = this.aadhaarVerification.maxAttempts - this.aadhaarVerification.attempts;
            if (attemptsLeft > 0) {
                this.showElement('retry-verification-btn');
                messageElement.textContent += ` You have ${attemptsLeft} attempt(s) remaining.`;
            } else {
                messageElement.textContent += ' Maximum attempts reached. Please contact support for assistance.';
            }
        }
        
        this.showElement('verification-result');
    }

    showVerificationError(message) {
        const resultDiv = document.getElementById('verification-result');
        resultDiv.className = 'verification-result error';
        document.getElementById('result-title').textContent = '⚠️ Verification Error';
        document.getElementById('result-message').textContent = message;
        this.showElement('verification-result');
    }

    retryVerification() {
        this.hideElement('verification-result');
        this.showElement('capture-step');
        this.currentImageData = null;
        document.getElementById('aadhaar-file').value = '';
    }

    // ===== STAGE 2: SURVEY QUESTIONS (PREFERENCE SCREENING) =====
    proceedToSurveyStage() {
        if (!this.aadhaarVerification.verified) {
            this.showVerificationError('Identity verification required before proceeding.');
            return;
        }
        
        console.log('=== STAGE 2: Starting Preference Screening ===');
        this.assessmentStage = 'survey';
        this.updateStageIndicator('Stage 1: Preference Screening');
        
        this.hideElement('aadhaar-verification-state');
        this.showElement('survey-section');
        this.currentSurveyIndex = 0;
        this.displaySurveyQuestion();
    }

    displaySurveyQuestion() {
        if (this.surveyQuestions.length === 0) {
            console.log('No survey questions found, proceeding to technical assessment');
            this.proceedToTechnicalAssessment();
            return;
        }

        const question = this.surveyQuestions[this.currentSurveyIndex];
        if (!question) {
            this.completeSurveySection();
            return;
        }

        // Update question info
        document.getElementById('survey-question-number').textContent = 
            `Question ${this.currentSurveyIndex + 1} of ${this.surveyQuestions.length}`;
        
        // Show if qualifying or informational
        const questionType = question.isQualifying ? 'Qualifying ⭐' : 'Informational ℹ️';
        document.getElementById('survey-question-type').textContent = questionType;
        
        document.getElementById('survey-question-text').textContent = question.questionText;
        document.getElementById('survey-question-info').textContent = 
            `Question ${this.currentSurveyIndex + 1} of ${this.surveyQuestions.length}`;

        // Update progress
        const progress = ((this.currentSurveyIndex + 1) / this.surveyQuestions.length) * 100;
        document.getElementById('survey-progress-bar').style.width = `${progress}%`;

        // Render question options
        this.renderSurveyOptions(question);

        // Update navigation
        document.getElementById('survey-prev-btn').disabled = this.currentSurveyIndex === 0;
        document.getElementById('survey-next-btn').textContent = 
            this.currentSurveyIndex === this.surveyQuestions.length - 1 ? 'Submit Preferences' : 'Next';
    }

    renderSurveyOptions(question) {
        const optionsContainer = document.getElementById('survey-options-container');
        optionsContainer.innerHTML = '';

        if (question.questionType === 'text') {
            // Text input
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'survey-text-input';
            textInput.placeholder = 'Please provide your answer...';
            textInput.value = this.surveyAnswers[question.questionId] || '';
            textInput.onchange = () => {
                this.surveyAnswers[question.questionId] = textInput.value;
            };
            optionsContainer.appendChild(textInput);
        } else {
            // Multiple choice options
            const options = question.options?.values || [];
            options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'survey-option';
                optionDiv.onclick = () => this.selectSurveyOption(option.option, optionDiv, question.questionId);
                
                if (this.surveyAnswers[question.questionId] === option.option) {
                    optionDiv.classList.add('selected');
                }

                optionDiv.innerHTML = `
                    <div class="survey-option-letter">${String.fromCharCode(65 + index)}</div>
                    <div class="survey-option-text">${option.option}</div>
                `;
                
                optionsContainer.appendChild(optionDiv);
            });
        }
    }

    selectSurveyOption(answer, optionElement, questionId) {
        document.querySelectorAll('.survey-option').forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');
        this.surveyAnswers[questionId] = answer;
    }

    nextSurveyQuestion() {
        if (this.currentSurveyIndex === this.surveyQuestions.length - 1) {
            this.submitSurveyAnswers();
        } else {
            this.currentSurveyIndex++;
            this.displaySurveyQuestion();
        }
    }

    previousSurveyQuestion() {
        if (this.currentSurveyIndex > 0) {
            this.currentSurveyIndex--;
            this.displaySurveyQuestion();
        }
    }

    // ===== STAGE 3: SURVEY VALIDATION =====
    async submitSurveyAnswers() {
        console.log('=== STAGE 3: Submitting Survey for Validation ===');
        
        this.hideElement('survey-section');
        this.showElement('survey-validation-loading');
        this.updateStageIndicator('Validating Preferences...');
        
        try {
            // Prepare survey responses for validation
            const surveyResponses = Object.entries(this.surveyAnswers).map(([questionId, answer]) => ({
                questionId: parseInt(questionId),
                answer: answer
            }));
            
            console.log('Submitting survey responses for validation:', surveyResponses);
            
            const validationResponse = await fetch('http://localhost:5678/webhook/validate-survey-responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    screeningId: this.screeningId,
                    surveyResponses: surveyResponses
                })
            });
            
            if (!validationResponse.ok) {
                throw new Error(`Validation request failed: ${validationResponse.status}`);
            }
            
            const validationResult = await validationResponse.json();
            console.log('Survey validation result:', validationResult);
            
            this.hideElement('survey-validation-loading');
            this.handleSurveyValidationResult(validationResult);
            
        } catch (error) {
            console.error('Survey validation error:', error);
            this.hideElement('survey-validation-loading');
            this.showSurveyValidationError('Failed to validate preferences. Please try again.');
        }
    }

    handleSurveyValidationResult(result) {
        console.log('Processing survey validation result:', result);
        
        if (result.success && result.validationPassed) {
            // Survey validation passed - proceed to technical assessment
            this.surveyValidationStatus = 'passed';
            this.showSurveyValidationSuccess(result);
            
            // Automatically proceed to technical assessment after showing success
            setTimeout(() => {
                this.proceedToTechnicalAssessment();
            }, 3000);
            
        } else {
            // Survey validation failed
            this.surveyValidationStatus = 'failed';
            this.showSurveyValidationFailure(result);
        }
    }

    showSurveyValidationSuccess(result) {
        const content = `
            <div class="validation-success">
                <h3 style="color: #28a745; margin-bottom: 20px;">✅ Preference Screening Passed!</h3>
                <p style="color: #155724; margin-bottom: 15px;">
                    Congratulations! You have successfully completed the preference screening.
                    You scored ${result.score} on the qualifying questions.
                </p>
                <p style="color: #495057; margin-bottom: 20px;">
                    ${result.message}
                </p>
                <div class="next-step-info">
                    <h4 style="color: #0066cc;">🚀 Next Step: Technical Assessment</h4>
                    <p>You will now proceed to the technical assessment phase. Your camera will be activated for proctoring.</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <div class="loading-dots">Loading technical questions...</div>
                </div>
            </div>
        `;
        
        document.getElementById('validation-result-content').innerHTML = content;
        this.showElement('survey-validation-result');
        this.updateStageIndicator('Preference Screening Passed - Loading Technical Assessment...');
    }

    showSurveyValidationFailure(result) {
        const failedQuestions = result.failedQuestions || [];
        const failedQuestionsHtml = failedQuestions.length > 0 ? 
            `<div class="failed-questions">
                <h4>Questions that need attention:</h4>
                <ul>
                    ${failedQuestions.map(q => `<li>${q.questionText}</li>`).join('')}
                </ul>
            </div>` : '';
        
        const content = `
            <div class="validation-failure">
                <h3 style="color: #dc3545; margin-bottom: 20px;">❌ Preference Screening Not Passed</h3>
                <p style="color: #721c24; margin-bottom: 15px;">
                    Unfortunately, your responses do not meet the requirements for this position.
                    You scored ${result.score || '0/0'} on the qualifying questions.
                </p>
                <p style="color: #495057; margin-bottom: 20px;">
                    ${result.message || 'You did not meet the preference requirements for this position.'}
                </p>
                ${failedQuestionsHtml}
                <div class="next-steps">
                    <h4 style="color: #856404;">What happens next?</h4>
                    <p>Your assessment has been completed. Our HR team will review your application and may contact you about other suitable opportunities.</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-secondary" onclick="window.close()">Close Assessment</button>
                </div>
            </div>
        `;
        
        document.getElementById('validation-result-content').innerHTML = content;
        this.showElement('survey-validation-result');
        this.updateStageIndicator('Assessment Completed - Preference Requirements Not Met');
        this.assessmentStage = 'completed';
    }

    showSurveyValidationError(message) {
        const content = `
            <div class="validation-error">
                <h3 style="color: #dc3545; margin-bottom: 20px;">⚠️ Validation Error</h3>
                <p style="color: #721c24; margin-bottom: 20px;">${message}</p>
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="location.reload()">Restart Assessment</button>
                </div>
            </div>
        `;
        
        document.getElementById('validation-result-content').innerHTML = content;
        this.showElement('survey-validation-result');
    }

    // ===== STAGE 4: TECHNICAL ASSESSMENT =====
    async proceedToTechnicalAssessment() {
        console.log('=== STAGE 4: Loading Technical Assessment ===');
        
        this.hideElement('survey-validation-result');
        this.updateStageIndicator('Loading Technical Assessment...');
       
        // Load technical questions after survey validation passes
        const questionsLoaded = await this.loadTechnicalQuestions();
       
        if (!questionsLoaded) {
            this.showError('Failed to load technical questions. Please contact support.');
            return;
        }
       
        this.assessmentStage = 'technical';
        this.updateStageIndicator('Stage 2: Technical Assessment');
        this.showElement('assessment-state');
        this.startTime = new Date();
        this.startTimer();
        this.displayQuestion();
   }

   async loadTechnicalQuestions() {
       try {
           console.log('Loading technical questions after survey validation...');
           
           const questionsUrl = `http://localhost:5678/webhook/get-assessment-questions`;
           
           const response = await fetch(questionsUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   screeningId: this.screeningId,
                   verificationStatus: true,
                   verificationData: this.aadhaarVerification.verificationResult
               })
           });
           
           if (!response.ok) {
               throw new Error(`Failed to load technical questions: ${response.status}`);
           }
           
           const result = await response.json();
           console.log('Technical questions API Response:', result);
           
           if (!result.success || !result.data) {
               throw new Error('No technical questions available');
           }
           
           // Load ONLY technical questions (survey already completed)
           this.questions = result.data.questions || [];
           
           console.log(`✅ Loaded ${this.questions.length} technical questions for Stage 2`);
           
           if (this.questions.length === 0) {
               throw new Error('No technical questions received from API');
           }
           
           return true;
           
       } catch (error) {
           console.error('Error loading technical questions:', error);
           return false;
       }
   }

   // ===== TECHNICAL ASSESSMENT METHODS =====
   startTimer() {
       this.timer = setInterval(() => {
           this.timeRemaining--;
           this.updateTimerDisplay();
           
           if (this.timeRemaining <= 0) {
               this.autoSubmit();
           }
       }, 1000);
   }

   updateTimerDisplay() {
       const minutes = Math.floor(this.timeRemaining / 60);
       const seconds = this.timeRemaining % 60;
       const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
       
       const timerElement = document.getElementById('timer');
       timerElement.textContent = `Time Remaining: ${timeString}`;
       
       if (this.timeRemaining <= 300) {
           timerElement.className = 'timer danger';
       } else if (this.timeRemaining <= 600) {
           timerElement.className = 'timer warning';
       }
   }

   displayQuestion() {
       const question = this.questions[this.currentQuestionIndex];
       if (!question) return;

       document.getElementById('question-number').textContent = 
           `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
       document.getElementById('question-category').textContent = question.category || 'Technical';
       document.getElementById('question-text').textContent = question.question;
       document.getElementById('question-info').textContent = 
           `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;

       const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
       document.getElementById('progress-bar').style.width = `${progress}%`;

       const optionsContainer = document.getElementById('options-container');
       optionsContainer.innerHTML = '';

       Object.entries(question.options).forEach(([letter, text]) => {
           const optionDiv = document.createElement('div');
           optionDiv.className = 'option';
           optionDiv.onclick = () => this.selectOption(letter, optionDiv);
           
           if (this.answers[question.id] === letter) {
               optionDiv.classList.add('selected');
           }

           optionDiv.innerHTML = `
               <div class="option-letter">${letter}</div>
               <div class="option-text">${text}</div>
           `;
           
           optionsContainer.appendChild(optionDiv);
       });

       document.getElementById('prev-btn').disabled = this.currentQuestionIndex === 0;
       document.getElementById('next-btn').textContent = 
           this.currentQuestionIndex === this.questions.length - 1 ? 'Submit Assessment' : 'Next';
   }

   selectOption(letter, optionElement) {
       document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
       optionElement.classList.add('selected');
       
       const question = this.questions[this.currentQuestionIndex];
       this.answers[question.id] = letter;
   }

   nextQuestion() {
       if (this.currentQuestionIndex === this.questions.length - 1) {
           this.showSubmitConfirmation();
       } else {
           this.currentQuestionIndex++;
           this.displayQuestion();
       }
   }

   previousQuestion() {
       if (this.currentQuestionIndex > 0) {
           this.currentQuestionIndex--;
           this.displayQuestion();
       }
   }

   // ===== SUBMISSION METHODS =====
   showSubmitConfirmation() {
       const mcqAnsweredCount = Object.keys(this.answers).length;
       const surveyAnsweredCount = Object.keys(this.surveyAnswers).length;
       
       // Update submission summary
       document.getElementById('survey-answered-count').textContent = surveyAnsweredCount;
       document.getElementById('survey-total-final').textContent = this.surveyQuestions.length;
       document.getElementById('mcq-answered-count').textContent = mcqAnsweredCount;
       document.getElementById('mcq-total-count').textContent = this.questions.length;
       
       this.hideElement('assessment-state');
       this.showElement('submit-confirmation');
   }

   backToReview() {
       this.hideElement('submit-confirmation');
       this.showElement('assessment-state');
   }

   async submitAssessment() {
       clearInterval(this.timer);
       
       const endTime = new Date();
       const timeSpent = Math.floor((endTime - this.startTime) / 1000);
       
       console.log('=== SUBMITTING COMPLETE TWO-STAGE ASSESSMENT ===');
       
       // Prepare comprehensive submission data
       const submissionData = {
           screeningId: this.screeningId,
           candidateName: this.candidateInfo.name,
           candidateEmail: this.candidateInfo.email,
           candidatePhone: this.candidateInfo.phone,
           candidateCompany: this.candidateInfo.company,
           candidateLocation: this.candidateInfo.location,
           matchScore: this.candidateInfo.matchScore,
           
           // MCQ Assessment answers (Stage 2)
           mcqAnswers: Object.entries(this.answers).map(([questionId, answer]) => ({
               questionNumber: parseInt(questionId),
               selectedAnswer: answer,
               question: this.questions.find(q => q.id == questionId)?.question || '',
               category: this.questions.find(q => q.id == questionId)?.category || ''
           })),
           
           // Survey answers (Stage 1)
           surveyAnswers: Object.entries(this.surveyAnswers).map(([questionId, answer]) => ({
               questionId: parseInt(questionId),
               answer: answer,
               questionText: this.surveyQuestions.find(q => q.questionId == questionId)?.questionText || ''
           })),
           
           // Two-stage assessment metadata
           assessmentStages: {
               stage1_survey: {
                   status: this.surveyValidationStatus,
                   questionsAnswered: Object.keys(this.surveyAnswers).length,
                   totalQuestions: this.surveyQuestions.length,
                   completedAt: new Date().toISOString()
               },
               stage2_technical: {
                   status: 'completed',
                   questionsAnswered: Object.keys(this.answers).length,
                   totalQuestions: this.questions.length,
                   timeSpent: timeSpent,
                   completedAt: endTime.toISOString()
               }
           },
           
           // Timing data (technical assessment only)
           timeSpent: timeSpent,
           startTime: this.startTime.toISOString(),
           endTime: endTime.toISOString(),
           
           // Security data
           violations: this.violations,
           
           // Aadhaar verification data
           aadhaarVerification: {
               verified: this.aadhaarVerification.verified,
               maskedAadhaar: this.aadhaarVerification.verificationResult?.maskedAadhaar || 'Not verified',
               attempts: this.aadhaarVerification.attempts,
               nameMatch: this.aadhaarVerification.verificationResult?.nameMatch || 0,
               verifiedAt: this.aadhaarVerification.verificationResult?.verifiedAt || null
           },
           
           // Browser info
           browserInfo: {
               userAgent: navigator.userAgent,
               language: navigator.language,
               platform: navigator.platform
           },
           
           // Enhanced metadata
           metadata: {
               assessmentType: 'Two-Stage: Preference Screening + Technical Assessment',
               twoStageProcess: true,
               stage1_surveyQuestions: this.surveyQuestions.length,
               stage1_surveyAnswered: Object.keys(this.surveyAnswers).length,
               stage1_validationStatus: this.surveyValidationStatus,
               stage2_technicalQuestions: this.questions.length,
               stage2_technicalAnswered: Object.keys(this.answers).length,
               stage2_timeSpent: timeSpent,
               submittedAt: endTime.toISOString(),
               jobTitle: this.jobInfo.title,
               assessmentStage: this.assessmentStage,
               qualifyingQuestionsCount: this.surveyQuestions.filter(q => q.isQualifying).length
           }
       };

       console.log('✅ SUBMITTING TWO-STAGE ASSESSMENT:', submissionData);

       try {
           const response = await fetch('http://localhost:5678/webhook/assessment-results', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(submissionData)
           });

           console.log('Submission response status:', response.status);

           if (response.ok) {
               console.log('✅ Two-stage assessment submitted successfully');
               this.assessmentStage = 'completed';
               this.updateStageIndicator('Assessment Completed Successfully');
               this.hideElement('submit-confirmation');
               this.showElement('success-state');
           } else {
               throw new Error(`Submission failed with status: ${response.status}`);
           }
       } catch (error) {
           console.error('Submission error:', error);
           alert('Error submitting assessment. Please try again or contact support.');
       }
   }

   autoSubmit() {
       alert('Time is up for the technical assessment! Your assessment will be submitted automatically.');
       this.submitAssessment();
   }

   // ===== ANTI-CHEATING MEASURES (ONLY DURING TECHNICAL ASSESSMENT) =====
   handleVisibilityChange() {
       if (this.assessmentStage === 'technical' && document.hidden) {
           this.violations.push({
               type: 'tab_switch',
               timestamp: new Date().toISOString(),
               description: 'User switched tabs during technical assessment'
           });
       }
   }

   handleWindowBlur() {
       if (this.assessmentStage === 'technical') {
           this.violations.push({
               type: 'window_blur',
               timestamp: new Date().toISOString(),
               description: 'Browser window lost focus during technical assessment'
           });
       }
   }

   handleKeyDown(e) {
       if (this.assessmentStage === 'technical' && e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
           e.preventDefault();
           this.violations.push({
               type: 'forbidden_key',
               timestamp: new Date().toISOString(),
               description: `Attempted to use ${e.key} shortcut during technical assessment`
           });
       }
   }

   // ===== UTILITY METHODS =====
   showElement(id) {
       document.getElementById(id).classList.remove('hidden');
   }

   hideElement(id) {
       document.getElementById(id).classList.add('hidden');
   }

   showError(message) {
       document.getElementById('error-message').textContent = message;
       this.hideElement('loading-state');
       this.showElement('error-state');
   }
}

// Initialize two-stage assessment platform when page loads
document.addEventListener('DOMContentLoaded', () => {
   new AssessmentPlatform();
});