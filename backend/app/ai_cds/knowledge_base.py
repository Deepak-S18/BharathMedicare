"""
Knowledge Base - Medical knowledge, guidelines, and evidence-based recommendations
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class KnowledgeBase:
    """Medical knowledge base for evidence-based recommendations"""
    
    def __init__(self):
        # Initialize with curated medical knowledge
        # In production, this would connect to medical databases, APIs, etc.
        self._initialize_knowledge()
    
    def _initialize_knowledge(self):
        """Initialize medical knowledge databases"""
        
        # Differential diagnosis knowledge base
        self.ddx_database = {
            'chest_pain': [
                {
                    'diagnosis': 'Acute Coronary Syndrome',
                    'confidence_factors': ['chest_pain', 'dyspnea', 'diaphoresis', 'age>50', 'diabetes', 'hypertension'],
                    'severity': 'critical',
                    'next_steps': ['ECG', 'Troponin', 'Cardiology consult'],
                    'citations': ['AHA/ACC Guidelines 2021', 'PubMed: 33501848']
                },
                {
                    'diagnosis': 'Gastroesophageal Reflux Disease',
                    'confidence_factors': ['chest_pain', 'burning_sensation', 'worse_after_meals'],
                    'severity': 'low',
                    'next_steps': ['Trial of PPI', 'Lifestyle modifications'],
                    'citations': ['ACG Guidelines 2022']
                },
                {
                    'diagnosis': 'Musculoskeletal Pain',
                    'confidence_factors': ['chest_pain', 'tender_to_palpation', 'recent_trauma'],
                    'severity': 'low',
                    'next_steps': ['NSAIDs', 'Rest', 'Physical therapy if persistent'],
                    'citations': ['UpToDate: Chest Wall Pain']
                }
            ],
            'fever': [
                {
                    'diagnosis': 'Viral Upper Respiratory Infection',
                    'confidence_factors': ['fever', 'cough', 'rhinorrhea', 'myalgia'],
                    'severity': 'low',
                    'next_steps': ['Symptomatic treatment', 'Rest', 'Hydration'],
                    'citations': ['CDC Guidelines']
                },
                {
                    'diagnosis': 'Bacterial Pneumonia',
                    'confidence_factors': ['fever', 'productive_cough', 'dyspnea', 'chest_pain'],
                    'severity': 'high',
                    'next_steps': ['Chest X-ray', 'CBC', 'Blood cultures', 'Antibiotics'],
                    'citations': ['IDSA/ATS Guidelines 2019']
                }
            ],
            'diabetes': [
                {
                    'diagnosis': 'Type 2 Diabetes Mellitus',
                    'confidence_factors': ['hyperglycemia', 'polyuria', 'polydipsia', 'obesity', 'family_history'],
                    'severity': 'moderate',
                    'next_steps': ['HbA1c', 'Fasting glucose', 'Lipid panel', 'Renal function'],
                    'citations': ['ADA Standards of Care 2024']
                }
            ]
        }
        
        # Medication knowledge base
        self.medication_database = {
            'diabetes': [
                {
                    'drug': 'Metformin',
                    'class': 'Biguanide',
                    'first_line': True,
                    'contraindications': ['renal_impairment', 'liver_disease', 'heart_failure'],
                    'monitoring': ['Renal function', 'Vitamin B12'],
                    'drug_interactions': ['Contrast dye', 'Alcohol'],
                    'citations': ['ADA Guidelines 2024']
                },
                {
                    'drug': 'Empagliflozin',
                    'class': 'SGLT2 Inhibitor',
                    'first_line': False,
                    'benefits': ['Cardiovascular protection', 'Renal protection', 'Weight loss'],
                    'contraindications': ['eGFR<30'],
                    'monitoring': ['Renal function', 'Genital infections'],
                    'citations': ['EMPA-REG OUTCOME Trial']
                }
            ],
            'hypertension': [
                {
                    'drug': 'Amlodipine',
                    'class': 'Calcium Channel Blocker',
                    'first_line': True,
                    'contraindications': ['Severe aortic stenosis'],
                    'side_effects': ['Peripheral edema', 'Flushing'],
                    'monitoring': ['Blood pressure', 'Heart rate'],
                    'citations': ['JNC 8 Guidelines']
                },
                {
                    'drug': 'Lisinopril',
                    'class': 'ACE Inhibitor',
                    'first_line': True,
                    'contraindications': ['Pregnancy', 'Bilateral renal artery stenosis', 'Angioedema history'],
                    'monitoring': ['Renal function', 'Potassium', 'Blood pressure'],
                    'citations': ['ACC/AHA Guidelines 2017']
                }
            ],
            'infection': [
                {
                    'drug': 'Amoxicillin',
                    'class': 'Penicillin',
                    'indications': ['Respiratory infections', 'UTI', 'Otitis media'],
                    'contraindications': ['Penicillin allergy'],
                    'side_effects': ['Diarrhea', 'Rash'],
                    'citations': ['IDSA Guidelines']
                }
            ]
        }
        
        # Drug interaction database
        self.drug_interactions = {
            ('Metformin', 'Contrast dye'): {
                'severity': 'high',
                'description': 'Risk of lactic acidosis. Hold metformin 48h before and after contrast.',
                'citation': 'ACR Manual on Contrast Media'
            },
            ('Lisinopril', 'Spironolactone'): {
                'severity': 'moderate',
                'description': 'Risk of hyperkalemia. Monitor potassium levels closely.',
                'citation': 'Drug Interaction Database'
            },
            ('Warfarin', 'Aspirin'): {
                'severity': 'high',
                'description': 'Increased bleeding risk. Use with caution and monitor INR.',
                'citation': 'CHEST Guidelines'
            }
        }
        
        # Clinical guidelines database
        self.guidelines = {
            'diabetes_screening': {
                'title': 'Diabetes Screening Guidelines',
                'recommendation': 'Screen adults ≥35 years or those with risk factors',
                'source': 'ADA 2024',
                'url': 'https://diabetesjournals.org/care/issue/47/Supplement_1'
            },
            'hypertension_management': {
                'title': 'Hypertension Management',
                'recommendation': 'Target BP <130/80 for most adults',
                'source': 'ACC/AHA 2017',
                'url': 'https://www.ahajournals.org/guidelines'
            }
        }
    
    def get_differential_diagnosis(self, symptoms: List[str], patient_context: Dict) -> List[Dict]:
        """
        Generate differential diagnosis based on symptoms and patient context
        
        Args:
            symptoms: List of presenting symptoms
            patient_context: Patient demographic and medical history
            
        Returns:
            Ranked list of potential diagnoses with confidence scores
        """
        ddx_list = []
        
        # Search through DDx database
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            if symptom_lower in self.ddx_database:
                for diagnosis in self.ddx_database[symptom_lower]:
                    # Calculate confidence score
                    confidence = self._calculate_confidence(
                        diagnosis['confidence_factors'],
                        symptoms,
                        patient_context
                    )
                    
                    ddx_entry = {
                        'diagnosis': diagnosis['diagnosis'],
                        'confidence': confidence,
                        'severity': diagnosis['severity'],
                        'supporting_evidence': self._get_supporting_evidence(
                            diagnosis['confidence_factors'],
                            symptoms,
                            patient_context
                        ),
                        'next_steps': diagnosis['next_steps'],
                        'citations': diagnosis['citations']
                    }
                    ddx_list.append(ddx_entry)
        
        # Sort by confidence score
        ddx_list.sort(key=lambda x: x['confidence'], reverse=True)
        
        return ddx_list
    
    def get_medication_recommendations(self, condition: str, patient_context: Dict) -> List[Dict]:
        """
        Get medication recommendations for a condition
        
        Args:
            condition: Medical condition
            patient_context: Patient information including allergies, contraindications
            
        Returns:
            List of appropriate medication options
        """
        recommendations = []
        condition_lower = condition.lower()
        
        if condition_lower in self.medication_database:
            for med in self.medication_database[condition_lower]:
                # Check contraindications
                is_contraindicated = self._check_contraindications(
                    med.get('contraindications', []),
                    patient_context
                )
                
                if not is_contraindicated:
                    recommendations.append({
                        'drug': med['drug'],
                        'class': med['class'],
                        'first_line': med.get('first_line', False),
                        'benefits': med.get('benefits', []),
                        'monitoring': med.get('monitoring', []),
                        'side_effects': med.get('side_effects', []),
                        'drug_interactions': self._check_drug_interactions(
                            med['drug'],
                            patient_context.get('current_medications', [])
                        ),
                        'citations': med.get('citations', []),
                        'formulary_preferred': True  # Placeholder - would check actual formulary
                    })
        
        return recommendations
    
    def check_drug_interactions(self, new_drug: str, current_medications: List[str]) -> List[Dict]:
        """Check for drug-drug interactions"""
        interactions = []
        
        for current_med in current_medications:
            # Check both directions
            key1 = (new_drug, current_med)
            key2 = (current_med, new_drug)
            
            if key1 in self.drug_interactions:
                interaction = self.drug_interactions[key1].copy()
                interaction['drugs'] = [new_drug, current_med]
                interactions.append(interaction)
            elif key2 in self.drug_interactions:
                interaction = self.drug_interactions[key2].copy()
                interaction['drugs'] = [current_med, new_drug]
                interactions.append(interaction)
        
        return interactions
    
    def get_clinical_guideline(self, topic: str) -> Optional[Dict]:
        """Retrieve clinical guideline for a topic"""
        return self.guidelines.get(topic.lower())
    
    def _calculate_confidence(self, factors: List[str], symptoms: List[str], context: Dict) -> float:
        """Calculate confidence score for a diagnosis"""
        matches = 0
        total_factors = len(factors)
        
        if total_factors == 0:
            return 0.0
        
        symptoms_lower = [s.lower() for s in symptoms]
        
        for factor in factors:
            factor_lower = factor.lower()
            
            # Check symptoms
            if factor_lower in symptoms_lower:
                matches += 1
            # Check patient context
            elif factor_lower in str(context.get('chronic_conditions', [])).lower():
                matches += 1
            elif 'age>' in factor_lower:
                age_threshold = int(factor_lower.split('>')[1])
                if context.get('demographics', {}).get('age', 0) > age_threshold:
                    matches += 1
        
        return round((matches / total_factors) * 100, 1)
    
    def _get_supporting_evidence(self, factors: List[str], symptoms: List[str], context: Dict) -> List[str]:
        """Get list of supporting evidence for diagnosis"""
        evidence = []
        symptoms_lower = [s.lower() for s in symptoms]
        
        for factor in factors:
            if factor.lower() in symptoms_lower:
                evidence.append(f"Symptom: {factor}")
            elif factor.lower() in str(context.get('chronic_conditions', [])).lower():
                evidence.append(f"History: {factor}")
        
        return evidence
    
    def _check_contraindications(self, contraindications: List[str], context: Dict) -> bool:
        """Check if patient has any contraindications"""
        patient_conditions = context.get('chronic_conditions', [])
        patient_allergies = context.get('allergies', [])
        
        for contraindication in contraindications:
            if contraindication.lower() in [c.lower() for c in patient_conditions]:
                return True
            if contraindication.lower() in [a.lower() for a in patient_allergies]:
                return True
        
        return False
    
    def _check_drug_interactions(self, new_drug: str, current_medications: List[str]) -> List[Dict]:
        """Check for interactions with current medications"""
        return self.check_drug_interactions(new_drug, current_medications)
