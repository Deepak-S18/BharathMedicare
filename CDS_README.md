# Ambient AI-Powered Clinical Decision Support (CDS) System

## Overview

An intelligent, non-intrusive clinical decision support system that operates ambiently in the background, providing evidence-based suggestions to physicians without disrupting their workflow.

## Key Features

### 1. **Ambient Operation**
- Operates passively in the background
- No disruptive pop-ups or alerts
- Suggestions appear in a dedicated sidebar
- Activates intelligently based on context

### 2. **Context-Aware Triggering**
The system intelligently activates when:
- A patient chart is opened
- New symptoms are entered
- Physician focuses on diagnosis field
- Physician focuses on prescription field
- Significant clinical data changes occur

### 3. **Comprehensive Suggestions**

#### Differential Diagnosis
- Ranked list of potential diagnoses
- Confidence scores based on patient data
- Supporting evidence clearly listed
- Next steps and recommended tests
- Citations to medical literature

#### Medication Recommendations
- Evidence-based drug suggestions
- First-line vs alternative therapies
- Drug-drug interaction checks
- Drug-allergy alerts
- Drug-condition contraindications
- Renal dosing adjustments
- Formulary-preferred options

#### Care Pathway Proposals
- Recommended lab tests
- Monitoring schedules
- Specialist referrals
- Preventive care reminders

### 4. **Safety Features**
- Real-time drug interaction checking
- Allergy cross-sensitivity detection
- Contraindication warnings
- Renal function-based dosing
- Critical alerts for high-risk situations

### 5. **Physician Learning System**
- Learns from accepted/dismissed suggestions
- Adapts to individual physician preferences
- Reduces suggestion frequency for repeatedly dismissed items
- Tracks preferred medications per condition
- Provides usage analytics

### 6. **Evidence-Based Knowledge**
- Every suggestion includes citations
- Links to clinical guidelines
- Hover tooltips for quick reference
- Full guideline access with one click

## Architecture

```
backend/app/ai_cds/
├── engine.py              # Main CDS orchestrator
├── context_analyzer.py    # Patient context analysis
├── knowledge_base.py      # Medical knowledge & guidelines
├── drug_interactions.py   # Medication safety checker
└── learning.py            # Physician preference learning

backend/app/blueprints/
└── cds.py                 # CDS API endpoints

frontend/js/
└── cds-ambient.js         # Ambient UI component

frontend/pages/
└── cds-demo.html          # Demo page
```

## API Endpoints

### POST `/api/cds/analyze`
Analyze patient context and provide suggestions

**Request:**
```json
{
  "patient_id": "string",
  "context": {
    "symptoms": ["chest pain", "dyspnea"],
    "field": "diagnosis"
  },
  "trigger_type": "diagnosis_field"
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": {
    "differential_diagnosis": [...],
    "medication_recommendations": [...],
    "care_pathway": [...],
    "alerts": [...],
    "risk_factors": [...]
  }
}
```

### POST `/api/cds/medication-safety`
Check medication safety

**Request:**
```json
{
  "patient_id": "string",
  "medication": "Warfarin",
  "dose": "5mg daily"
}
```

**Response:**
```json
{
  "success": true,
  "safety_report": {
    "medication": "Warfarin",
    "safe_to_prescribe": false,
    "drug_drug_interactions": [...],
    "allergy_alerts": [...],
    "warnings": [...],
    "recommendations": [...]
  }
}
```

### POST `/api/cds/feedback`
Record physician feedback

**Request:**
```json
{
  "suggestion_type": "medication",
  "suggestion_content": {...},
  "action": "accepted",
  "reason": "Patient preference"
}
```

### GET `/api/cds/preferences`
Get physician's learned preferences

### GET `/api/cds/analytics?days=30`
Get CDS usage analytics

## Usage

### 1. Backend Setup

The CDS system is automatically initialized when the Flask app starts. No additional configuration needed.

### 2. Frontend Integration

Include the CDS JavaScript in your HTML:

```html
<script src="/js/cds-ambient.js"></script>
```

The CDS sidebar will automatically appear and activate when a patient chart is opened.

### 3. Triggering CDS Analysis

Dispatch a custom event when opening a patient chart:

```javascript
const event = new CustomEvent('patientChartOpened', {
    detail: { patientId: 'PATIENT_ID' }
});
document.dispatchEvent(event);
```

### 4. Demo Page

Access the demo at: `frontend/pages/cds-demo.html`

