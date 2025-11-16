"""
Context Analyzer - Analyzes patient data and clinical context
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from bson import ObjectId


class ContextAnalyzer:
    """Analyzes patient context to extract relevant clinical information"""
    
    def __init__(self, db):
        self.db = db
    
    def analyze_patient_context(self, patient_id: str) -> Dict[str, Any]:
        """
        Analyze complete patient context including vitals, history, labs, medications
        
        Args:
            patient_id: Patient's unique identifier
            
        Returns:
            Comprehensive patient context dictionary
        """
        try:
            # Fetch patient data
            patient = self.db.users.find_one({'_id': ObjectId(patient_id)})
            
            if not patient:
                print(f"❌ Patient not found: {patient_id}")
                return {'error': 'Patient not found'}
            
            print(f"✅ Patient found: {patient.get('name', 'Unknown')}")
            
            # Extract key clinical data with error handling for each step
            try:
                demographics = self._extract_demographics(patient)
            except Exception as e:
                print(f"⚠️ Demographics extraction error: {str(e)}")
                demographics = {}
            
            try:
                vitals = self._extract_vitals(patient)
            except Exception as e:
                print(f"⚠️ Vitals extraction error: {str(e)}")
                vitals = {}
            
            try:
                medical_history = self._extract_medical_history(patient)
            except Exception as e:
                print(f"⚠️ Medical history extraction error: {str(e)}")
                medical_history = {}
            
            try:
                risk_factors = self._calculate_risk_factors(patient)
            except Exception as e:
                print(f"⚠️ Risk factors calculation error: {str(e)}")
                risk_factors = []
            
            try:
                recent_records = self._get_recent_records(patient_id)
            except Exception as e:
                print(f"⚠️ Recent records error: {str(e)}")
                recent_records = []
            
            context = {
                'patient_id': str(patient['_id']),
                'demographics': demographics,
                'vitals': vitals,
                'medical_history': medical_history,
                'current_medications': patient.get('current_medications', []),
                'allergies': patient.get('allergies', []),
                'chronic_conditions': patient.get('chronic_conditions', []),
                'risk_factors': risk_factors,
                'recent_records': recent_records,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            print(f"✅ Context analysis complete for patient {patient_id}")
            return context
            
        except Exception as e:
            print(f"❌ Context analysis failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'error': f'Context analysis failed: {str(e)}'}
    
    def _extract_demographics(self, patient: Dict) -> Dict:
        """Extract demographic information"""
        age = None
        if patient.get('date_of_birth'):
            dob = patient['date_of_birth']
            if isinstance(dob, str):
                try:
                    dob = datetime.fromisoformat(dob.replace('Z', '+00:00'))
                except:
                    pass
            if isinstance(dob, datetime):
                age = (datetime.utcnow() - dob).days // 365
        
        return {
            'age': age,
            'gender': patient.get('gender'),
            'blood_group': patient.get('blood_group')
        }
    
    def _extract_vitals(self, patient: Dict) -> Dict:
        """Extract vital signs"""
        return {
            'height': patient.get('height'),
            'weight': patient.get('weight'),
            'bmi': self._calculate_bmi(patient.get('height'), patient.get('weight'))
        }
    
    def _calculate_bmi(self, height: Optional[float], weight: Optional[float]) -> Optional[float]:
        """Calculate BMI if height and weight are available"""
        try:
            # Convert to float if they're strings
            if height:
                height = float(height)
            if weight:
                weight = float(weight)
            
            if height and weight and height > 0:
                # Assuming height in cm, weight in kg
                height_m = height / 100
                return round(weight / (height_m ** 2), 2)
        except (ValueError, TypeError):
            # If conversion fails, return None
            pass
        return None
    
    def _extract_medical_history(self, patient: Dict) -> Dict:
        """Extract medical history"""
        return {
            'chronic_conditions': patient.get('chronic_conditions', []),
            'allergies': patient.get('allergies', []),
            'family_history': patient.get('family_history', [])
        }
    
    def _calculate_risk_factors(self, patient: Dict) -> List[Dict]:
        """Calculate patient risk factors"""
        risk_factors = []
        
        # Age-based risks
        age = None
        if patient.get('date_of_birth'):
            dob = patient['date_of_birth']
            if isinstance(dob, str):
                try:
                    dob = datetime.fromisoformat(dob.replace('Z', '+00:00'))
                except:
                    pass
            if isinstance(dob, datetime):
                age = (datetime.utcnow() - dob).days // 365
        
        if age and age > 65:
            risk_factors.append({
                'factor': 'Advanced Age',
                'severity': 'moderate',
                'description': 'Increased risk for cardiovascular and metabolic conditions'
            })
        
        # BMI-based risks
        bmi = self._calculate_bmi(patient.get('height'), patient.get('weight'))
        if bmi:
            if bmi > 30:
                risk_factors.append({
                    'factor': 'Obesity',
                    'severity': 'high',
                    'description': f'BMI {bmi} indicates obesity, increased cardiovascular risk'
                })
            elif bmi > 25:
                risk_factors.append({
                    'factor': 'Overweight',
                    'severity': 'moderate',
                    'description': f'BMI {bmi} indicates overweight status'
                })
        
        # Chronic condition risks
        chronic_conditions = patient.get('chronic_conditions', [])
        if 'Diabetes' in chronic_conditions:
            risk_factors.append({
                'factor': 'Diabetes',
                'severity': 'high',
                'description': 'Requires careful medication selection and monitoring'
            })
        
        if 'Hypertension' in chronic_conditions:
            risk_factors.append({
                'factor': 'Hypertension',
                'severity': 'high',
                'description': 'Cardiovascular risk factor, monitor BP regularly'
            })
        
        return risk_factors
    
    def _get_recent_records(self, patient_id: str, limit: int = 5) -> List[Dict]:
        """Get recent medical records"""
        try:
            records = list(self.db.records.find(
                {'patient_id': ObjectId(patient_id), 'is_deleted': False}
            ).sort('uploaded_at', -1).limit(limit))
            
            return [{
                'record_id': str(record['_id']),
                'file_name': record.get('file_name'),
                'file_type': record.get('file_type'),
                'description': record.get('description'),
                'uploaded_at': record.get('uploaded_at').isoformat() if record.get('uploaded_at') else None
            } for record in records]
            
        except Exception:
            return []
    
    def detect_context_changes(self, patient_id: str, new_data: Dict) -> List[str]:
        """
        Detect significant changes in patient context that should trigger CDS
        
        Args:
            patient_id: Patient identifier
            new_data: New data being entered (symptoms, vitals, etc.)
            
        Returns:
            List of trigger events
        """
        triggers = []
        
        # Check for new symptoms
        if new_data.get('symptoms'):
            triggers.append('new_symptoms')
        
        # Check for new lab results
        if new_data.get('lab_results'):
            triggers.append('new_lab_results')
        
        # Check for vital sign changes
        if new_data.get('vitals'):
            triggers.append('vital_signs_updated')
        
        # Check if moving to diagnosis field
        if new_data.get('field') == 'diagnosis':
            triggers.append('diagnosis_field_active')
        
        # Check if moving to prescription field
        if new_data.get('field') == 'prescription':
            triggers.append('prescription_field_active')
        
        return triggers
