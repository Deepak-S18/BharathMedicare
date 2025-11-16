/**
 * Ambient AI-Powered Clinical Decision Support
 * Non-intrusive, context-aware clinical suggestions
 */

class AmbientCDS {
    constructor() {
        // Use API_BASE_URL from config.js for cross-origin requests
        this.apiBase = `${API_BASE_URL}/api/cds`;
        this.currentPatientId = null;
        this.debounceTimer = null;
        this.isActive = false;
        this.suggestions = null;
        
        this.init();
    }
    
    init() {
        // Create CDS sidebar
        this.createSidebar();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    createSidebar() {
        // Check if sidebar already exists
        if (document.getElementById('cds-sidebar')) return;
        
        const sidebar = document.createElement('div');
        sidebar.id = 'cds-sidebar';
        sidebar.className = 'cds-sidebar';
        sidebar.innerHTML = `
            <div class="cds-header">
                <div class="cds-title">
                    <span class="cds-icon">🤖</span>
                    <span>AI Clinical Assistant</span>
                </div>
                <button class="cds-toggle" onclick="ambientCDS.toggleSidebar()">
                    <span>−</span>
                </button>
            </div>
            
            <div class="cds-content">
                <div class="cds-status">
                    <span class="status-indicator"></span>
                    <span class="status-text">Ready</span>
                </div>
                
                <div id="cds-suggestions-container">
                    <div class="cds-empty-state">
                        <p>AI suggestions will appear here as you work with patient data.</p>
                        <p class="cds-hint">💡 Open a patient chart to begin</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        
        // Add styles
        this.injectStyles();
    }
    
    injectStyles() {
        if (document.getElementById('cds-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'cds-styles';
        styles.textContent = `
            .cds-sidebar {
                position: fixed;
                right: 0;
                top: 0;
                width: 380px;
                height: 100vh;
                background: #ffffff;
                border-left: 1px solid #e0e0e0;
                box-shadow: -2px 0 8px rgba(0,0,0,0.1);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                transition: transform 0.3s ease;
            }
            
            .cds-sidebar.collapsed {
                transform: translateX(340px);
            }
            
            .cds-header {
                padding: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .cds-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 16px;
            }
            
            .cds-icon {
                font-size: 20px;
            }
            
            .cds-toggle {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .cds-toggle:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .cds-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }
            
            .cds-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px;
                background: #f5f5f5;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4caf50;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .status-indicator.analyzing {
                background: #ff9800;
            }
            
            .cds-empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }
            
            .cds-hint {
                margin-top: 12px;
                font-size: 14px;
                color: #999;
            }
            
            .cds-section {
                margin-bottom: 24px;
            }
            
            .cds-section-title {
                font-weight: 600;
                font-size: 14px;
                color: #333;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .cds-card {
                background: #f9f9f9;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s;
            }
            
            .cds-card:hover {
                background: #f0f0f0;
                border-color: #667eea;
            }
            
            .cds-card-header {
                display: flex;
                justify-content: space-between;
                align-items: start;
                margin-bottom: 8px;
            }
            
            .cds-card-title {
                font-weight: 600;
                font-size: 14px;
                color: #333;
            }
            
            .cds-confidence {
                background: #667eea;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .cds-confidence.high {
                background: #4caf50;
            }
            
            .cds-confidence.moderate {
                background: #ff9800;
            }
            
            .cds-confidence.low {
                background: #9e9e9e;
            }
            
            .cds-evidence {
                font-size: 12px;
                color: #666;
                margin: 8px 0;
            }
            
            .cds-evidence-item {
                display: flex;
                align-items: center;
                gap: 4px;
                margin: 4px 0;
            }
            
