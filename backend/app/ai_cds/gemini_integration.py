"""
Google Gemini AI Integration for Clinical Decision Support
Free and reliable AI-powered medical knowledge assistant
"""

import os
import google.generativeai as genai
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class GeminiAI:
    """Integration with Google Gemini AI for medical knowledge"""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            print("⚠️ Warning: GEMINI_API_KEY not set. AI enhancement disabled.")
            self.model = None
        else:
            try:
                genai.configure(api_key=self.api_key)
                # Use Gemini 2.0 Flash for medical queries (latest stable free model)
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                print("✅ Gemini AI initialized successfully with gemini-2.0-flash")
            except Exception as e:
                print(f"⚠️ Gemini AI initialization error: {str(e)}")
                self.model = None
    
    def generate_treatment_plan(self, patient_data: Dict) -> Optional[Dict]:
        """
        Generate comprehensive treatment plan using Gemini AI
        
        Args:
            patient_data: Patient information including symptoms, diagnosis, vitals
            
        Returns:
            Treatment plan with prescription and care instructions
        """
        if not self.model:
            return None
        
        try:
            # Build prompt
            symptoms = patient_data.get('symptoms', 'Not specified')
            diagnosis = patient_data.get('diagnosis', 'Not specified')
            age = patient_data.get('age', 'Unknown')
            gender = patient_data.get('gender', 'Unknown')
            chronic_conditions = patient_data.get('chronic_conditions', [])
            allergies = patient_data.get('allergies', [])
            current_medications = patient_data.get('current_medications', [])
            vitals = patient_data.get('vitals', {})
            
            prompt = f"""As a clinical decision support AI, generate a comprehensive treatment plan for this patient:

PATIENT PROFILE:
- Age: {age}
- Gender: {gender}
- Chronic Conditions: {', '.join(chronic_conditions) if chronic_conditions else 'None'}
- Known Allergies: {', '.join(allergies) if allergies else 'None'}
- Current Medications: {', '.join(current_medications) if current_medications else 'None'}

CURRENT PRESENTATION:
- Symptoms: {symptoms}
- Diagnosis: {diagnosis}
- Vital Signs: BP {vitals.get('blood_pressure', 'N/A')}, HR {vitals.get('heart_rate', 'N/A')}, Temp {vitals.get('temperature', 'N/A')}°F, SpO2 {vitals.get('spo2', 'N/A')}%

Please provide a detailed treatment plan with two sections:

PRESCRIPTION:
- List TABLETS with exact dosages, frequency, and duration (e.g., "Paracetamol 500mg - 1 tablet twice daily for 5 days")
- List SYRUPS/LIQUIDS if needed (e.g., "Cough Syrup - 10ml three times daily")
- List REQUIRED SCANS/TESTS (e.g., "Blood Test - CBC", "X-Ray Chest")
- Consider drug interactions with current medications
- Avoid medications the patient is allergic to
- Include monitoring requirements

CARE PLAN:
- Lifestyle modifications
- Dietary recommendations
- Exercise guidelines
- Monitoring schedule
- Follow-up appointments
- Warning signs to watch for
- Patient education points

Format your response clearly with "PRESCRIPTION:" and "CARE PLAN:" headers.
In PRESCRIPTION section, clearly label medications as tablets, syrups, or tests."""

            # Generate response
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return {
                    'content': response.text,
                    'model': 'Gemini Pro'
                }
            
            return None
            
        except Exception as e:
            print(f"Gemini AI error: {str(e)}")
            return None
    
    def enhance_differential_diagnosis(self, symptoms: str, patient_context: Dict) -> Optional[str]:
        """
        Get AI-enhanced differential diagnosis
        
        Args:
            symptoms: Patient symptoms
            patient_context: Patient medical history and context
            
        Returns:
            Enhanced differential diagnosis with reasoning
        """
        if not self.model:
            return None
        
        try:
            age = patient_context.get('age', 'Unknown')
            gender = patient_context.get('gender', 'Unknown')
            chronic_conditions = patient_context.get('chronic_conditions', [])
            
            prompt = f"""As a clinical AI assistant, provide a BRIEF differential diagnosis for:

PATIENT: {age} year old {gender}
SYMPTOMS: {symptoms}
MEDICAL HISTORY: {', '.join(chronic_conditions) if chronic_conditions else 'None'}

Provide a SHORT, CONCISE response with:
1. Top 3-5 most likely diagnoses (one line each)
2. Key tests to order (brief list)
3. Critical red flags (brief list)

Keep it SHORT and clinical - maximum 150 words total. Use bullet points."""

            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return response.text
            
            return None
            
        except Exception as e:
            print(f"Gemini AI error: {str(e)}")
            return None
    
    def check_medication_safety(self, medication: str, patient_context: Dict) -> Optional[str]:
        """
        Check medication safety and interactions
        
        Args:
            medication: Medication to check
            patient_context: Patient information
            
        Returns:
            Safety information and warnings
        """
        if not self.model:
            return None
        
        try:
            current_meds = patient_context.get('current_medications', [])
            allergies = patient_context.get('allergies', [])
            chronic_conditions = patient_context.get('chronic_conditions', [])
            
            prompt = f"""Check medication safety for:

MEDICATION: {medication}
CURRENT MEDICATIONS: {', '.join(current_meds) if current_meds else 'None'}
ALLERGIES: {', '.join(allergies) if allergies else 'None'}
CONDITIONS: {', '.join(chronic_conditions) if chronic_conditions else 'None'}

Respond in MAXIMUM 2 LINES:
- If SAFE: "Safe to use. No major concerns."
- If UNSAFE: "⚠️ Warning: [specific reason in 1 line]"

Be EXTREMELY brief."""

            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return response.text
            
            return None
            
        except Exception as e:
            print(f"Gemini AI error: {str(e)}")
            return None