## Knowledge Base

The system includes curated medical knowledge for:

### Conditions Covered
- Acute Coronary Syndrome
- Diabetes Mellitus
- Hypertension
- Respiratory Infections
- Pneumonia
- GERD
- Musculoskeletal Pain

### Medications Database
- Metformin (Diabetes)
- Empagliflozin (Diabetes)
- Lisinopril (Hypertension)
- Amlodipine (Hypertension)
- Amoxicillin (Infections)
- And more...

### Drug Interactions
- Warfarin + Aspirin
- Metformin + Contrast dye
- ACE Inhibitors + Potassium
- Statins + Macrolides
- And more...

## Physician Learning

The system learns from physician behavior:

### Tracked Actions
- **Accepted**: Suggestion was used
- **Dismissed**: Suggestion was rejected
- **Modified**: Suggestion was edited before use

### Adaptation
- Reduces frequency of repeatedly dismissed suggestions
- Prioritizes physician's preferred medications
- Adjusts suggestion count based on preference
- Provides analytics on acceptance rates

## Safety & Compliance

### Clinical Safety
- All suggestions are advisory only
- Physician maintains full control
- Critical alerts clearly marked
- Evidence-based recommendations

### Data Privacy
- No patient data leaves the system
- All analysis performed locally
- Audit trail maintained
- HIPAA-compliant design

## Extending the System

### Adding New Conditions

Edit `backend/app/ai_cds/knowledge_base.py`:

```python
self.ddx_database['new_symptom'] = [
    {
        'diagnosis': 'Condition Name',
        'confidence_factors': ['symptom1', 'symptom2'],
        'severity': 'moderate',
        'next_steps': ['Test 1', 'Test 2'],
        'citations': ['Guideline Reference']
    }
]
```

### Adding New Medications

```python
self.medication_database['condition'] = [
    {
        'drug': 'Drug Name',
        'class': 'Drug Class',
        'first_line': True,
        'contraindications': ['condition1'],
        'monitoring': ['Lab test'],
        'citations': ['Reference']
    }
]
```

### Adding Drug Interactions

```python
self.drug_interactions[('Drug1', 'Drug2')] = {
    'severity': 'major',
    'mechanism': 'Interaction mechanism',
    'clinical_effect': 'Effect description',
    'management': 'Management strategy',
    'citation': 'Reference'
}
```

## Future Enhancements

### Planned Features
1. **AI/ML Integration**: Connect to OpenAI or medical AI APIs for enhanced analysis
2. **Real-time Guidelines**: Integration with UpToDate, PubMed APIs
3. **Lab Result Analysis**: Automatic interpretation of lab values
4. **Imaging Integration**: Radiology report analysis
5. **Natural Language Processing**: Extract symptoms from free text
6. **Voice Integration**: Voice-activated CDS queries
7. **Mobile App**: Native mobile CDS interface
8. **Multi-language Support**: International guideline support

### Integration Opportunities
- Electronic Health Records (EHR) systems
- Laboratory Information Systems (LIS)
- Pharmacy systems for formulary checking
- Clinical guideline databases
- Medical literature APIs
- Drug interaction databases (e.g., Lexicomp, Micromedex)

## Testing

### Manual Testing
1. Open `frontend/pages/cds-demo.html`
2. Click "Activate AI Assistant"
3. Enter symptoms in the symptoms field
4. Focus on diagnosis field
5. Focus on prescription field
6. Test medication safety check

### API Testing

```bash
# Test CDS analysis
curl -X POST http://localhost:5000/api/cds/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patient_id": "PATIENT_ID",
    "context": {"symptoms": ["chest pain"]},
    "trigger_type": "passive"
  }'

# Test medication safety
curl -X POST http://localhost:5000/api/cds/medication-safety \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patient_id": "PATIENT_ID",
    "medication": "Warfarin"
  }'
```

## Performance Considerations

- Context analysis: < 100ms
- Suggestion generation: < 500ms
- Debounced input: 1.5 second delay
- Cached patient context
- Optimized database queries

## Support & Documentation

For questions or issues:
1. Check this README
2. Review code comments
3. Check API endpoint documentation
4. Review demo page examples

## License

Part of BharathMedicare Healthcare Platform

---

**Note**: This CDS system is designed as a clinical decision support tool. All suggestions are advisory and should be reviewed by qualified healthcare professionals. The system does not replace clinical judgment.