            .cds-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap;
            }
            
            .cds-action-btn {
                padding: 6px 12px;
                border: 1px solid #667eea;
                background: white;
                color: #667eea;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .cds-action-btn:hover {
                background: #667eea;
                color: white;
            }
            
            .cds-action-btn.primary {
                background: #667eea;
                color: white;
            }
            
            .cds-action-btn.primary:hover {
                background: #5568d3;
            }
            
            .cds-citation {
                font-size: 11px;
                color: #999;
                margin-top: 8px;
                font-style: italic;
            }
            
            .cds-alert {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
            }
            
            .cds-alert.critical {
                background: #f8d7da;
                border-color: #dc3545;
            }
            
            .cds-alert-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .cds-dismiss {
                float: right;
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
            }
            
            .cds-dismiss:hover {
                color: #666;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    setupEventListeners() {
        // Listen for patient chart opens
        document.addEventListener('patientChartOpened', (e) => {
            this.activateForPatient(e.detail.patientId);
        });
        
        // Listen for field focus events
        document.addEventListener('focusin', (e) => {
            this.handleFieldFocus(e.target);
        });
        
        // Listen for input changes (debounced)
        document.addEventListener('input', (e) => {
            this.handleInputChange(e.target);
        });
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('cds-sidebar');
        sidebar.classList.toggle('collapsed');
    }
    
    activateForPatient(patientId) {
        this.currentPatientId = patientId;
        this.isActive = true;
        
        // Perform initial analysis
        this.analyzePatientContext({}, 'passive');
    }
    
    handleFieldFocus(element) {
        if (!this.isActive) return;
        
        const fieldName = element.name || element.id;
        
        // Trigger CDS when diagnosis or prescription fields are focused
        if (fieldName && fieldName.includes('diagnosis')) {
            this.analyzePatientContext({ field: 'diagnosis' }, 'diagnosis_field');
        } else if (fieldName && fieldName.includes('prescription')) {
            this.analyzePatientContext({ field: 'prescription' }, 'prescription_field');
        }
    }
    
    handleInputChange(element) {
        if (!this.isActive) return;
        
        // Debounce input changes
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            const fieldName = element.name || element.id;
            const value = element.value;
            
            // Detect symptoms or significant changes
            if (fieldName && fieldName.includes('symptom') && value.length > 3) {
                this.analyzePatientContext({ 
                    symptoms: [value],
                    field: fieldName 
                }, 'passive');
            }
        }, 1500); // Wait 1.5 seconds after user stops typing
    }
    
    async analyzePatientContext(contextData, triggerType = 'passive') {
        if (!this.currentPatientId) return;
        
        this.setStatus('analyzing', 'Analyzing...');
        
        try {
            const token = localStorage.getItem('bharath_medicare_token');
            
            const response = await fetch(`${this.apiBase}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patient_id: this.currentPatientId,
                    context: contextData,
                    trigger_type: triggerType
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.suggestions = data.suggestions;
                this.renderSuggestions(data.suggestions);
                this.setStatus('ready', 'Ready');
            } else {
                this.setStatus('error', 'Error');
                console.error('CDS analysis failed:', data.error);
            }
            
        } catch (error) {
            this.setStatus('error', 'Error');
            console.error('CDS request failed:', error);
        }
    }
    
    renderSuggestions(suggestions) {
        const container = document.getElementById('cds-suggestions-container');
        
        if (!suggestions) {
            container.innerHTML = '<div class="cds-empty-state"><p>No suggestions available</p></div>';
            return;
        }
        
        let html = '';
        
        // Render alerts first
        if (suggestions.alerts && suggestions.alerts.length > 0) {
            html += this.renderAlerts(suggestions.alerts);
        }
        
        // Render differential diagnosis
        if (suggestions.differential_diagnosis && suggestions.differential_diagnosis.length > 0) {
            html += this.renderDifferentialDiagnosis(suggestions.differential_diagnosis);
        }
        
        // Render medication recommendations
        if (suggestions.medication_recommendations && suggestions.medication_recommendations.length > 0) {
            html += this.renderMedicationRecommendations(suggestions.medication_recommendations);
        }
        
        // Render care pathway
        if (suggestions.care_pathway && suggestions.care_pathway.length > 0) {
            html += this.renderCarePathway(suggestions.care_pathway);
        }
        
        // Render risk factors
        if (suggestions.risk_factors && suggestions.risk_factors.length > 0) {
            html += this.renderRiskFactors(suggestions.risk_factors);
        }
        
        if (!html) {
            html = '<div class="cds-empty-state"><p>No suggestions at this time</p></div>';
        }
        
        container.innerHTML = html;
    }
    
    renderAlerts(alerts) {
        let html = '<div class="cds-section"><div class="cds-section-title">⚠️ Alerts</div>';
        
        alerts.forEach(alert => {
            const alertClass = alert.severity === 'high' ? 'critical' : '';
            html += `
                <div class="cds-alert ${alertClass}">
                    <div class="cds-alert-title">
                        ${alert.severity === 'high' ? '🚨' : '⚠️'}
                        ${alert.message}
                    </div>
                    <div class="cds-evidence">${alert.description || ''}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderDifferentialDiagnosis(ddxList) {
        let html = '<div class="cds-section"><div class="cds-section-title">🔍 Differential Diagnosis</div>';
        
        ddxList.slice(0, 5).forEach((ddx, index) => {
            const confidenceClass = ddx.confidence > 70 ? 'high' : ddx.confidence > 40 ? 'moderate' : 'low';
            
            html += `
                <div class="cds-card">
                    <div class="cds-card-header">
                        <div class="cds-card-title">${ddx.diagnosis}</div>
                        <div class="cds-confidence ${confidenceClass}">${ddx.confidence}%</div>
                    </div>`;
            
            // Show AI analysis if available (from Gemini AI)
            if (ddx.ai_analysis) {
                html += `
                    <div class="cds-ai-analysis" style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
                        ${this.escapeHtml(ddx.ai_analysis)}
                    </div>`;
            } else {
                // Show traditional evidence-based format
                html += `
                    <div class="cds-evidence">
                        <strong>Supporting evidence:</strong>
                        ${ddx.supporting_evidence.map(e => `<div class="cds-evidence-item">• ${e}</div>`).join('')}
                    </div>
                    <div class="cds-evidence">
                        <strong>Next steps:</strong> ${ddx.next_steps.join(', ')}
                    </div>`;
            }
            
            html += `
                    <div class="cds-actions">
                        <button class="cds-action-btn primary" onclick="ambientCDS.acceptSuggestion('ddx', ${index})">
                            Add to Diagnosis
                        </button>
                        <button class="cds-action-btn" onclick="ambientCDS.dismissSuggestion('ddx', ${index})">
                            Dismiss
                        </button>
                    </div>`;
            
            if (ddx.citations && ddx.citations.length > 0) {
                html += `<div class="cds-citation">Source: ${ddx.citations.join(', ')}</div>`;
            }
            
            html += `</div>`;
        });
        
        html += '</div>';
        return html;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    renderMedicationRecommendations(medications) {
        let html = '<div class="cds-section"><div class="cds-section-title">💊 Medication Recommendations</div>';
        
        medications.forEach((med, index) => {
            const safetyIcon = med.safety_check?.safe_to_prescribe ? '✓' : '⚠️';
            const safetyClass = med.safety_check?.safe_to_prescribe ? '' : 'critical';
            
            html += `
                <div class="cds-card">
                    <div class="cds-card-header">
                        <div class="cds-card-title">${med.drug} (${med.class})</div>
                        ${med.first_line ? '<span class="cds-confidence high">1st Line</span>' : ''}
                    </div>
                    ${med.safety_check && !med.safety_check.safe_to_prescribe ? `
                        <div class="cds-alert ${safetyClass}">
                            <div class="cds-alert-title">${safetyIcon} Safety Alert</div>
                            ${med.safety_check.warnings.map(w => `<div>• ${w}</div>`).join('')}
                        </div>
                    ` : ''}
                    ${med.benefits ? `<div class="cds-evidence"><strong>Benefits:</strong> ${med.benefits.join(', ')}</div>` : ''}
                    <div class="cds-evidence"><strong>Monitoring:</strong> ${med.monitoring.join(', ')}</div>
                    <div class="cds-actions">
                        <button class="cds-action-btn primary" onclick="ambientCDS.acceptSuggestion('medication', ${index})" 
                                ${!med.safety_check?.safe_to_prescribe ? 'disabled' : ''}>
                            Add to Prescription
                        </button>
                        <button class="cds-action-btn" onclick="ambientCDS.dismissSuggestion('medication', ${index})">
                            Dismiss
                        </button>
                    </div>
                    <div class="cds-citation">Source: ${med.citations.join(', ')}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderCarePathway(pathway) {
        let html = '<div class="cds-section"><div class="cds-section-title">📋 Care Pathway</div>';
        
        pathway.forEach((item, index) => {
            const icon = item.type === 'lab_test' ? '🧪' : item.type === 'referral' ? '👨‍⚕️' : '📊';
            
            html += `
                <div class="cds-card">
                    <div class="cds-card-title">${icon} ${item.recommendation}</div>
                    <div class="cds-evidence">${item.rationale}</div>
                    ${item.frequency ? `<div class="cds-evidence"><strong>Frequency:</strong> ${item.frequency}</div>` : ''}
                    <div class="cds-actions">
                        <button class="cds-action-btn primary" onclick="ambientCDS.acceptSuggestion('pathway', ${index})">
                            Add to Plan
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderRiskFactors(riskFactors) {
        let html = '<div class="cds-section"><div class="cds-section-title">⚡ Risk Factors</div>';
        
        riskFactors.forEach(risk => {
            const severityColor = risk.severity === 'high' ? '#dc3545' : risk.severity === 'moderate' ? '#ff9800' : '#9e9e9e';
            
            html += `
                <div class="cds-card">
                    <div class="cds-card-title" style="color: ${severityColor}">${risk.factor}</div>
                    <div class="cds-evidence">${risk.description}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    async acceptSuggestion(type, index) {
        // Record feedback
        await this.recordFeedback(type, index, 'accepted');
        
        // Implement action based on type
        alert(`Suggestion accepted! This would add the ${type} to the patient record.`);
        
        // In production, this would actually add to the EMR
    }
    
    async dismissSuggestion(type, index) {
        const reason = prompt('Optional: Why are you dismissing this suggestion?');
        
        // Record feedback
        await this.recordFeedback(type, index, 'dismissed', reason);
        
        // Remove from UI
        // Re-render without this suggestion
    }
    
    acceptSuggestion(type, index) {
        console.log(`Accepting ${type} suggestion at index ${index}`);
        
        if (type === 'ddx' && this.suggestions.differential_diagnosis) {
            const diagnosis = this.suggestions.differential_diagnosis[index];
            
            // Find the diagnosis input field on the page
            const diagnosisField = document.querySelector('input[name="diagnosis"], input[id="diagnosis"], textarea[name="diagnosis"], textarea[id="diagnosis"]');
            
            if (diagnosisField) {
                // Add the diagnosis to the field
                const diagnosisText = diagnosis.diagnosis;
                if (diagnosisField.value) {
                    diagnosisField.value += ', ' + diagnosisText;
                } else {
                    diagnosisField.value = diagnosisText;
                }
                
                // Trigger change event
                diagnosisField.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Show success message
                this.showNotification('✓ Added to diagnosis', 'success');
            } else {
                console.warn('Diagnosis field not found on page');
                this.showNotification('⚠ Diagnosis field not found', 'warning');
            }
            
            // Record feedback
            this.recordFeedback(type, index, 'accepted');
        }
    }
    
    dismissSuggestion(type, index) {
        console.log(`Dismissing ${type} suggestion at index ${index}`);
        
        // Record feedback
        this.recordFeedback(type, index, 'dismissed');
        
        // Remove the suggestion from display
        const cards = document.querySelectorAll('.cds-card');
        if (cards[index]) {
            cards[index].style.opacity = '0.5';
            cards[index].style.pointerEvents = 'none';
        }
        
        this.showNotification('✓ Suggestion dismissed', 'info');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `cds-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    async recordFeedback(type, index, action, reason = null) {
        try {
            const token = localStorage.getItem('bharath_medicare_token');
            
            let suggestionContent = {};
            if (type === 'ddx' && this.suggestions.differential_diagnosis) {
                suggestionContent = this.suggestions.differential_diagnosis[index];
            } else if (type === 'medication' && this.suggestions.medication_recommendations) {
                suggestionContent = this.suggestions.medication_recommendations[index];
            } else if (type === 'pathway' && this.suggestions.care_pathway) {
                suggestionContent = this.suggestions.care_pathway[index];
            }
            
            await fetch(`${this.apiBase}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    suggestion_id: `${type}_${index}_${Date.now()}`,
                    suggestion_type: type,
                    suggestion_content: suggestionContent,
                    action: action,
                    reason: reason
                })
            });
            
        } catch (error) {
            console.error('Failed to record feedback:', error);
        }
    }
    
    setStatus(state, text) {
        const indicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (indicator) {
            indicator.className = `status-indicator ${state}`;
        }
        
        if (statusText) {
            statusText.textContent = text;
        }
    }
}

// Initialize ambient CDS only on CDS demo page
let ambientCDS;
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on CDS demo page, not on dashboard
    const currentPage = window.location.pathname;
    if (currentPage.includes('cds-demo.html') || currentPage.includes('cds-')) {
        ambientCDS = new AmbientCDS();
    }
});
