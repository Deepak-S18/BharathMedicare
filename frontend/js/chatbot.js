// Chatbot functionality
class HealthcareChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.conversationContext = 'initial'; // Track conversation state
    
    // Dynamic quick replies based on context
    this.quickReplyOptions = {
      initial: [
        "How do I register?",
        "Is my data secure?",
        "What services do you offer?",
        "How to contact support?"
      ],
      afterGreeting: [
        "Tell me about security",
        "How to upload records?",
        "Book an appointment",
        "View pricing"
      ],
      afterSecurity: [
        "How to register?",
        "What about encryption?",
        "Who can access my data?",
        "Tell me about HIPAA"
      ],
      afterRegistration: [
        "How to upload documents?",
        "How to find doctors?",
        "Is it free?",
        "Mobile app available?"
      ],
      afterServices: [
        "How to book appointment?",
        "Can I add family members?",
        "What about prescriptions?",
        "Export my data"
      ],
      afterAppointments: [
        "How to share records?",
        "Video consultation available?",
        "Cancel appointment",
        "View appointment history"
      ],
      afterRecords: [
        "Supported file formats?",
        "How to grant doctor access?",
        "Download my records",
        "Delete a record"
      ],
      general: [
        "Tell me about services",
        "How secure is my data?",
        "Contact support",
        "Pricing information"
      ]
    };
    
    this.knowledgeBase = {
      greetings: {
        keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste', 'greetings'],
        responses: [
          "Hello! 👋 Welcome to Bharath Medicare. How can I help you today?",
          "Hi there! I'm here to help you navigate our healthcare platform. What would you like to know?",
          "Welcome! I'm your Bharath Medicare assistant. Feel free to ask me anything about our services.",
          "Namaste! 🙏 I'm here to assist you with all your healthcare platform questions."
        ]
      },
      registration: {
        keywords: ['register', 'sign up', 'create account', 'join', 'new account', 'signup', 'how to register', 'registration process', 'become member', 'enroll'],
        response: "To register with Bharath Medicare:\n\n1. Click the 'Register' button in the top navigation\n2. Choose your role (Patient, Doctor, or Hospital)\n3. Fill in your details\n4. Verify your email\n5. Start using our platform!\n\n<a href='pages/register.html'>Click here to register now</a> 🚀"
      },
      login: {
        keywords: ['login', 'sign in', 'log in', 'access account', 'signin', 'logging in', 'cant login', 'login problem', 'forgot password', 'reset password'],
        response: "To access your account:\n\n1. Click the 'Login' button in the navigation\n2. Enter your email and password\n3. You'll be redirected to your dashboard\n\nForgot password? Use the 'Forgot Password' link on the login page to reset it.\n\n<a href='pages/login.html'>Click here to login</a> 🔐"
      },
      security: {
        keywords: ['secure', 'security', 'safe', 'privacy', 'encryption', 'data protection', 'hipaa', 'protected', 'confidential', 'hack', 'breach', 'safety', 'trust', 'reliable'],
        response: "Your data security is our top priority! 🔒\n\n✅ End-to-end encryption\n✅ HIPAA compliant\n✅ Military-grade security (AES-256)\n✅ Complete privacy control\n✅ Detailed audit logs\n✅ Regular security audits\n✅ Two-factor authentication\n\nYou decide who can access your records and can revoke access anytime. All data is encrypted before storage and during transmission."
      },
      services: {
        keywords: ['services', 'features', 'what do you offer', 'capabilities', 'what can i do', 'functionality', 'options', 'benefits', 'advantages'],
        response: "Bharath Medicare offers comprehensive healthcare solutions:\n\n📋 Medical Records Management\n👨‍⚕️ Doctor Access Control\n🔒 Secure Data Storage\n📊 Health Analytics & Reports\n📱 Mobile Access\n🏥 Hospital Integration\n📝 Detailed Audit Logs\n💊 Prescription Management\n📅 Appointment Tracking\n🔔 Health Reminders\n\n<a href='#services'>View all services</a>"
      },
      doctors: {
        keywords: ['doctor', 'physician', 'healthcare provider', 'medical professional', 'specialist', 'practitioner', 'clinician', 'for doctors', 'doctor portal'],
        response: "For Healthcare Providers:\n\n✅ Access patient records securely\n✅ Manage appointments efficiently\n✅ Digital prescriptions\n✅ Patient communication tools\n✅ Analytics dashboard\n✅ Medical history tracking\n✅ Lab report integration\n✅ Telemedicine support\n\nDoctors can register and get verified to start accessing patient records with proper authorization."
      },
      patients: {
        keywords: ['patient', 'medical records', 'health records', 'my records', 'patient portal', 'for patients', 'health data', 'medical history'],
        response: "For Patients:\n\n✅ Store all medical documents\n✅ Control who accesses your data\n✅ View your health history\n✅ Share records with doctors\n✅ Track appointments\n✅ Access from anywhere\n✅ Download reports anytime\n✅ Manage prescriptions\n✅ Set health reminders\n\nYour health data, your control! 💪"
      },
      pricing: {
        keywords: ['price', 'cost', 'free', 'payment', 'subscription', 'how much', 'charges', 'fees', 'pricing plan', 'affordable', 'expensive'],
        response: "Great news! 🎉\n\nBharath Medicare offers:\n\n✅ FREE basic account for patients\n✅ Unlimited secure storage\n✅ No hidden fees\n✅ No credit card required\n✅ Premium features available for healthcare providers\n\nPatients can use all core features completely free!\n\n<a href='pages/register.html'>Start your free account now</a>"
      },
      contact: {
        keywords: ['contact', 'support', 'help', 'reach', 'email', 'phone', 'call', 'customer service', 'helpdesk', 'assistance', 'talk to someone'],
        response: "Need to reach us? We're here to help! 📞\n\n📧 Email:\nsupport@bharathmedicare.com\n\n📱 Phone: +91 1800-123-4567\n\n📍 Location: 123 Health Street, Mumbai, India\n\n⏰ Support Hours: 24/7\n\nWe typically respond within 2-4 hours!\n\n<a href='#contact'>Visit our contact page</a>"
      },
      about: {
        keywords: ['about', 'who are you', 'company', 'mission', 'vision', 'story', 'background', 'team', 'founded', 'history'],
        response: "Bharath Medicare is revolutionizing healthcare data management in India! 🏥\n\nWe provide a secure, patient-centric platform that puts you in complete control of your medical information. Our mission is to make healthcare more accessible, transparent, and efficient.\n\n🎯 Founded to solve healthcare data fragmentation\n👥 Trusted by thousands of users\n🏆 Award-winning security standards\n\n<a href='#about'>Learn more about us</a>"
      },
      mobile: {
        keywords: ['mobile', 'app', 'android', 'ios', 'phone', 'smartphone', 'tablet', 'ipad', 'download app', 'mobile app'],
        response: "Access your health records on the go! 📱\n\nOur platform is fully responsive and works seamlessly on:\n\n✅ Mobile browsers (Chrome, Safari, Firefox)\n✅ Tablets (iPad, Android tablets)\n✅ Desktop computers\n✅ All screen sizes\n\nNo app download needed - just login from any device with internet access! Works offline too for viewing cached records."
      },
      upload: {
        keywords: ['upload', 'add records', 'add documents', 'store files', 'upload report', 'add prescription', 'scan', 'attach', 'file upload'],
        response: "To upload medical records:\n\n1. Login to your account\n2. Go to your dashboard\n3. Click 'Upload Records' or drag & drop\n4. Select your files (PDF, images, etc.)\n5. Add details (date, type, doctor)\n6. Save securely\n\nSupported formats:\n📄 PDF, DOC, DOCX\n🖼️ JPG, PNG, TIFF\n🏥 DICOM (medical imaging)\n📊 CSV, XLS (lab reports)\n\nMax file size: 50MB per file"
      },
      access: {
        keywords: ['access', 'share', 'grant access', 'doctor access', 'permissions', 'sharing', 'revoke', 'control access', 'who can see'],
        response: "Managing access to your records:\n\n1. Login to your dashboard\n2. Go to 'Access Management'\n3. Add doctor's email or ID\n4. Set permissions (view/download)\n5. Set duration (temporary/permanent)\n6. Revoke anytime you want\n\nYou get notifications when:\n✅ Someone requests access\n✅ Records are viewed\n✅ Records are downloaded\n\nYou have complete control! 🎯"
      },
      appointments: {
        keywords: ['appointment', 'book appointment', 'schedule', 'booking', 'consultation', 'visit', 'meet doctor', 'appointment booking'],
        response: "Managing appointments:\n\n1. Login to your dashboard\n2. Go to 'Appointments'\n3. Search for doctors or hospitals\n4. Select available time slot\n5. Confirm booking\n6. Get confirmation via email/SMS\n\n✅ View upcoming appointments\n✅ Reschedule if needed\n✅ Set reminders\n✅ Video consultation available\n✅ Share medical history automatically"
      },
      prescriptions: {
        keywords: ['prescription', 'medicine', 'medication', 'drugs', 'pharmacy', 'pills', 'dosage', 'rx'],
        response: "Managing prescriptions:\n\n✅ Store all prescriptions digitally\n✅ Set medication reminders\n✅ Track dosage history\n✅ Reorder medicines online\n✅ Share with pharmacies\n✅ Check drug interactions\n✅ View prescription history\n\nDoctors can write digital prescriptions directly in the system!"
      },
      reports: {
        keywords: ['report', 'lab report', 'test results', 'blood test', 'xray', 'scan', 'mri', 'ct scan', 'results'],
        response: "Managing medical reports:\n\n✅ Upload lab reports (PDF/images)\n✅ View test results history\n✅ Compare reports over time\n✅ Share with doctors instantly\n✅ Download anytime\n✅ Get AI-powered insights\n✅ Track health trends\n\nSupported: Blood tests, X-rays, MRI, CT scans, ultrasounds, and more!"
      },
      emergency: {
        keywords: ['emergency', 'urgent', 'critical', 'ambulance', 'emergency contact', 'sos', 'help needed'],
        response: "In case of emergency:\n\n🚨 Call emergency services: 108 (India)\n\n✅ Your emergency contacts can access your critical medical info\n✅ Set up emergency profile with:\n   • Blood type\n   • Allergies\n   • Current medications\n   • Emergency contacts\n   • Medical conditions\n\nSet up your emergency profile in Settings > Emergency Info"
      },
      languages: {
        keywords: ['language', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'kannada', 'multilingual', 'translation'],
        response: "Bharath Medicare supports multiple languages! 🌐\n\n✅ English\n✅ Hindi\n✅ Tamil\n✅ Telugu\n✅ Bengali\n✅ Marathi\n✅ Gujarati\n✅ Kannada\n✅ Malayalam\n\nChange language from the language selector in the navigation menu!"
      },
      hospitals: {
        keywords: ['hospital', 'clinic', 'healthcare facility', 'medical center', 'hospital portal', 'for hospitals'],
        response: "For Hospitals & Clinics:\n\n✅ Manage patient records centrally\n✅ Staff access management\n✅ Appointment scheduling system\n✅ Billing integration\n✅ Lab report management\n✅ Inventory tracking\n✅ Analytics & reporting\n✅ Multi-location support\n\nContact us for enterprise solutions!"
      },
      insurance: {
        keywords: ['insurance', 'claim', 'health insurance', 'mediclaim', 'reimbursement', 'coverage'],
        response: "Insurance & Claims:\n\n✅ Store insurance policy details\n✅ Upload claim documents\n✅ Track claim status\n✅ Share records with insurers\n✅ Generate claim reports\n✅ Cashless treatment support\n\nKeep all your insurance documents organized in one place!"
      },
      family: {
        keywords: ['family', 'family members', 'dependents', 'children', 'parents', 'spouse', 'add family'],
        response: "Managing family accounts:\n\n✅ Add family members to your account\n✅ Manage records for children/parents\n✅ Separate profiles for each member\n✅ Control access individually\n✅ Track family health history\n✅ Book appointments for family\n\nOne account, entire family's health records!"
      },
      delete: {
        keywords: ['delete', 'remove', 'delete account', 'close account', 'deactivate', 'cancel'],
        response: "Account management:\n\n⚠️ To delete your account:\n1. Go to Settings > Account\n2. Click 'Delete Account'\n3. Confirm deletion\n\nNote:\n• All your data will be permanently deleted\n• This action cannot be undone\n• Download your records before deleting\n\nNeed help? Contact support first!"
      },
      export: {
        keywords: ['export', 'download', 'backup', 'download records', 'export data', 'get my data'],
        response: "Exporting your data:\n\n✅ Download individual records\n✅ Export all data as ZIP\n✅ Get PDF reports\n✅ Export to other formats\n✅ Automatic backups available\n\nGo to Settings > Export Data to download all your medical records at once!"
      },
      notifications: {
        keywords: ['notification', 'alerts', 'reminders', 'email notification', 'sms', 'push notification'],
        response: "Managing notifications:\n\n✅ Email notifications\n✅ SMS alerts\n✅ Push notifications (mobile)\n✅ Appointment reminders\n✅ Medication reminders\n✅ Access alerts\n✅ Report ready notifications\n\nCustomize in Settings > Notifications"
      },
      verification: {
        keywords: ['verify', 'verification', 'verified doctor', 'authenticate', 'confirm identity', 'kyc'],
        response: "Account verification:\n\n👤 For Patients:\n✅ Email verification (required)\n✅ Phone verification (optional)\n\n👨‍⚕️ For Doctors:\n✅ Medical license verification\n✅ Professional credentials\n✅ Hospital affiliation\n✅ Identity documents\n\nVerified accounts get a blue checkmark ✓"
      },
      telemedicine: {
        keywords: ['telemedicine', 'video call', 'online consultation', 'virtual visit', 'video consultation', 'teleconsultation'],
        response: "Telemedicine features:\n\n✅ Video consultations with doctors\n✅ Chat with healthcare providers\n✅ Share records during call\n✅ Get digital prescriptions\n✅ Schedule follow-ups\n✅ Secure & encrypted calls\n\nBook a video consultation from the Appointments section!"
      },
      analytics: {
        keywords: ['analytics', 'insights', 'health trends', 'statistics', 'health score', 'tracking'],
        response: "Health Analytics:\n\n✅ Track health trends over time\n✅ Visualize test results\n✅ Compare reports\n✅ Get health insights\n✅ Risk assessments\n✅ Personalized recommendations\n✅ Export analytics reports\n\nView your health analytics in the Dashboard!"
      },
      api: {
        keywords: ['api', 'integration', 'developer', 'integrate', 'third party', 'connect'],
        response: "API & Integrations:\n\n✅ RESTful API available\n✅ Integrate with your systems\n✅ Hospital management systems\n✅ Lab equipment integration\n✅ Pharmacy systems\n✅ Insurance platforms\n\nContact our developer team for API documentation and access!"
      }
    };
    
    this.init();
  }
  
  init() {
    this.createChatbotUI();
    this.attachEventListeners();
    this.addWelcomeMessage();
  }
  
  createChatbotUI() {
    const chatbotHTML = `
      <div class="chatbot-container">
        <button class="chatbot-toggle" id="chatbotToggle">
          <i class="fas fa-comments"></i>
          <span class="chatbot-notification">1</span>
        </button>
        
        <div class="chatbot-window" id="chatbotWindow">
          <div class="chatbot-header">
            <div class="chatbot-header-info">
              <div class="chatbot-avatar">
                <i class="fas fa-robot"></i>
              </div>
              <div class="chatbot-title">
                <h3>Healthcare Assistant</h3>
                <p>Online • Ready to help</p>
              </div>
            </div>
            <button class="chatbot-close" id="chatbotClose">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="chatbot-messages" id="chatbotMessages">
            <!-- Messages will be added here -->
          </div>
          
          <div class="chatbot-quick-replies" id="quickReplies">
            <!-- Quick replies will be added here -->
          </div>
          
          <div class="chatbot-input-area">
            <input 
              type="text" 
              class="chatbot-input" 
              id="chatbotInput" 
              placeholder="Type your message..."
              autocomplete="off"
            />
            <button class="chatbot-send" id="chatbotSend">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  }
  
  attachEventListeners() {
    const toggle = document.getElementById('chatbotToggle');
    const close = document.getElementById('chatbotClose');
    const send = document.getElementById('chatbotSend');
    const input = document.getElementById('chatbotInput');
    
    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click', () => this.toggleChat());
    send.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }
  
  toggleChat() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('chatbotWindow');
    const toggle = document.getElementById('chatbotToggle');
    const notification = toggle.querySelector('.chatbot-notification');
    
    if (this.isOpen) {
      window.classList.add('active');
      toggle.classList.add('active');
      if (notification) notification.style.display = 'none';
      this.scrollToBottom();
    } else {
      window.classList.remove('active');
      toggle.classList.remove('active');
    }
  }
  
  addWelcomeMessage() {
    const welcomeMsg = "👋 Hi! I'm your Bharath Medicare assistant. I can help you with:\n\n📝 Registration & Account Setup\n🔒 Security & Privacy Questions\n🏥 Services & Features\n📋 Medical Records Management\n👨‍⚕️ Doctor & Hospital Portal\n💊 Prescriptions & Lab Reports\n📅 Appointments & Consultations\n📞 Contact & Support\n\nAsk me anything or click a quick reply below!";
    this.addMessage(welcomeMsg, 'bot');
    this.conversationContext = 'initial';
    this.showQuickReplies('initial');
  }
  
  addMessage(text, sender = 'bot') {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;
    
    const avatar = sender === 'bot' 
      ? '<div class="message-avatar"><i class="fas fa-robot"></i></div>'
      : '<div class="message-avatar"><i class="fas fa-user"></i></div>';
    
    const content = `
      ${sender === 'bot' ? avatar : ''}
      <div class="message-content">${text.replace(/\n/g, '<br>')}</div>
      ${sender === 'user' ? avatar : ''}
    `;
    
    messageDiv.innerHTML = content;
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }
  
  showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }
  
  removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }
  
  sendMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addMessage(message, 'user');
    input.value = '';
    
    this.showTypingIndicator();
    
    setTimeout(() => {
      this.removeTypingIndicator();
      const { response, context } = this.getResponse(message);
      this.addMessage(response, 'bot');
      this.conversationContext = context;
      this.showQuickReplies(context);
    }, 1000 + Math.random() * 1000);
  }
  
  getResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for thanks/goodbye
    if (['thank', 'thanks', 'thank you', 'thankyou', 'thx', 'appreciate'].some(kw => lowerMessage.includes(kw))) {
      const thankResponses = [
        "You're welcome! 😊 Feel free to ask if you have more questions!",
        "Happy to help! Let me know if you need anything else! 🙌",
        "My pleasure! I'm here anytime you need assistance! 💙",
        "Glad I could help! Don't hesitate to reach out again! ✨"
      ];
      return {
        response: thankResponses[Math.floor(Math.random() * thankResponses.length)],
        context: 'general'
      };
    }
    
    if (['bye', 'goodbye', 'see you', 'later', 'exit'].some(kw => lowerMessage.includes(kw))) {
      return {
        response: "Goodbye! Take care of your health! 👋 Feel free to come back anytime you need help!",
        context: 'initial'
      };
    }
    
    // Check greetings first
    if (this.knowledgeBase.greetings.keywords.some(kw => lowerMessage.includes(kw))) {
      const responses = this.knowledgeBase.greetings.responses;
      return {
        response: responses[Math.floor(Math.random() * responses.length)],
        context: 'afterGreeting'
      };
    }
    
    // Check other categories and return appropriate context
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (category === 'greetings') continue;
      
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        // Determine context based on category
        let context = 'general';
        if (category === 'registration' || category === 'login') context = 'afterRegistration';
        else if (category === 'security') context = 'afterSecurity';
        else if (category === 'services') context = 'afterServices';
        else if (category === 'appointments') context = 'afterAppointments';
        else if (category === 'upload' || category === 'access') context = 'afterRecords';
        
        return {
          response: data.response,
          context: context
        };
      }
    }
    
    // Default response with suggestions
    return {
      response: "I'm here to help! I can answer questions about:\n\n📝 Registration & Login\n🔒 Security & Privacy\n🏥 Services & Features\n📞 Contact & Support\n📋 Medical Records Management\n👨‍⚕️ Doctor & Hospital Access\n💊 Prescriptions & Reports\n📱 Mobile Access\n👨‍👩‍👧‍👦 Family Accounts\n📊 Health Analytics\n🚨 Emergency Features\n\nTry asking something specific like:\n• 'How do I upload reports?'\n• 'Is my data secure?'\n• 'How to book an appointment?'\n\nOr click the quick reply buttons below! 😊",
      context: 'general'
    };
  }
  
  showQuickReplies(context = 'general') {
    const container = document.getElementById('quickReplies');
    container.innerHTML = '';
    
    // Get appropriate quick replies based on context
    const replies = this.quickReplyOptions[context] || this.quickReplyOptions.general;
    
    replies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'quick-reply-btn';
      button.textContent = reply;
      button.addEventListener('click', () => {
        document.getElementById('chatbotInput').value = reply;
        this.sendMessage();
      });
      container.appendChild(button);
    });
  }
  
  scrollToBottom() {
    const messagesContainer = document.getElementById('chatbotMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HealthcareChatbot();
});
