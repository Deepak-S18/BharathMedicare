"""
CDS Engine - Main orchestrator for Clinical Decision Support
"""

from typing import Dict, List, Any, Optional
from datetime import datetime

from .context_analyzer import ContextAnalyzer
from .knowledge_base import KnowledgeBase
from .drug_interactions import DrugInteractionChecker
from .learning import PhysicianLearningSystem
from .gemini_integration import GeminiAI


class CDSEngine:
    """Main Clinical Decision Support Engine"""
    
    def __init__(self, db):
        self.db = db
        self.context_analyzer = ContextAnalyzer(db)
        self.knowledge_base = KnowledgeBase()
        self.drug_checker = DrugInteractionChecker()
        self.learning_system = PhysicianLearningSystem(db)
        self.gemini_ai = GeminiAI()  # AI enhancement with Gemini
    
    def analyze_and_suggest(self,
                           patient_id: str,
                           physician_id: str,
                           context_data: Dict,
                           trigger_type: str = 'passive') -> Dict[str, Any]:
        """
        Main entry point for CDS analysis
        
        Args:
            patient_id: Patient identifier
            physician_id: Physician identifier
            context_data: Current clinical context (symptoms, vitals, etc.)
            trigger_type: 'passive', 'diagnosis_field', 'prescription_field'
            
        Returns:
            Comprehensive CDS suggestions
        """
        try:
            # Analyze patient context
            print(f"📊 Step 1: Analyzing patient context...")
            patient_context = self.context_analyzer.analyze_patient_context(patient_id)
            
            if 'error' in patient_context:
                print(f"❌ Patient context error: {patient_context['error']}")
                return {'error': patient_context['error']}
            
            print(f"✅ Step 1 complete: Patient context retrieved")
            
            # Merge with current context data
            print(f"📊 Step 2: Merging context data...")
            full_context = {**patient_context, **context_data}
            print(f"✅ Step 2 complete: Context merged")
            
            # Generate suggestions based on trigger type
            print(f"📊 Step 3: Initializing suggestions...")
            suggestions = {
                'timestamp': datetime.utcnow().isoformat(),
                'patient_id': patient_id,
                'trigger_type': trigger_type,
                'differential_diagnosis': [],
                'medication_recommendations': [],
                'care_pathway': [],
                'alerts': [],
                'risk_factors': patient_context.get('risk_factors', [])
            }
            print(f"✅ Step 3 complete: Suggestions initialized")
            
            # Differential diagnosis suggestions
            if context_data.get('symptoms') or trigger_type == 'diagnosis_field':
                print(f"📊 Step 4: Generating differential diagnosis...")
                ddx = self._generate_differential_diagnosis(full_context)
                print(f"✅ Step 4a: DDx generated ({len(ddx)} items)")
                # Filter based on physician preferences
                ddx = self.learning_system.filter_suggestions(
                    physician_id, ddx, 'differential_diagnosis'
                )
                print(f"✅ Step 4b: DDx filtered ({len(ddx)} items)")
                suggestions['differential_diagnosis'] = ddx
            
            # Medication recommendations
            if context_data.get('diagnosis') or trigger_type == 'prescription_field':
                print(f"📊 Step 5: Generating medication recommendations...")
                med_recs = self._generate_medication_recommendations(full_context)
                print(f"✅ Step 5a: Medications generated ({len(med_recs)} items)")
                # Filter based on physician preferences
                med_recs = self.learning_system.filter_suggestions(
                    physician_id, med_recs, 'medication'
                )
                print(f"✅ Step 5b: Medications filtered ({len(med_recs)} items)")
                suggestions['medication_recommendations'] = med_recs
            
            # Care pathway suggestions
            print(f"📊 Step 6: Generating care pathway...")
            care_pathway = self._generate_care_pathway(full_context)
            suggestions['care_pathway'] = care_pathway
            print(f"✅ Step 6 complete: Care pathway generated ({len(care_pathway)} items)")
            
            # Critical alerts
            print(f"📊 Step 7: Generating alerts...")
            alerts = self._generate_alerts(full_context)
            suggestions['alerts'] = alerts
            print(f"✅ Step 7 complete: Alerts generated ({len(alerts)} items)")
            
            print(f"✅ All steps complete!")
            return suggestions
            
        except Exception as e:
            print(f"❌ Exception in analyze_and_suggest: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'error': f'CDS analysis failed: {str(e)}'}
    
    def check_medication_safety(self,
                               patient_id: str,
                               medication: str,
                               dose: Optional[str] = None) -> Dict[str, Any]:
        """
        Comprehensive medication safety check
        
        Args:
            patient_id: Patient identifier
            medication: Medication name
            dose: Optional dose information
            
        Returns:
            Safety check results
        """
        try:
            # Get patient context
            patient_context = self.context_analyzer.analyze_patient_context(patient_id)
            
            if 'error' in patient_context:
                return {'error': patient_context['error']}
            
            # Perform comprehensive interaction check
            safety_report = self.drug_checker.check_all_interactions(
                new_medication=medication,
                current_medications=patient_context.get('current_medications', []),
                allergies=patient_context.get('allergies', []),
                chronic_conditions=patient_context.get('chronic_conditions', []),
                renal_function=patient_context.get('renal_function')
            )
            
            # Add AI-enhanced safety verification
            ai_safety = self.gemini_ai.check_medication_safety(medication, patient_context)
            if ai_safety:
                # ai_safety is a string (the AI response text)
                safety_report['ai_safety_assessment'] = ai_safety
                safety_report['ai_citations'] = []
            
            # Add dosing recommendations
            safety_report['dosing'] = self._get_dosing_recommendations(
                medication, dose, patient_context
            )
            
            return safety_report
            
        except Exception as e:
            return {'error': f'Safety check failed: {str(e)}'}
    
    def record_physician_feedback(self,
                                 physician_id: str,
                                 suggestion_id: str,
                                 suggestion_type: str,
                                 suggestion_content: Dict,
                                 action: str,
                                 reason: Optional[str] = None) -> bool:
        """
        Record physician feedback on suggestions
        
        Args:
            physician_id: Physician identifier
            suggestion_id: Unique suggestion identifier
            suggestion_type: Type of suggestion
            suggestion_content: The suggestion content
            action: 'accepted', 'dismissed', 'modified'
            reason: Optional reason for action
            
        Returns:
            Success status
        """
        return self.learning_system.record_feedback(
            physician_id=physician_id,
            suggestion_type=suggestion_type,
            suggestion_content=suggestion_content,
            action=action,
            reason=reason
        )
    
    def _generate_differential_diagnosis(self, context: Dict) -> List[Dict]:
        """Generate differential diagnosis suggestions"""
        symptoms = context.get('symptoms', [])
        
        if not symptoms:
            return []
        
        # Convert symptoms to string if it's a list
        symptoms_str = ', '.join(symptoms) if isinstance(symptoms, list) else str(symptoms)
        
        print(f"🔍 Generating DDx for symptoms: {symptoms_str}")
        
        # Get DDx from knowledge base
        ddx_list = self.knowledge_base.get_differential_diagnosis(symptoms, context)
        
        # Enhance with AI if available
        print(f"🤖 Calling Gemini AI for differential diagnosis...")
        ai_enhancement = self.gemini_ai.enhance_differential_diagnosis(symptoms_str, context)
        if ai_enhancement:
            # ai_enhancement is a string (the AI response text)
            ddx_list.insert(0, {
                'diagnosis': 'AI-Enhanced Analysis',
                'confidence': 95,
                'severity': 'info',
                'supporting_evidence': ['Google Gemini AI', 'Latest medical research'],
                'next_steps': ['Review AI analysis below'],
                'citations': [],
                'ai_analysis': ai_enhancement,  # This is the string response from Gemini
                'actionable': True,
                'one_click_actions': [
                    {'action': 'view_ai_analysis', 'label': '🤖 View AI Analysis'}
                ]
            })
        
        # Enhance with actionable items
        for ddx in ddx_list:
            if 'actionable' not in ddx:
                ddx['actionable'] = True
            if 'one_click_actions' not in ddx:
                ddx['one_click_actions'] = self._generate_ddx_actions(ddx)
        
        return ddx_list
    
    def _generate_medication_recommendations(self, context: Dict) -> List[Dict]:
        """Generate medication recommendations"""
        diagnosis = context.get('diagnosis')
        
        if not diagnosis:
            # Try to infer from chronic conditions
            chronic_conditions = context.get('chronic_conditions', [])
            if chronic_conditions:
                diagnosis = chronic_conditions[0]
            else:
                return []
        
        # Get medication recommendations from knowledge base
        med_recs = self.knowledge_base.get_medication_recommendations(diagnosis, context)
        
        # Add safety checks for each medication
        for med in med_recs:
            med['safety_check'] = self.drug_checker.check_all_interactions(
                new_medication=med['drug'],
                current_medications=context.get('current_medications', []),
                allergies=context.get('allergies', []),
                chronic_conditions=context.get('chronic_conditions', [])
            )
            
            # Add one-click actions
            med['one_click_actions'] = [
                {'action': 'add_to_prescription', 'label': 'Add to Prescription'},
                {'action': 'view_details', 'label': 'View Full Details'},
                {'action': 'check_formulary', 'label': 'Check Insurance Coverage'}
            ]
        
        return med_recs
    
    def _generate_care_pathway(self, context: Dict) -> List[Dict]:
        """Generate care pathway suggestions"""
        pathway = []
        
        # Lab tests based on conditions
        chronic_conditions = context.get('chronic_conditions', [])
        
        if 'Diabetes' in chronic_conditions:
            pathway.append({
                'type': 'lab_test',
                'recommendation': 'HbA1c',
                'frequency': 'Every 3 months',
                'rationale': 'Monitor glycemic control',
                'citation': 'ADA Standards of Care 2024',
                'one_click_action': 'order_lab'
            })
            pathway.append({
                'type': 'lab_test',
                'recommendation': 'Lipid Panel',
                'frequency': 'Annually',
                'rationale': 'Cardiovascular risk assessment',
                'citation': 'ADA Standards of Care 2024',
                'one_click_action': 'order_lab'
            })
        
        if 'Hypertension' in chronic_conditions:
            pathway.append({
                'type': 'monitoring',
                'recommendation': 'Blood Pressure Monitoring',
                'frequency': 'Every visit',
                'rationale': 'Assess treatment efficacy',
                'citation': 'ACC/AHA Guidelines',
                'one_click_action': 'add_to_plan'
            })
        
        # Specialist referrals based on risk factors
        risk_factors = context.get('risk_factors', [])
        for risk in risk_factors:
            if risk['severity'] == 'high':
                if 'Diabetes' in risk['factor']:
                    pathway.append({
                        'type': 'referral',
                        'recommendation': 'Endocrinology Consultation',
                        'rationale': 'Complex diabetes management',
                        'urgency': 'routine',
                        'one_click_action': 'create_referral'
                    })
        
        return pathway
    
    def _generate_alerts(self, context: Dict) -> List[Dict]:
        """Generate critical alerts"""
        alerts = []
        
        # Check for critical risk factors
        risk_factors = context.get('risk_factors', [])
        for risk in risk_factors:
            if risk['severity'] == 'high':
                alerts.append({
                    'type': 'risk_alert',
                    'severity': 'high',
                    'message': f"High Risk: {risk['factor']}",
                    'description': risk['description'],
                    'action_required': True
                })
        
        # Check for missing critical information
        if not context.get('allergies'):
            alerts.append({
                'type': 'missing_info',
                'severity': 'moderate',
                'message': 'Allergy information not documented',
                'action_required': True,
                'suggested_action': 'Update patient allergies'
            })
        
        # Check for overdue screenings (based on age and conditions)
        demographics = context.get('demographics', {})
        age = demographics.get('age')
        
        if age and age > 45:
            # Check if diabetes screening is documented
            alerts.append({
                'type': 'preventive_care',
                'severity': 'low',
                'message': 'Consider diabetes screening',
                'rationale': 'Age >45 years',
                'citation': 'ADA Screening Guidelines'
            })
        
        return alerts
    
    def _generate_ddx_actions(self, ddx: Dict) -> List[Dict]:
        """Generate one-click actions for differential diagnosis"""
        actions = [
            {'action': 'add_to_diagnosis', 'label': 'Add to Diagnosis List'},
            {'action': 'order_tests', 'label': f"Order: {', '.join(ddx.get('next_steps', [])[:2])}"},
            {'action': 'view_guideline', 'label': 'View Clinical Guideline'}
        ]
        
        if ddx.get('severity') == 'critical':
            actions.insert(0, {'action': 'urgent_consult', 'label': '🚨 Urgent Consultation'})
        
        return actions
    
    def _get_dosing_recommendations(self, medication: str, dose: Optional[str], context: Dict) -> Dict:
        """Get dosing recommendations"""
        recommendations = {
            'standard_dose': None,
            'adjustments': [],
            'administration': None
        }
        
        # Standard dosing (would come from drug database in production)
        dosing_guide = {
            'Metformin': {
                'standard': '500mg twice daily, titrate to 1000mg twice daily',
                'max': '2000mg daily',
                'administration': 'Take with meals to reduce GI side effects'
            },
            'Lisinopril': {
                'standard': '10mg once daily',
                'max': '40mg daily',
                'administration': 'Can be taken with or without food'
            }
        }
        
        if medication in dosing_guide:
            guide = dosing_guide[medication]
            recommendations['standard_dose'] = guide['standard']
            recommendations['max_dose'] = guide.get('max')
            recommendations['administration'] = guide.get('administration')
        
        # Check for adjustments based on patient factors
        age = context.get('demographics', {}).get('age')
        if age and age > 65:
            recommendations['adjustments'].append('Consider lower starting dose in elderly patients')
        
        return recommendations
